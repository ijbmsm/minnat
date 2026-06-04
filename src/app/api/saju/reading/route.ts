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
import { Ratelimit } from '@upstash/ratelimit';
import { z } from 'zod';
import { calcSajuServer } from '@/lib/saju/server';
import { buildFactSheet, type SajuFactSheet } from '@/lib/saju/factsheet';
import { STEM_DATA, BRANCH_DATA, type Sipshin } from '@/lib/saju/constants';
import { getSipshin, getBranchSipshin } from '@/lib/saju/sipshin';
import { createClient } from '@/lib/supabase/server';

// ── 요청 스키마 ──

const RequestSchema = z.object({
  year:        z.number().int().min(1880).max(2100),
  month:       z.number().int().min(1).max(12),
  day:         z.number().int().min(1).max(31),
  hour:             z.number().int().min(0).max(23).nullable(),
  minute:           z.number().int().min(0).max(59).default(0),
  dayBoundaryRule:  z.enum(['midnight', 'zi_hour']).default('midnight'),
  applyHapHwa:      z.boolean().default(false),
  sex:              z.enum(['male', 'female']),
  tier:        z.enum(['free', 'paid']).default('free'),
  type:        z.enum(['full', 'today', 'love', 'career']).default('full'),
  longitudeE:  z.number().min(-180).max(180).default(127.0),
  name:        z.string().max(20).optional(),
  concern:     z.string().max(200).optional(),
});

// ── 응답 타입 ──

export interface ReadingSection {
  title: string;
  body:  string;
}

export interface TodayPillar {
  stem:          string;
  branch:        string;
  sipshinStem:   string;
  sipshinBranch: string;
}

export interface ReadingResponse {
  cacheKey:     string;
  cached:       boolean;
  sections:     ReadingSection[];
  tier:         'free' | 'paid';
  cautions:     string[];
  todayPillar?: TodayPillar;
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

// ── Rate Limiting (IP 기준 분당 5회) ──
const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: false,
    })
  : null;

// ── Anthropic 클라이언트 ──
let _anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

// ── 렌즈: 타입별 초점 신호 ──

type ReadingType = 'full' | 'today' | 'love' | 'career';

// 홍염살: 일간 기준 지지 (이성 매력·관능)
const HONGYEOM_MAP: Partial<Record<string, string>> = {
  갑:'오', 을:'신', 병:'인', 무:'인', 정:'미', 기:'미',
  경:'술', 신:'오', 임:'자', 계:'신',
};

