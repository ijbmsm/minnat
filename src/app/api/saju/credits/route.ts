import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCreditState, EARN_HINTS, type CreditState, type EarnHint } from '@/lib/saju/credits';

export interface CreditsResponse extends CreditState {
  earn: EarnHint[];
}

/** GET /api/saju/credits — 내 크레딧 상태. 비로그인 401. */
export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const state = await getCreditState(supabase, user.id);
  const body: CreditsResponse = { ...state, earn: EARN_HINTS };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
