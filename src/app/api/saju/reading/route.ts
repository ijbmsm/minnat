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
import { z } from 'zod';
import { calcSajuServer } from '@/lib/saju/server';
import { buildFactSheet, FACTSHEET_VERSION, type SajuFactSheet } from '@/lib/saju/factsheet';
import { STEM_DATA } from '@/lib/saju/constants';
import { getSipshin, getBranchSipshin } from '@/lib/saju/sipshin';
import { createClient } from '@/lib/supabase/server';
import { callSajuLLM } from '@/lib/saju/llm';
import { cacheGet, cacheSet, cacheDel, rateLimitOk } from '@/lib/saju/cache';
import { buildPrompt, TOKEN_BUDGET, type ReadingType } from '@/lib/saju/prompt';
import { parseJsonArrayLoose } from '@/lib/saju/json-repair';
import { chargeForReading, refundCredit, maybeRewardReferrer, type ChargeVia } from '@/lib/saju/credits';
import { reserveLLMCall, releaseLLMCall, MonthlyCapError } from '@/lib/saju/spend';

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
  // "다시 풀이받기" — 캐시를 우회하고 새로 생성한다. 결과는 캐시에 덮어써서
  // 이후 일반 조회는 다시 동일하게(안정) 나온다. 일일 캡은 그대로 적용된다.
  refresh:     z.boolean().default(false),
});

// ── 응답 타입 ──

export interface ReadingSection {
  /** 고정 카테고리 라벨 (총평·기질·오행…). 구버전 저장분에는 없을 수 있다. */
  label?: string;
  /** 이 사람 원국에서 나온 후킹 한 줄 */
  title: string;
  body:  string;
}

export interface TodayPillar {
  stem:          string;
  branch:        string;
  sipshinStem:   string;
  sipshinBranch: string;
}

export interface ReadingCredit {
  via:     ChargeVia;
  balance: number;
  /** 오늘의 사주 연속 일수 (today 경로에서만) */
  streak?: number;
  /** 이번 열람으로 7일 연속 보상이 지급됐으면 true */
  streakReward?: boolean;
}

export interface ReadingResponse {
  cacheKey:     string;
  cached:       boolean;
  sections:     ReadingSection[];
  tier:         'free' | 'paid';
  cautions:     string[];
  todayPillar?: TodayPillar;
  readingId?:   string;
  credit?:      ReadingCredit;
}


// ── LLM 호출 ──

async function callLLM(
  fs: SajuFactSheet,
  opts: { tier: 'free' | 'paid'; type: ReadingType; sex: 'male' | 'female'; todayPillar?: { stem: string; branch: string; sipshinStem: string; sipshinBranch: string } },
): Promise<string> {
  const { system, user } = buildPrompt(fs, opts);
  // 프롬프트는 "총 N토큰 이내"로 content 분량을 지시한다. max_tokens는 그보다
  // 작으면 JSON이 닫히기 전에 강제 절단되어 파싱이 깨진다(특히 5섹션 love/career).
  // 한국어는 글자당 토큰이 많으므로 지시 분량 위에 헤드룸을 둔다.
  const maxToks = Math.round(TOKEN_BUDGET[opts.type][opts.tier] * 1.45);
  const { text } = await callSajuLLM({ label: `reading:${opts.type}`, system, user, maxTokens: maxToks });
  return text;
}

// ── JSON 파싱 헬퍼 ──

/** LLM 이 준 섹션 원형 — 필드가 문자열이 아닐 수 있어 String() 으로 정규화한다 */
interface RawSection { label?: string | number | null; title?: string | number | null; body?: string | number | null }

function parsesections(raw: string): ReadingSection[] {
  // 코드블록 제거 → 본문 속 날 줄바꿈 이스케이프 → 절단 복구까지 한 번에.
  // (본문이 여러 문단이라 모델이 문자열 안에 진짜 줄바꿈을 써서 보내는 일이 잦다)
  const parsed = parseJsonArrayLoose<RawSection>(raw);

  if (!Array.isArray(parsed)) throw new Error('LLM이 배열을 반환하지 않음');
  const sections = parsed
    .map((s: RawSection) => {
      // label 은 선택 필드다. LLM 이 대괄호를 떼지 않고 보내는 경우가 있어 벗겨둔다.
      const label = String(s?.label ?? '').replace(/^\[|\]$/g, '').trim();
      return {
        ...(label ? { label } : {}),
        title: String(s?.title ?? ''),
        body:  String(s?.body  ?? ''),
      };
    })
    .filter(s => s.title || s.body);
  if (sections.length === 0) throw new Error('파싱된 섹션 없음');
  return sections;
}

