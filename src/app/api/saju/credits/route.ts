import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCreditState, EARN_HINTS, ALL_READING_TYPES, type CreditState, type EarnHint } from '@/lib/saju/credits';

export interface CreditsResponse extends CreditState {
  /** 전체 풀이 타입 수 — "N/5" 표시용 */
  totalTypes: number;
  earn: EarnHint[];
}

/** GET /api/saju/credits — 내 크레딧·일일 무료 상태. 비로그인 401. */
export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const state = await getCreditState(supabase, user.id);
  const body: CreditsResponse = { ...state, totalTypes: ALL_READING_TYPES.length, earn: EARN_HINTS };
  return NextResponse.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
