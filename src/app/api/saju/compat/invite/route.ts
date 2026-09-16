/**
 * POST /api/saju/compat/invite — 궁합 초대 링크 생성 (SAJU_PLAN_V2 P2-5)
 * 로그인한 A 가 자기 정보만 입력 → 토큰 → /saju/compat/i/[token]
 * 상대에게는 A 의 일주·오행·후킹 문장만 보이고 생년월일시는 절대 나가지 않는다.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { calcSajuServer } from '@/lib/saju/server';
import { PersonSchema, RelationSchema, newInviteToken, type CompatPerson } from '@/lib/saju/compat-server';
import { buildInviteHook, type InviteHook } from '@/lib/saju/hooks';
import { DAY_MASTER_PROFILE } from '@/lib/saju/interpret';
import { BRANCH_DATA } from '@/lib/saju/constants';
import type { FourPillars } from '@/lib/saju/engine';
import type { CompatRelation } from '@/lib/saju/compat';

const RequestSchema = z.object({ person: PersonSchema, relation: RelationSchema });

export const INVITE_TTL_DAYS = 7;
const DAILY_INVITE_LIMIT = 10;

export interface InvitePersonStored extends CompatPerson {
  chart: FourPillars;
}

export interface InviteCreateResponse {
  token:     string;
  path:      string;
  expiresAt: string;
  relation:  CompatRelation;
  hook:      InviteHook;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  let body: z.infer<typeof RequestSchema>;
  try { body = RequestSchema.parse(await req.json()); }
  catch { return NextResponse.json({ error: '잘못된 요청 형식' }, { status: 400 }); }
  const { person, relation } = body;

  const svc = createServiceClient();

  // 하루 생성 한도 (KST)
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  const dayStart = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 3600 * 1000).toISOString();
  const { count } = await svc.from('saju_invites').select('id', { count: 'exact', head: true })
    .eq('inviter_id', user.id).gte('created_at', dayStart);
  if ((count ?? 0) >= DAILY_INVITE_LIMIT) {
    return NextResponse.json({ error: `초대 링크는 하루 ${DAILY_INVITE_LIMIT}개까지 만들 수 있어.` }, { status: 429 });
  }

  let chart: FourPillars;
  try {
    chart = calcSajuServer(person.year, person.month, person.day, person.hour, person.sex, person.longitudeE, person.minute, person.dayBoundaryRule);
  } catch (err) {
    return NextResponse.json({ error: `사주 계산 오류: ${err instanceof Error ? err.message : err}` }, { status: 500 });
  }

  const stored: InvitePersonStored = { ...person, chart };
  const token = newInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86400 * 1000).toISOString();

  const { error } = await svc.from('saju_invites').insert({
    token, inviter_id: user.id, person_a: stored, relation, expires_at: expiresAt,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const hook = buildInviteHook({
    stem: chart.day.stem,
    branchHanja: BRANCH_DATA[chart.day.branch].hanja,
    sex: person.sex,
    keyword: DAY_MASTER_PROFILE[chart.day.stem].keyword[0],
  });

  const res: InviteCreateResponse = { token, path: `/saju/compat/i/${token}`, expiresAt, relation, hook };
  return NextResponse.json(res);
}