function loveFocusSignals(fs: SajuFactSheet, sex: 'male' | 'female'): string[] {
  const signals: string[] = [];
  // 배우자성: 여=정관/편관, 남=정재/편재
  const spouseStars: readonly Sipshin[] = sex === 'female'
    ? ['정관', '편관']
    : ['정재', '편재'];

  // 배우자성 위치 · 오행 — 어느 기둥 어느 위치에 있는지
  let hasSpouse = false;
  for (const p of fs.pillars) {
    if (p.sipshinStem && spouseStars.includes(p.sipshinStem as typeof spouseStars[number])) {
      signals.push(`배우자성 ${p.sipshinStem}(${p.stemElement}) — ${p.palace}주 천간`);
      hasSpouse = true;
    }
    if (spouseStars.includes(p.sipshinBranch as typeof spouseStars[number])) {
      signals.push(`배우자성 ${p.sipshinBranch}(${p.branchElement}) — ${p.palace}주 지지`);
      hasSpouse = true;
    }
  }
  if (!hasSpouse) {
    signals.push(`배우자성(${spouseStars.join('/')}) 없음 — 만남 늦거나 독립적 삶 선호 경향`);
  }

  // 배우자궁(일지) — 인연의 성격
  const dayPillar = fs.pillars.find(p => p.palace === '일');
  if (dayPillar) {
    signals.push(`배우자궁(일지): ${dayPillar.branch}(${dayPillar.sipshinBranch}·${dayPillar.branchElement})`);
  }

  // 일지 충 — 배우자궁 불안정
  for (const [a, b] of fs.advanced.hapChung.branchChungs) {
    if (dayPillar && (a === dayPillar.branch || b === dayPillar.branch)) {
      signals.push(`일지 충(${a}${b}충): 배우자궁 불안정 — 연애 변동·이별 반복 경향`);
    }
  }

  // 기신 — 피해야 할 상대 오행
  if (fs.advanced.yongSin.gisin) {
    signals.push(`기신: ${fs.advanced.yongSin.gisin} — 이 오행 강한 상대가 갈등 유발원`);
  }

  // 도화살
  for (const s of fs.sinsal) {
    if (s.name === '도화살') signals.push(`도화살(${s.branches.join('')}): 이성 접촉 많음·매력 발산`);
  }

  // 홍염살 (일간 기준 지지 체크)
  const hyBranch = HONGYEOM_MAP[fs.dayMaster.stem];
  if (hyBranch && fs.pillars.some(p => p.branch === hyBranch)) {
    signals.push(`홍염살(${hyBranch}): 강한 이성 매력·관능적 분위기`);
  }

  // 식상 — 매력·어필 무기
  const sikSang = (fs.tenGodCounts['식신'] ?? 0) + (fs.tenGodCounts['상관'] ?? 0);
  if (sikSang >= 2) signals.push(`식상(식신+상관) ${sikSang}개 — 매력·표현력·개성 강함`);
  else if (sikSang === 1) signals.push(`식상 1개 — 표현력 보통`);
  else signals.push('식상 없음 — 감정 표현 서툰 경향');

  // 신강약 (연애 관계 주도권과 직결)
  signals.push(`신강약: ${fs.bodyStrength === 'strong' ? '신강 — 주도적·독립적 연애' : fs.bodyStrength === 'weak' ? '신약 — 의존적·수용적 연애' : '중화 — 유연한 연애 스타일'}`);

  // 대운 배우자성 타이밍 — 인연이 들어오는 운
  const daeunTiming: string[] = [];
  for (const d of fs.daeun) {
    const matchStem   = spouseStars.includes(d.sipshinStem   as typeof spouseStars[number]);
    const matchBranch = spouseStars.includes(d.sipshinBranch as typeof spouseStars[number]);
    if (matchStem || matchBranch) {
      const star = matchStem ? d.sipshinStem : d.sipshinBranch;
      daeunTiming.push(`${d.startAge}세(${d.startYear}년~): ${d.stem}${d.branch} — ${star} 대운 진입`);
    }
  }
  if (daeunTiming.length) {
    signals.push(`인연 대운 타이밍: ${daeunTiming.join(' / ')}`);
  } else {
    signals.push('대운에서 배우자성 직접 진입 없음 — 세운·일운으로 만남 시기 탐색 필요');
  }

  // 세운 배우자성 활성화
  for (const s of fs.seyun) {
    const matchStem   = spouseStars.includes(s.sipshinStem   as typeof spouseStars[number]);
    const matchBranch = spouseStars.includes(s.sipshinBranch as typeof spouseStars[number]);
    if (matchStem || matchBranch) {
      signals.push(`${s.year}년 세운(${s.stem}${s.branch}): 배우자성 활성화 — 인연 만남 가능 시기`);
    }
  }

  return signals;
}

function careerFocusSignals(fs: SajuFactSheet): string[] {
  const signals: string[] = [];
  signals.push(`격국: ${fs.advanced.geokGuk.name}${fs.advanced.geokGuk.projected ? ' (투간 확인)' : ' (추정)'}`);
  signals.push(`용신: ${fs.advanced.yongSin.yongsin} · 기신: ${fs.advanced.yongSin.gisin}`);
  const bs = fs.bodyStrength;
  signals.push(`신강약: ${bs === 'strong' ? '신강 → 독립·사업 지향' : bs === 'weak' ? '신약 → 조직·협업 유리' : '중화 → 유연 적용'}`);
  const gwan = (fs.tenGodCounts['정관'] ?? 0) + (fs.tenGodCounts['편관'] ?? 0);
  const sik  = (fs.tenGodCounts['식신'] ?? 0) + (fs.tenGodCounts['상관'] ?? 0);
  const jae  = (fs.tenGodCounts['정재'] ?? 0) + (fs.tenGodCounts['편재'] ?? 0);
  signals.push(`관성(조직) ${gwan} / 식상(기술·창작) ${sik} / 재성(영업·사업) ${jae}`);
  const wolPillar = fs.pillars.find(p => p.palace === '월');
  if (wolPillar) {
    signals.push(`직업궁(월주): 천간 ${wolPillar.sipshinStem ?? '일간'} · 지지 ${wolPillar.sipshinBranch}`);
  }
  for (const s of fs.sinsal) {
    if (['역마살', '화개살', '양인살'].includes(s.name)) {
      signals.push(`${s.name}(${s.branches.join('')}): ${s.desc}`);
    }
  }
  // 오행 과다/부재 (일부)
  signals.push(...fs.notableSignals.filter(s => s.includes('세력') || s.includes('격국')).slice(0, 3));
  return signals;
}