// ── Route Handler ──

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY 미설정' }, { status: 503 });
  }

  // Rate limiting — 캐시가 죽어 있으면 통과한다 (로그인·크레딧이 남용을 막는다)
  {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
    const minute = Math.floor(Date.now() / 60_000);
    if (!await rateLimitOk(`saju:rl:${ip}:${minute}`, 5, 70)) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 },
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

  const { year, month, day, hour, minute, dayBoundaryRule, sex, tier, type, longitudeE, name, concern, applyHapHwa, refresh } = body;

  // AI 풀이는 로그인 필수 (원국 미리보기는 클라이언트 엔진이 담당)
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

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

  const respond = (sections: ReadingSection[], cached: boolean, readingId: string | null, credit: ReadingCredit) => {
    const response: ReadingResponse = {
      cacheKey, cached, sections, tier, cautions: fs.cautions,
      ...(todayPillar ? { todayPillar } : {}),
      ...(readingId ? { readingId } : {}),
      credit,
    };
    return NextResponse.json(response);
  };

  // 1) 내 DB 에 같은 풀이가 있으면 크레딧 판정 없이 그대로 (이미 본 것 = 무료 재열람)
  if (!refresh) {
    const fromDb = await loadSavedSections(cacheKey);
    if (fromDb) {
      console.info('[saju cache] db-fallback', cacheKey);
      await cacheSet(cacheKey, JSON.stringify(fromDb.sections), type === 'today' ? 86400 : undefined);
      await saveReading({ supabaseGetter: createClient, year, month, day, hour, minute, sex, longitudeE, name, concern, type, cacheKey, fp, sections: fromDb.sections });
      return respond(fromDb.sections, true, fromDb.id, { via: 'seen', balance: -1 });
    }
  }

  // 2) 크레딧 판정 (결정 ①②⑨: 계정당 1회 무료 → 日 매일 무료 → 획득 크레딧 → 402)
  const charge = await chargeForReading({ supabase, userId: authUser.id, type, cacheKey, refresh });
  if (!charge.ok) {
    return NextResponse.json(
      { error: 'credit', message: '크레딧을 다 썼어. 자정에 1개 채워져.', balance: charge.balance, earn: charge.earn },
      { status: 402 },
    );
  }
  const credit: ReadingCredit = { via: charge.via, balance: charge.balance, ...(charge.streak !== undefined ? { streak: charge.streak } : {}), ...(charge.streakReward ? { streakReward: true } : {}) };
  // 크레딧을 실제로 깎은 경우만 되돌린다. 일일 무료는 되돌리지 않는다
  // (되돌리면 같은 날 무한 재시도가 가능해진다 — 실패는 캐시 미스이므로 재시도 비용이 곧 LLM 비용).
  const undoCharge = async () => {
    if (charge.via === 'credit') await refundCredit(authUser.id, cacheKey);
  };

  // 3) Redis 캐시 (같은 차트를 다른 사람이 이미 풀었으면 LLM 없이 — 크레딧은 위에서 판정됨)
  if (!refresh) {
    const hit = await cacheGet(cacheKey);
    if (hit) {
      try {
        const sections = parsesections(hit);
        const readingId = await saveReading({ supabaseGetter: createClient, year, month, day, hour, minute, sex, longitudeE, name, concern, type, cacheKey, fp, sections });
        void maybeRewardReferrer(authUser.id);
        return respond(sections, true, readingId, credit);
      } catch {
        // 캐시 손상 → 재생성
        await cacheDel(cacheKey);
      }
    }
  }

  // 4) 월 비용 킬스위치 → LLM 호출
  try {
    await reserveLLMCall(authUser.id);
  } catch (err) {
    await undoCharge();
    if (err instanceof MonthlyCapError) {
      return NextResponse.json({ error: 'monthly_cap', message: '이번 달 준비된 풀이가 다 나갔어. 다음 달 1일에 다시 열려.' }, { status: 503 });
    }
    throw err;
  }

  let raw: string;
  try {
    raw = await callLLM(fs, { tier, type, sex, todayPillar });
  } catch (err) {
    await releaseLLMCall(authUser.id);
    await undoCharge();
    return NextResponse.json({ error: `AI 해석 실패: ${err instanceof Error ? err.message : err}` }, { status: 502 });
  }

  // 결과 파싱
  let sections: ReadingSection[];
  try {
    sections = parsesections(raw);
  } catch {
    await undoCharge();
    return NextResponse.json({ error: 'AI 응답 파싱 실패', raw }, { status: 502 });
  }

  // 캐시 저장 (today = 24h TTL, 나머지 영구)
  await cacheSet(cacheKey, raw, type === 'today' ? 86400 : undefined);

  // DB 저장
  const readingId = await saveReading({ supabaseGetter: createClient, year, month, day, hour, minute, sex, longitudeE, name, concern, type, cacheKey, fp, sections });
  void maybeRewardReferrer(authUser.id);

  return respond(sections, false, readingId, credit);
}

// ── DB 폴백: 로그인 유저의 동일 cacheKey 풀이 ──
async function loadSavedSections(cacheKey: string): Promise<{ id: string; sections: ReadingSection[] } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from('saju_readings')
      .select('id, ai_sections')
      .eq('user_id', user.id)
      .eq('cache_key', cacheKey)
      .maybeSingle<{ id: string; ai_sections: ReadingSection[] | null }>();
    if (!data?.ai_sections || data.ai_sections.length === 0) return null;
    return { id: data.id, sections: data.ai_sections };
  } catch { return null; }
}

// ── DB 저장 헬퍼 ──
async function saveReading(args: {
  supabaseGetter: typeof createClient;
  year: number; month: number; day: number; hour: number | null; minute: number;
  sex: string; longitudeE: number; name?: string; concern?: string;
  type: string; cacheKey: string;
  fp: ReturnType<typeof calcSajuServer>;
  sections?: ReadingSection[];
}): Promise<string | null> {
  const { supabaseGetter, year, month, day, hour, minute, sex, longitudeE, name, concern, type, cacheKey, fp, sections } = args;
  try {
    const supabase = await supabaseGetter();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('saju_readings').upsert({
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
      chart:          fp,
      engine_version: FACTSHEET_VERSION,
      ...(sections ? { ai_sections: sections } : {}),
    }, { onConflict: 'user_id,cache_key' }).select('id').single();
    if (error || !data) return null;
    return (data as { id: string }).id;
  } catch { return null; }
}
