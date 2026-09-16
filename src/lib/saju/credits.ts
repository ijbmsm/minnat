/**
 * 사주 크레딧 판정 — 서버 전용. 무료 정책 v3 "하루 한 편" (2026-09-17).
 *
 * 규칙 (한 곳에):
 *   어드민(SAJU_ADMIN_USER_ID)                                           → 항상 통과
 *   이미 본 것 (saju_readings 에 (user, cacheKey) 있음, refresh=false)  → 소모 없음, LLM 도 안 부른다
 *   오늘 일일 무료를 아직 안 씀 (refresh 아님)                            → 소모 없음 (타입 무관 하루 1편)
 *   balance > 0                                                          → 크레딧 1 소모
 *   그 외                                                                → 402 { error:'credit', balance, earn }
 *
 * 다섯 편(命·日·緣·財·合)을 다 보려면 5일이 걸린다. 빨리 보려면 크레딧을 쓴다.
 * 결제가 없으므로 막다른 길을 만들지 않는다 — 하루만 기다리면 다시 열린다.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/service';

export type ChargeVia = 'admin' | 'seen' | 'daily' | 'credit' | 'invite';

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
  /** 남은 크레딧 (획득분) */
  balance:   number;
  /** 첫 풀이를 본 적 있는지 — 랜딩 문구용 */
  onboarded: boolean;
  /** 오늘 일일 무료 1편이 아직 남았으면 true */
  dailyFree: boolean;
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
    supabase
      .from('saju_credits')
      .select('balance, free_used, daily_last_date, streak_count')
      .eq('user_id', userId)
      .maybeSingle<{ balance: number; free_used: boolean; daily_last_date: string | null; streak_count: number }>(),
    supabase
      .from('saju_readings')
      .select('type')
      .eq('user_id', userId)
      .not('ai_sections', 'is', null)
      .limit(200),
  ]);
  const seen = new Set<string>((readings.data as { type: string }[] | null ?? []).map(r => r.type));
  return {
    balance:   credits.data?.balance ?? 0,
    onboarded: credits.data?.free_used ?? false,
    dailyFree: (credits.data?.daily_last_date ?? null) !== kstToday(),
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

  // 하루 한 편 (타입 무관). 다시 풀이받기는 제외.
  if (!refresh) {
    const { data, error } = await supabase.rpc('saju_use_daily', { p_today: kstToday() });
    if (!error && data && typeof data === 'object') {
      const r = data as { free: boolean; streak: number; reward: boolean };
      if (r.free) {
        return { ok: true, via: 'daily', balance: await currentBalance(supabase, userId), streak: r.streak, streakReward: r.reward };
      }
    }
  }

  const { data, error } = await supabase.rpc('saju_consume_credit', { p_reason: refresh ? 'refresh' : 'reading', p_ref: cacheKey });
  if (!error && data && typeof data === 'object') {
    const r = data as { ok: boolean; balance: number };
    if (r.ok) return { ok: true, via: 'credit', balance: r.balance };
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