const TOKEN_BUDGET: Record<ReadingType, { free: number; paid: number }> = {
  full:   { free: 3000, paid: 5000 },
  love:   { free: 3500, paid: 5500 },
  career: { free: 2500, paid: 4000 },
  today:  { free: 1500, paid: 2500 },
};

// ── 프롬프트 생성 ──

function buildPrompt(
  fs: SajuFactSheet,
  opts: {
    tier: 'free' | 'paid';
    type: ReadingType;
    sex: 'male' | 'female';
    todayPillar?: { stem: string; branch: string; sipshinStem: string; sipshinBranch: string };
  },
): { system: string; user: string } {
  const { dayMaster: dm, elements, elementTotal, tenGodCounts, bodyStrength, cautions, seyun, name, concern } = fs;
  const adv = fs.advanced;
  const { type, tier, sex } = opts;

  // 렌즈별 초점 신호
  const focusSignals =
    type === 'love'   ? loveFocusSignals(fs, sex) :
    type === 'career' ? careerFocusSignals(fs) :
    fs.notableSignals;

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

  const tokenBudget = TOKEN_BUDGET[type][tier];

  const cautionNote = cautions.length > 0
    ? `\n[주의사항 — 이 항목은 단정 해석 금지]\n${cautions.map(c => `- ${c}`).join('\n')}`
    : '';

  const concernRef = concern
    ? `\n\n[사용자 고민/질문]\n"${concern}"\n→ 이 고민에 연결해서 해석해. 관련 섹션에서 직접 언급하고 사주 관점으로 답해.`
    : '';

  // 타입별 페르소나
  const PERSONA: Record<ReadingType, string> = {
    full:   '사주 전반을 균형 있게 봐주는 친구. 성격·연애·직업·운 흐름 전부 짚어줘.',
    love:   '연애 전문가 친구. 배우자성·기신·도화·식상 중심으로 읽어줘. 각 섹션은 구체적 인물상·연도·행동법을 포함해야 해 — "좋은 사람 만날 거야" 같은 뭉뚱그린 말은 절대 금지.',
    career: '직업·재물 전문가 친구. 격국·용신·관식재 비중·역마 중심으로 읽어줘.',
    today:  '오늘 하루 에너지 전문가. 일진×원국 작용을 짧고 명확하게.',
  };

  const system = `너는 한국 전통 사주명리 전문가야. ${PERSONA[type]}
${name ? `참고 이름: ${name} (이름 직접 사용 금지).` : ''}
규칙:
1. 상대방은 반드시 '너'로만 불러. 이름·3인칭('그', '이 사람') 표현 절대 금지.
2. [초점 신호]에 나온 팩트만 근거로 써. 없는 사실 지어내지 마.
3. "~할 것이다" 단정 금지. "~하는 경향", "~를 경계할 만하다" 식으로.
4. 반말, 친근하게. 점집 말투 금지.
5. 각 섹션 4~6문장. 너무 짧거나 너무 길지 않게.
6. 구체적으로 써. "좋다" "나쁘다" 같은 뭉뚱그린 표현 말고, 어떤 상황에서 어떻게 나타나는지.
7. 신살·격국은 팩트시트에 없으면 언급 금지.${cautionNote}${concernRef}`;

  // 타입별 섹션 정의
  const tp = opts.todayPillar;
  const sections: string =
    type === 'love' ? (
`1. 내 연애 방식의 민낯 — 연애에서 반복되는 행동 패턴과 진짜 원인 (배우자궁·일간 기반)
2. 내 인연의 모습 + 만남 시기 — 배우자성 오행·십신·위치로 보는 상대의 성향·직업군·분위기, 그리고 대운/세운 기준 만남이 열리는 시기 (구체적 나이대·연도)
3. 결혼運 · 흔들리는 시기 — 평생 연애 타임라인: 인연이 들어오는 대운, 반대로 일지충·배우자성 손상으로 갈등이 생기기 쉬운 시기 (연도 명시, 위기는 "이 시기엔 조급함 주의" 프레임으로)
4. 피해야 할 유형 — 끌리지만 나를 망치는 상대 (기신 오행·십신 기반, 구체적 성향·직업·말투)
5. 나의 치명적 매력 + 어필법 — 도화·홍염·식상으로 보는 나의 이성 무기와 실제로 어필되는 행동법`
    ) : type === 'career' ? (
`1. 어울리는 일의 방향 — 격국·십신·용신 기반, 어떤 종류의 일에서 빛나는지
2. 직장 vs 독립 — 신강약·관식재 비중 기반, 조직과 사업 중 어느 쪽 구조인지
3. 재물 성향 — 돈을 어떻게 버는 스타일인지, 어디서 새기 쉬운지
4. 지금 직업·재물 흐름 (${seyun[0]?.year}년 세운 기준) — 올해 커리어 타이밍`
    ) : type === 'today' ? (
`오늘 일진: ${tp ? `${tp.stem}${tp.branch} (천간 ${tp.sipshinStem} · 지지 ${tp.sipshinBranch})` : '(정보 없음 — 오늘 날짜 기준 추론)'}
1. 오늘 하루 전반 — 일진이 이 차트에 어떻게 작용하는지, 에너지 방향
2. 오늘 집중할 것 — 유리한 행동 방향, 잘 흘러가는 영역
3. 오늘 조심할 것 — 마찰이 생기기 쉬운 부분
4. 오늘의 한 마디 — 솔직하게 해주고 싶은 말 한 문장`
    ) : /* full */ (
`1. 나는 어떤 사람 — ${dm.stem} 일간의 본질 + 이 차트만의 특징 (오행·십신 조합)
2. 연애 스타일 — 어떻게 사랑하고, 어떤 패턴이 반복되는지
3. 직업·재물 성향 — 어떤 일에서 빛나고, 돈과의 관계
4. ${seyun[0]?.year}년 흐름 — 올해 세운(${seyun[0]?.stem}${seyun[0]?.branch}) 기준 전반 운의 방향
5. ${seyun[1]?.year}년 예고 — 내년 세운(${seyun[1]?.stem}${seyun[1]?.branch}) 기준 미리 알아둘 것
6. 지금 가장 필요한 것 — 솔직하게 해주고 싶은 한 마디`
    );

  const user = `[차트 데이터]
일간: ${dm.stem}(${dm.hanja}) · ${dm.element} · ${dm.yang ? '양' : '음'}
이미지: ${dm.image}

[격국 · 용신]
격국: ${adv.geokGuk.name}${adv.geokGuk.projected ? ' (투간 확인)' : ' (추정)'}
신강약: ${bodyStrength === 'strong' ? '신강' : bodyStrength === 'weak' ? '신약' : '중화'}
용신: ${adv.yongSin.yongsin}(${adv.yongSin.label}) · 기신: ${adv.yongSin.gisin}
사령신: ${adv.strengths.salyeong.stem}(${adv.strengths.salyeong.element})

[사주 8자]
${pillarLines}

[오행 세력]
${elementLines}

[십신 분포]
${tenGodLines}

[세운]
${seyunLines}

[초점 신호 — 이 렌즈(${type})에서 가장 중요한 팩트]
${focusSignals.map(s => `- ${s}`).join('\n')}

아래 섹션별로 작성해줘. (총 ${tokenBudget}토큰 이내)
JSON 배열만 출력: [{"title":"...", "body":"..."}, ...]

${sections}`;

  return { system, user };
}

