/**
 * 사주 크레딧 판정 — 서버 전용. 무료 정책 v4 "크레딧 하나로" (2026-09-17).
 *
 * v3 는 dailyFree(불리언) + balance(획득분) 두 개념이 따로 돌아서 화면 문구가
 * 네 갈래로 갈라졌다. v4 는 통화를 크레딧 하나로 합친다.
 *
 * 규칙 (한 곳에):
 *   어드민(SAJU_ADMIN_USER_ID)                                          → 항상 통과
 *   이미 본 것 (saju_readings 에 (user, cacheKey) 있음, refresh=false)  → 소모 없음, LLM 도 안 부른다
 *   그 외                                                                → 자정 충전 반영 후 크레딧 1 소모
 *   잔액 0                                                               → 402 { error:'credit', balance, earn }
 *
 * 자정(KST)에 잔액을 DAILY_CAP(=1)까지 채운다. 쌓이지 않는다 —
 * 매일 +1 로 누적되면 안 보고 묵혀서 30개를 만들 수 있고 킬스위치 비용 모델이 깨진다.
 * 결제가 없으므로 막다른 길을 만들지 않는다 — 하루만 기다리면 다시 열린다.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';

export type ChargeVia = 'admin' | 'seen' | 'daily' | 'credit' | 'invite';

/** 자정마다 여기까지 채워준다. 화면의 N/1 에서 분모. */
export const DAILY_CAP = 1;

export type SajuReadingType = 'full' | 'today' | 'love' | 'career' | 'compat';

/** 풀이 타입 전체 — "N/5 읽음" 표시에 쓴다 */
export const ALL_READING_TYPES: SajuReadingType[] = ['full', 'today', 'love', 'career', 'compat'];

export interface EarnHint { key: 'share_signup' | 'invite_accept' | 'daily_streak'; text: string }

export const EARN_HINTS: EarnHint[] = [
  { key: 'invite_accept', text: '궁합 초대 링크를 상대가 수락하면 둘 다 +1' },
  { key: 'share_signup', text: '내 결과 공유 링크로 친구가 가입하고 첫 풀이를 보면 +1' },
  { key: 'daily_streak', text: '7일 연속 풀이를 보면 +1' },
];

export type ChargeOutcome =
  | { ok: true;  via: ChargeVia; balance: number; streak?: number; streakReward?: boolean }
  | { ok: false; balance: number; earn: EarnHint[] };

export interface CreditState {
  /**
   * 지금 쓸 수 있는 크레딧. 자정 충전이 아직 DB 에 반영되지 않았어도
   * 사용자가 실제로 받게 될 값을 준다 (충전은 읽을 때 일어난다).
   */
  balance:   number;
  /** 자정마다 채워지는 상한 — 화면의 N/1 에서 분모 */
  dailyCap:  number;
  /** 첫 풀이를 본 적 있는지 — 랜딩 문구용 */
  onboarded: boolean;
  /** 오늘 자정 충전분이 아직 안 반영됐으면 true (툴팁 문구용) */
  pendingRefill: boolean;
  /** 연속 사용일 (7일이면 크레딧 +1) */
  streak:    number;
  /** 이미 읽은 풀이 타입 — "N/5" 표시용 */
  readTypes: SajuReadingType[];
}

