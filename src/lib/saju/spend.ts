/**
 * 월 비용 킬스위치 — 결제 수익이 0 이므로 지출 상한을 코드로 건다.
 *
 * 카운터는 Postgres(saju_spend)에 둔다. 예전에는 Redis 였는데 무료 DB 가 삭제되면서
 * 상한이 통째로 사라졌고, eviction 을 켜면 키가 밀려날 수도 있다. 지출 상한은
 * 조용히 사라지면 안 되는 값이다. 캐시·레이트리밋은 계속 Redis 에 둔다.
 *
 * 실제 LLM 호출 직전에만 센다. 캐시 히트·DB 폴백·미리보기는 세지 않는다.
 */
import { createServiceClient } from '@/lib/supabase/service';

/**
 * 2026-09-18 결정: 목표 **DAU 20** 기준으로 800 회.
 *
 * 크레딧이 하루 1개(자정 top-up, 누적 없음)라 DAU 20 이면 하루 최대 20 호출,
 * 30일이면 600 회가 이론 천장이다. 여기에 보너스 크레딧이 얹힌다 —
 * 7일 연속 +1 이 20명 × (30/7) ≈ 86, 공유 가입·초대 수락은 변동. 실질 700~750.
 * 킬스위치가 정상 사용을 끊으면 안 되므로 10% 여유를 더해 800(≈ 월 $42, 회당 $0.053).
 *
 * 캐시 히트·DB 폴백·미리보기는 세지 않으므로 실제 소진은 이보다 적다.
 * 여기 닿으면 사업자등록·PG 를 검토할 시점으로 본다.
 */
const DEFAULT_MONTHLY_CALL_LIMIT = 800;

export function monthlyCallLimit(): number {
  const raw = Number(process.env.SAJU_MONTHLY_CALL_LIMIT);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_MONTHLY_CALL_LIMIT;
}

/** KST 기준 'YYYYMM' */
export function spendMonth(now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  return `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, '0')}`;
}

export class MonthlyCapError extends Error {
  constructor(public readonly count: number, public readonly limit: number) {
    super('monthly_cap');
  }
}

function isAdmin(userId: string | null): boolean {
  return !!userId && !!process.env.SAJU_ADMIN_USER_ID && userId === process.env.SAJU_ADMIN_USER_ID;
}

/**
 * LLM 호출 직전에 부른다. 한도를 넘었으면 MonthlyCapError.
 * 어드민은 세지도 막지도 않는다.
 * DB 장애로 카운트하지 못하면 통과시킨다 — 1차 방어선은 계정당 하루 한 편이다.
 */
export async function reserveLLMCall(userId: string | null): Promise<void> {
  if (isAdmin(userId)) return;
  const limit = monthlyCallLimit();
  const month = spendMonth();
  try {
    const { data, error } = await createServiceClient()
      .rpc('saju_reserve_call', { p_month: month, p_limit: limit });
    if (error) throw new Error(error.message);
    const r = data as { ok: boolean; count: number } | null;
    if (!r) return;
    if (!r.ok) throw new MonthlyCapError(r.count, limit);
    if (r.count === Math.floor(limit * 0.8)) {
      console.warn(`[saju spend] 월 호출 한도 80% 도달 (${r.count}/${limit})`);
    }
  } catch (err) {
    if (err instanceof MonthlyCapError) throw err;
    console.warn('[saju spend] 카운터 실패 — 킬스위치 우회:', err instanceof Error ? err.message : err);
  }
}

/** 실패한 호출은 되돌린다. */
export async function releaseLLMCall(userId: string | null): Promise<void> {
  if (isAdmin(userId)) return;
  try {
    await createServiceClient().rpc('saju_release_call', { p_month: spendMonth() });
  } catch { /* 되돌리기 실패는 무시 — 다음 달에 리셋된다 */ }
}

/** 관리·표시용 현재 사용량. */
export async function currentSpend(): Promise<{ month: string; calls: number; limit: number }> {
  const month = spendMonth();
  const limit = monthlyCallLimit();
  try {
    const { data } = await createServiceClient()
      .from('saju_spend').select('calls').eq('month', month).maybeSingle<{ calls: number }>();
    return { month, calls: data?.calls ?? 0, limit };
  } catch { return { month, calls: -1, limit }; }
}