// ── LLM 호출 ──

async function callLLM(
  fs: SajuFactSheet,
  opts: { tier: 'free' | 'paid'; type: ReadingType; sex: 'male' | 'female'; todayPillar?: { stem: string; branch: string; sipshinStem: string; sipshinBranch: string } },
): Promise<string> {
  const { system, user } = buildPrompt(fs, opts);
  const model   = opts.tier === 'paid' ? 'claude-sonnet-4-6' : 'claude-haiku-4-5-20251001';
  const maxToks = Math.round(TOKEN_BUDGET[opts.type][opts.tier] * 0.8);

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

  // Rate limiting
  if (ratelimit) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
    const { success, limit, remaining } = await ratelimit.limit(`saju:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429, headers: { 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': String(remaining) } },
      );
    }
  }

  // 파싱 & 검증
  let body: z.infer<typeof RequestSchema>;
  try {
    body = RequestSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 });
  }

  const { year, month, day, hour, minute, dayBoundaryRule, sex, tier, type, longitudeE, name, concern, applyHapHwa } = body;

  // 사주 계산 (서버, 파일시스템)
  let fp;
  try {
    fp = calcSajuServer(year, month, day, hour, sex, longitudeE, minute, dayBoundaryRule);
  } catch (err) {
    return NextResponse.json({ error: `사주 계산 오류: ${err instanceof Error ? err.message : err}` }, { status: 500 });
  }

  // 팩트시트 — daysFromJie는 buildFactSheet가 fp.trace.birthUTC(canonical UTC)로 직접 계산
  const fs = buildFactSheet(fp, tier, type, { name, concern, applyHapHwa: applyHapHwa ?? false });

  // 오늘의 사주: 일진 계산 (KST 기준)
  let todayPillar: { stem: string; branch: string; sipshinStem: string; sipshinBranch: string } | undefined;
  let todayDateStr = '';
  if (type === 'today') {
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST
    const ty = now.getUTCFullYear(), tm = now.getUTCMonth() + 1, td = now.getUTCDate();
    todayDateStr = `:${ty}${String(tm).padStart(2,'0')}${String(td).padStart(2,'0')}`;
    try {
      const todayFp = calcSajuServer(ty, tm, td, 12, 'male', 127.0);
      const ts = todayFp.day.stem, tb = todayFp.day.branch;
      todayPillar = {
        stem: ts, branch: tb,
        sipshinStem:   getSipshin(fp.day.stem, ts) ?? ts,
        sipshinBranch: getBranchSipshin(fp.day.stem, tb) ?? tb,
      };
    } catch { /* 일진 계산 실패 시 무시 */ }
  }

  // concern이 있으면 캐시 키에 포함 (고민 다르면 다른 해석)
  const concernHash = concern
    ? `:q${Buffer.from(concern).toString('base64').slice(0, 12)}`
    : '';

  // natal 타입(full/love/career): 세운이 연도 의존적 → 매년 새 해석 생성
  // today: 날짜 키 이미 포함 (todayDateStr)
  const yearSuffix = (type !== 'today')
    ? `:y${new Date().getFullYear()}`
    : '';

  const cacheKey = fs.meta.cacheKey + yearSuffix + todayDateStr + concernHash;

  // 캐시 확인
  if (redis) {
    const hit = await redis.get<string>(cacheKey);
    if (hit) {
      try {
        const sections = parsesections(hit);
        // 캐시 히트도 DB에 last_viewed_at 갱신 (fire-and-forget)
        saveReading({ supabaseGetter: createClient, year, month, day, hour, minute, sex, longitudeE, name, concern, type, cacheKey, fp });
        const response: ReadingResponse = { cacheKey, cached: true, sections, tier, cautions: fs.cautions, ...(todayPillar ? { todayPillar } : {}) };
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
    raw = await callLLM(fs, { tier, type, sex, todayPillar });
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

  // 캐시 저장 (today = 24h TTL, 나머지 영구)
  if (redis) {
    if (type === 'today') {
      await redis.set(cacheKey, raw, { ex: 86400 });
    } else {
      await redis.set(cacheKey, raw);
    }
  }

  // DB 저장 (fire-and-forget)
  saveReading({ supabaseGetter: createClient, year, month, day, hour, minute, sex, longitudeE, name, concern, type, cacheKey, fp });

  const response: ReadingResponse = { cacheKey, cached: false, sections, tier, cautions: fs.cautions, ...(todayPillar ? { todayPillar } : {}) };
  return NextResponse.json(response);
}

// ── DB 저장 헬퍼 (비차단) ──
function saveReading(args: {
  supabaseGetter: typeof createClient;
  year: number; month: number; day: number; hour: number | null; minute: number;
  sex: string; longitudeE: number; name?: string; concern?: string;
  type: string; cacheKey: string;
  fp: ReturnType<typeof calcSajuServer>;
}) {
  const { supabaseGetter, year, month, day, hour, minute, sex, longitudeE, name, concern, type, cacheKey, fp } = args;
  supabaseGetter().then(async supabase => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('saju_readings').upsert({
      user_id:        user.id,
      type,
      birth_year:     year,
      birth_month:    month,
      birth_day:      day,
      birth_hour:     hour,
      birth_minute:   minute,
      birth_sex:      sex,
      birth_longitude: longitudeE,
      birth_name:     name ?? null,
      concern:        concern ?? null,
      cache_key:      cacheKey,
      day_stem:       fp.day.stem,
      day_element:    STEM_DATA[fp.day.stem].element,
      last_viewed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,cache_key' });
  }).catch(() => { /* non-critical */ });
}