export function kstToday(now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}-${String(kst.getUTCDate()).padStart(2, '0')}`;
}

export function isAdmin(userId: string): boolean {
  return !!process.env.SAJU_ADMIN_USER_ID && userId === process.env.SAJU_ADMIN_USER_ID;
}

async function hasSeen(supabase: SupabaseClient, userId: string, cacheKey: string): Promise<boolean> {
  const { data } = await supabase
    .from('saju_readings')
    .select('id')
    .eq('user_id', userId)
    .eq('cache_key', cacheKey)
    .not('ai_sections', 'is', null)
    .maybeSingle<{ id: string }>();
  return !!data;
}

async function currentBalance(supabase: SupabaseClient, userId: string): Promise<number> {
  const { data } = await supabase.from('saju_credits').select('balance').eq('user_id', userId).maybeSingle<{ balance: number }>();
  return data?.balance ?? 0;
}

export async function getCreditState(supabase: SupabaseClient, userId: string): Promise<CreditState> {
  const [credits, readings] = await Promise.all([
    // select('*') — 019 미적용 DB 에서도 컬럼 누락으로 쿼리가 통째로 실패하지 않게 한다
    supabase
      .from('saju_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<{ balance?: number; free_used?: boolean; daily_last_date?: string | null; streak_count?: number }>(),
    supabase
      .from('saju_readings')
      .select('type')
      .eq('user_id', userId)
      .not('ai_sections', 'is', null)
      .limit(200),
  ]);
  const seen = new Set<string>((readings.data as { type: string }[] | null ?? []).map(r => r.type));
  const stored = credits.data?.balance ?? 0;
  // 충전은 실제로 읽을 때(chargeForReading) 일어난다. 조회는 쓰기를 하지 않으므로
  // 여기서는 "오늘 읽으면 받게 될 값" 을 계산해서 보여준다. 둘은 항상 같은 수다.
  const pendingRefill = (credits.data?.daily_last_date ?? null) !== kstToday();
  return {
    balance:   pendingRefill ? Math.max(stored, DAILY_CAP) : stored,
    dailyCap:  DAILY_CAP,
    onboarded: credits.data?.free_used ?? false,
    pendingRefill,
    streak:    credits.data?.streak_count ?? 0,
    readTypes: ALL_READING_TYPES.filter(t => seen.has(t)),
  };
}

export async function chargeForReading(args: {
  supabase: SupabaseClient;
  userId:   string;
  type:     SajuReadingType;
  cacheKey: string;
  refresh:  boolean;
}): Promise<ChargeOutcome> {
  const { supabase, userId, cacheKey, refresh } = args;

  if (isAdmin(userId)) return { ok: true, via: 'admin', balance: await currentBalance(supabase, userId) };

  // 이미 본 풀이는 몇 번을 다시 열어도 무료 — LLM 호출도 없다
  if (!refresh && await hasSeen(supabase, userId, cacheKey)) {
    return { ok: true, via: 'seen', balance: await currentBalance(supabase, userId) };
  }

  // 1) 자정 충전 — 잔액을 DAILY_CAP 까지 끌어올린다. 하루 한 번만 걸린다.
  //    "다시 풀이받기(refresh)" 도 크레딧을 쓰므로 충전은 똑같이 반영한다.
  let streak: number | undefined;
  let streakReward = false;
  {
    const { data, error } = await supabase.rpc('saju_refill_daily', { p_today: kstToday() });
    if (!error && data && typeof data === 'object') {
      const r = data as { refilled: boolean; balance: number; streak: number; reward: boolean };
      streak = r.streak;
      streakReward = r.reward;
    } else if (error) {
      // 023 미적용 폴백 — 배포와 마이그레이션 사이 시차에 서비스가 죽지 않게 v3 경로로 동작시킨다.
      // 023 을 적용하면 이 분기는 다시 타지 않는다.
      console.warn('[saju credits] saju_refill_daily 없음 → v3 폴백:', error.message);
      if (!refresh) {
        const { data: d3, error: e3 } = await supabase.rpc('saju_use_daily', { p_today: kstToday() });
        if (!e3 && d3 && typeof d3 === 'object') {
          const r3 = d3 as { free: boolean; streak: number; reward: boolean };
          if (r3.free) {
            return { ok: true, via: 'daily', balance: await currentBalance(supabase, userId), streak: r3.streak, streakReward: r3.reward };
          }
        }
      }
    }
  }

  // 2) 크레딧 1 소모 — 일일분이든 보너스든 같은 통화다
  const { data, error } = await supabase.rpc('saju_consume_credit', { p_reason: refresh ? 'refresh' : 'reading', p_ref: cacheKey });
  if (!error && data && typeof data === 'object') {
    const r = data as { ok: boolean; balance: number };
    if (r.ok) {
      return { ok: true, via: 'credit', balance: r.balance, ...(streak !== undefined ? { streak } : {}), ...(streakReward ? { streakReward: true } : {}) };
    }
    return { ok: false, balance: r.balance, earn: EARN_HINTS };
  }
  return { ok: false, balance: 0, earn: EARN_HINTS };
}

/** LLM 실패 등으로 소모를 되돌릴 때. credit 경로에서만 의미 있다(일일 무료는 되돌리지 않는다). */
export async function refundCredit(userId: string, ref: string): Promise<void> {
  try {
    await createServiceClient().rpc('saju_grant_credit', { p_user: userId, p_delta: 1, p_reason: 'refund', p_ref: ref });
  } catch { /* ignore */ }
}

/** service_role 로 지급. 초대 수락·공유 가입 보상. */
export async function grantCredit(userId: string, delta: number, reason: 'share_signup' | 'invite_accept' | 'admin', ref?: string): Promise<void> {
  await createServiceClient().rpc('saju_grant_credit', { p_user: userId, p_delta: delta, p_reason: reason, p_ref: ref ?? null });
}

/**
 * 피추천인(userId)이 첫 풀이를 완료했을 때 추천인에게 +1.
 * 같은 IP 해시면 미지급 (reject_reason 기록). 이미 처리된 행은 건너뛴다.
 */
export async function maybeRewardReferrer(userId: string): Promise<void> {
  try {
    const svc = createServiceClient();
    const { data: ref } = await svc
      .from('saju_referrals')
      .select('referrer_user_id, ip_hash, rewarded, reject_reason')
      .eq('referred_user_id', userId)
      .maybeSingle<{ referrer_user_id: string; ip_hash: string | null; rewarded: boolean; reject_reason: string | null }>();
    if (!ref || ref.rewarded || ref.reject_reason) return;

    const { data: referrer } = await svc
      .from('saju_credits')
      .select('signup_ip_hash')
      .eq('user_id', ref.referrer_user_id)
      .maybeSingle<{ signup_ip_hash: string | null }>();

    if (ref.ip_hash && referrer?.signup_ip_hash && ref.ip_hash === referrer.signup_ip_hash) {
      await svc.from('saju_referrals').update({ reject_reason: 'same_ip' }).eq('referred_user_id', userId);
      console.info('[saju referral] same_ip 미지급', userId);
      return;
    }

    await svc.rpc('saju_grant_credit', { p_user: ref.referrer_user_id, p_delta: 1, p_reason: 'share_signup', p_ref: userId });
    await svc.from('saju_referrals').update({ rewarded: true, rewarded_at: new Date().toISOString() }).eq('referred_user_id', userId);
  } catch (e) {
    console.warn('[saju referral] reward 실패', e instanceof Error ? e.message : e);
  }
}

/** x-forwarded-for 첫 IP 의 sha256 앞 16자. 원본 IP 는 저장하지 않는다. */
export async function ipHashFrom(headers: Headers): Promise<string | null> {
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (!ip) return null;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}
