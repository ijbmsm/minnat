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
import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { calcSajuServer } from '@/lib/saju/server';
import { buildFactSheet, type SajuFactSheet } from '@/lib/saju/factsheet';

// ── 요청 스키마 ──

const RequestSchema = z.object({
  year:        z.number().int().min(1880).max(2100),
  month:       z.number().int().min(1).max(12),
  day:         z.number().int().min(1).max(31),
  hour:        z.number().int().min(0).max(23).nullable(),
  sex:         z.enum(['male', 'female']),
  tier:        z.enum(['free', 'paid']).default('free'),
  type:        z.enum(['full', 'career', 'love']).default('full'),
  longitudeE:  z.number().min(-180).max(180).default(127.0),
  name:        z.string().max(20).optional(),
  concern:     z.string().max(200).optional(),
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

// ── Redis 캐시 (Upstash — 영구, serverless 친화적) ──
// 환경변수 없으면 null (로컬 개발 시 캐시 미사용)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

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
  const { dayMaster: dm, elements, elementTotal, tenGodCounts, bodyStrength, notableSignals, cautions, daeunStartAge, seyun, name, concern } = fs;

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
      return `  ${p.palace}주: ${p.stem}${ss} ${p.branch}(${p.sipshinBranch})`;
    })
    .join('\n');

  const seyunLines = seyun
    .map(s => `  ${s.year}년: ${s.stem}${s.branch} — 천간 ${s.sipshinStem} · 지지 ${s.sipshinBranch}`)
    .join('\n');

  const tokenBudget = opts.tier === 'paid' ? 5000 : 3000;

  const cautionNote = cautions.length > 0
    ? `\n[주의사항 — 이 항목은 단정 해석 금지]\n${cautions.map(c=>`- ${c}`).join('\n')}`
    : '';

  const nameRef = name ? `이름: ${name}` : '';
  const concernRef = concern ? `\n\n[사용자 고민/질문]\n"${concern}"\n→ 이 고민에 연결해서 해석해줘. 관련 섹션에서 직접 언급하고 사주 관점으로 답해.` : '';

  const system = `너는 한국 전통 사주명리 전문가야. 친구한테 사주 봐주듯이 써줘.
${nameRef ? `상대방 ${nameRef}. 이름으로 자연스럽게 불러줘.` : ''}
규칙:
1. notableSignals에 나온 사실만 근거로 써. 없는 사실 지어내지 마.
2. "~할 것이다" 단정 금지. "~하는 경향", "~를 경계할 만하다" 식으로.
3. 반말, 친근하게. 점집 말투 금지.
4. 각 섹션 4~6문장. 너무 짧거나 너무 길지 않게.
5. 구체적으로 써. "좋다" "나쁘다" 같은 뭉뚱그린 표현 말고, 어떤 상황에서 어떻게 나타나는지.
6. 신살·격국은 factsheet에 없으면 언급 금지.${cautionNote}${concernRef}`;

  // 타입별 섹션 정의
  const sections: string = opts.type === 'love'
    ? `1. 연애 스타일 — 이 사람이 연애에서 어떻게 행동하는지, 어떤 패턴이 반복되는지
2. 끌리는 상대 유형 — 십신·오행 기반, 어떤 에너지의 사람에게 끌리고 잘 맞는지
3. 관계에서 발목 잡히는 것 — 연애할 때 반복되는 문제 패턴
4. 지금 연애운 (${seyun[0]?.year}년 세운 기준) — 올해 연애 흐름과 타이밍`
    : opts.type === 'career'
    ? `1. 직업 적성 — 어떤 일에서 강점이 나오는지, 맞는 환경과 안 맞는 환경
2. 돈과의 관계 — 재물을 어떻게 버는지, 어떻게 쓰는지, 주의할 점
3. 직장 vs 사업 — 이 차트에서 어느 쪽이 더 맞는지와 이유
4. 올해 직업·재물운 (${seyun[0]?.year}년 세운 기준) — 올해 커리어 흐름`
    : /* full */
    `1. 나는 어떤 사람 — ${dm.stem} 일간의 본질 + 이 차트만의 특징 (오행·십신 조합 기반)
2. 연애 스타일 — 어떻게 사랑하고, 어떤 패턴이 반복되는지
3. 직업·재물 성향 — 어떤 일에서 빛나고, 돈과의 관계
4. ${seyun[0]?.year}년 흐름 — 올해 세운(${seyun[0]?.stem}${seyun[0]?.branch}) 기준 전반적인 운의 방향
5. ${seyun[1]?.year}년 예고 — 내년 세운(${seyun[1]?.stem}${seyun[1]?.branch}) 기준 미리 알아둘 것
6. 지금 가장 필요한 것 — 이 사람한테 솔직하게 해주고 싶은 한 마디`;

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

[세운]
${seyunLines}

[이 차트의 두드러진 특징]
${notableSignals.map(s=>`- ${s}`).join('\n')}

아래 섹션별로 작성해줘. (총 ${tokenBudget}토큰 이내)
JSON 배열만 출력: [{"title":"...", "body":"..."}, ...]

${sections}`;

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

  const { year, month, day, hour, sex, tier, type, longitudeE, name, concern } = body;

  // 사주 계산 (서버, 파일시스템)
  let fp;
  try {
    fp = calcSajuServer(year, month, day, hour, sex, longitudeE);
  } catch (err) {
    return NextResponse.json({ error: `사주 계산 오류: ${err instanceof Error ? err.message : err}` }, { status: 500 });
  }

  // 팩트시트
  const fs = buildFactSheet(fp, tier, type, { name, concern });
  // concern이 있으면 캐시 키에 포함 (고민 다르면 다른 해석)
  const concernHash = concern
    ? `:q${Buffer.from(concern).toString('base64').slice(0, 12)}`
    : '';
  const cacheKey = fs.meta.cacheKey + concernHash;

  // 캐시 확인
  if (redis) {
    const hit = await redis.get<string>(cacheKey);
    if (hit) {
      try {
        const sections = parsesections(hit);
        const response: ReadingResponse = { cacheKey, cached: true, sections, tier, cautions: fs.cautions };
        return NextResponse.json(response);
      } catch {
        // 캐시 손상 → 재생성
        await redis.del(cacheKey);
      }
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

  // 캐시 저장 (영구)
  if (redis) await redis.set(cacheKey, raw);

  const response: ReadingResponse = { cacheKey, cached: false, sections, tier, cautions: fs.cautions };
  return NextResponse.json(response);
}
