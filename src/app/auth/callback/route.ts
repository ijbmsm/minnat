import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ipHashFrom } from "@/lib/saju/credits";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * OAuth 콜백. 세션 교환 후:
 *  - saju_credits 행을 보장한다 (신규 가입이면 이 시점에 생성).
 *  - 신규 가입이고 `saju_ref` 쿠키(공유 링크로 들어온 reading id)가 있으면 추천 관계를 기록한다.
 *    보상은 피추천인이 첫 풀이를 완료할 때 지급 (credits.maybeRewardReferrer).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try { await ensureCreditsAndReferral(user.id, request); } catch (e) {
          console.warn('[auth callback] credits/referral 처리 실패', e instanceof Error ? e.message : e);
        }
      }
      const res = NextResponse.redirect(`${origin}${next}`);
      res.cookies.set('saju_ref', '', { maxAge: 0, path: '/' });
      return res;
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=true`);
}

async function ensureCreditsAndReferral(userId: string, request: Request): Promise<void> {
  const svc = createServiceClient();
  const ipHash = await ipHashFrom(request.headers);

  // 신규 여부 = 이번에 행이 생겼는가
  const { data: inserted } = await svc
    .from('saju_credits')
    .upsert({ user_id: userId, signup_ip_hash: ipHash }, { onConflict: 'user_id', ignoreDuplicates: true })
    .select('user_id');
  const isNew = Array.isArray(inserted) && inserted.length > 0;
  if (!isNew) return;

  const cookieStore = await cookies();
  const refReadingId = cookieStore.get('saju_ref')?.value;
  if (!refReadingId) return;

  const { data: reading } = await svc
    .from('saju_readings')
    .select('user_id')
    .eq('id', refReadingId)
    .maybeSingle<{ user_id: string }>();
  if (!reading || reading.user_id === userId) return;

  await svc.from('saju_referrals').upsert({
    referred_user_id: userId,
    referrer_user_id: reading.user_id,
    source_reading_id: refReadingId,
    ip_hash: ipHash,
  }, { onConflict: 'referred_user_id', ignoreDuplicates: true });
}
