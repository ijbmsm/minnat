/**
 * POST /api/saju/reading
 *
 * 서버사이드 사주 AI 해석 엔드포인트.
 * seolgi.json → engine → factsheet → LLM (Anthropic) → JSON 응답
 *
 * 캐시 키: saju:r:{version}:{tier}:{type}:{year.gz}-{month.gz}-{day.gz}-{hour.gz|'x'}
 * 차트 = 불변 → 동일 출생정보 재요청 시 캐시 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { calcSajuServer } from '@/lib/saju/server';
import { buildFactSheet, type SajuFactSheet } from '@/lib/saju/factsheet';

// ── 요청 스키마 ──

const RequestSchema = z.object({
  year:   z.number().int().min(1880).max(2100),
  month:  z.number().int().min(1).max(12),
  day:    z.number().int().min(1).max(31),
  hour:   z.number().int().min(0).max(23).nullable(),
  sex:    z.enum(['male', 'female']),
  tier:   z.enum(['free', 'paid']).default('free'),
  type:   z.enum(['full', 'career', 'love']).default('full'),
});

// ── 응답 타입 ──

export interface ReadingSection {
  title: string;
  body:  string;
}

export interface ReadingResponse {
  cacheKey:  string;
  cached:    boolean;
  sections:  ReadingSection[];
  tier:      'free' | 'paid';
  cautions:  string[];
}

// ── 인메모리 캐시 (프로세스 내 — Vercel Fluid Compute에서 인스턴스 재사용 시 유효) ──
const memCache = new Map<string, string>();

// ── Anthropic 클라이언트 ──
let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

// ── 프롬프트 생성 ──

function buildPrompt(
  fs: SajuFactSheet,
  opts: { tier: 'free' | 'paid'; type: 'full' | 'career' | 'love' },
): { system: string; user: string } {
  const { dayMaster: dm, elements, elementTotal, tenGodCounts, bodyStrength, notableSignals, cautions, daeunStartAge } = fs;

  const elementLines = Object.entries(elements)
    .map(([el, cnt]) => `  ${el}: ${cnt}/${elementTotal} (${Math.round(cnt/elementTotal*100)}%)`)
    .join('\n');

  const tenGodLines = Object.entries(tenGodCounts)
    .filter(([,cnt]) => (cnt ?? 0) > 0)
    .sort(([,a],[,b]) => (b??0)-(a??0))
    .map(([tg, cnt]) => `  ${tg}: ${cnt}회`)
    .join('\n');

  const pillarLines = fs.pillars
    .map(p => {
      const ss = p.sipshinStem ? `(${p.sipshinStem})` : '(일간)';
      const sb = `(${p.sipshinBranch})`;
      return `  ${p.palace}주: ${p.stem}${ss} ${p.branch}${sb}`;
    })
    .join('\n');

  const sectionCount = opts.tier === 'free' ? 4 : 6;
  const tokenBudget  = opts.tier === 'free' ? 2000 : 4000;

  const freeSections = `
1. 일간 핵심 (${dm.stem} 일간의 본질과 이 차트만의 특징)
2. 오행 균형 (과다·부재 원소와 실생활 영향)
3. 십신 패턴 (가장 두드러진 십신 2~3개와 그 의미)
4. 한 줄 조언 (지금 이 사람에게 가장 필요한 것)`.trim();

  const paidExtra = opts.tier === 'paid' ? `
5. 관계 성향 (인간관계·연애에서 나타나는 패턴)
6. 대운 흐름 (${daeunStartAge}세 대운 시작 기준, 현재 운의 방향성)` : '';

  const cautionNote = cautions.length > 0
    ? `\n\n[절대 지켜야 할 주의사항]\n${cautions.map(c=>`- ${c}`).join('\n')}`
    : '';

  const system = `너는 한국 전통 사주명리 전문가야. 다음 7가지 규칙을 반드시 지켜:

1. notableSignals에 나온 사실만 해석의 근거로 써라. 없는 사실 절대 지어내지 마.
2. "~할 것이다", "~하게 된다" 같은 단정적 운명 예언 금지. "~하는 경향이 있다", "~을 경계할 만하다" 식으로.
3. 한국어 반말 · 친구한테 말하듯. 딱딱한 존댓말이나 점집 말투 금지.
4. 각 섹션은 3~5문장. 길게 늘이지 말 것.
5. cautions에 명시된 항목은 단정 해석 금지 — 불확실함 명시.
6. 출처 없는 신살·격국 언급 금지. factsheet에 없는 건 꺼내지 마.
7. 종교적·미신적 어투 금지.
${cautionNote}`;

  const user = `[차트 데이터]
일간: ${dm.stem}(${dm.hanja}) · ${dm.element} · ${dm.yang ? '양' : '음'}
이미지: ${dm.image}

[사주 8자]
${pillarLines}

[오행 분포]
${elementLines}
신강/신약: ${bodyStrength === 'strong' ? '신강' : bodyStrength === 'weak' ? '신약' : '중화'}

[십신 분포]
${tenGodLines}

[이 차트의 두드러진 특징 (notableSignals)]
${notableSignals.map(s=>`- ${s}`).join('\n')}

위 데이터를 바탕으로 아래 ${sectionCount}개 섹션을 작성해줘. (총 ${tokenBudget}토큰 이내)
각 섹션은 JSON 형태로: [{"title":"...", "body":"..."}, ...]

${freeSections}${paidExtra}

JSON 배열만 출력, 다른 텍스트 없이.`;

  return { system, user };
}

// ── LLM 호출 ──

async function callLLM(
  fs: SajuFactSheet,
  opts: { tier: 'free' | 'paid'; type: 'full' | 'career' | 'love' },
): Promise<string> {
  const { system, user } = buildPrompt(fs, opts);
  const model   = opts.tier === 'paid' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
  const maxToks = opts.tier === 'paid' ? 4000 : 2000;

  const msg = await getAnthropic().messages.create({
    model,
    max_tokens: maxToks,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const textBlock = msg.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('LLM 응답 없음');
  return textBlock.text.trim();
}

// ── JSON 파싱 헬퍼 ──

function parsesections(raw: string): ReadingSection[] {
  // LLM이 markdown 코드블록으로 감쌀 경우 벗기기
  const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) throw new Error('LLM이 배열을 반환하지 않음');
  return parsed.map((s: { title?: unknown; body?: unknown }) => ({
    title: String(s.title ?? ''),
    body:  String(s.body  ?? ''),
  }));
}

// ── Route Handler ──

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY 미설정' }, { status: 503 });
  }

  // 파싱 & 검증
  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 });
  }

  const { year, month, day, hour, sex, tier, type } = body;

  // 사주 계산 (서버, 파일시스템)
  let fp;
  try {
    fp = calcSajuServer(year, month, day, hour, sex);
  } catch (err) {
    return NextResponse.json({ error: `사주 계산 오류: ${err instanceof Error ? err.message : err}` }, { status: 500 });
  }

  // 팩트시트
  const fs = buildFactSheet(fp, tier, type);
  const cacheKey = fs.meta.cacheKey;

  // 캐시 확인
  const cached = memCache.get(cacheKey);
  if (cached) {
    try {
      const sections = parsesections(cached);
      const response: ReadingResponse = { cacheKey, cached: true, sections, tier, cautions: fs.cautions };
      return NextResponse.json(response);
    } catch {
      // 캐시 손상 → 재생성
      memCache.delete(cacheKey);
    }
  }

  // LLM 호출
  let raw: string;
  try {
    raw = await callLLM(fs, { tier, type });
  } catch (err) {
    return NextResponse.json({ error: `AI 해석 실패: ${err instanceof Error ? err.message : err}` }, { status: 502 });
  }

  // 결과 파싱
  let sections: ReadingSection[];
  try {
    sections = parsesections(raw);
  } catch {
    return NextResponse.json({ error: 'AI 응답 파싱 실패', raw }, { status: 502 });
  }

  // 캐시 저장
  memCache.set(cacheKey, raw);

  const response: ReadingResponse = { cacheKey, cached: false, sections, tier, cautions: fs.cautions };
  return NextResponse.json(response);
}
