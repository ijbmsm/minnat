/** 초대 로드·공개 뷰 — 서버 전용. */
import { createServiceClient } from '@/lib/supabase/service';
import { buildInviteHook, type InviteHook } from '@/lib/saju/hooks';
import { DAY_MASTER_PROFILE } from '@/lib/saju/interpret';
import { BRANCH_DATA, STEM_DATA } from '@/lib/saju/constants';
import type { CompatRelation } from '@/lib/saju/compat';
import type { CompatPerson } from '@/lib/saju/compat-server';
import type { FourPillars } from '@/lib/saju/engine';

export interface InviteRow {
  id: string;
  token: string;
  inviter_id: string;
  person_a: CompatPerson & { chart: FourPillars };
  relation: CompatRelation;
  status: 'pending' | 'accepted' | 'expired';
  invitee_id: string | null;
  reading_id: string | null;
  created_at: string;
  expires_at: string;
  expired: boolean;
}

export async function loadInvite(token: string): Promise<InviteRow | null> {
  if (!/^[A-Za-z0-9]{8,32}$/.test(token)) return null;
  const { data } = await createServiceClient()
    .from('saju_invites')
    .select('id,token,inviter_id,person_a,relation,status,invitee_id,reading_id,created_at,expires_at')
    .eq('token', token)
    .maybeSingle<Omit<InviteRow, 'expired'>>();
  if (!data) return null;
  return { ...data, expired: data.status === 'expired' || new Date(data.expires_at).getTime() < Date.now() };
}

/** 상대(B)·크롤러에게 보여도 되는 것만. */
export interface InvitePublicView {
  token:     string;
  status:    InviteRow['status'];
  expired:   boolean;
  relation:  CompatRelation;
  expiresAt: string;
  inviter: {
    name:    string | null;
    stem:    string;
    branch:  string;
    element: string;
    hook:    InviteHook;
  };
}

export function publicInviteView(inv: InviteRow): InvitePublicView {
  const chart = inv.person_a.chart;
  const stem = chart.day.stem;
  return {
    token: inv.token,
    status: inv.status,
    expired: inv.expired,
    relation: inv.relation,
    expiresAt: inv.expires_at,
    inviter: {
      name: inv.person_a.name ?? null,
      stem,
      branch: chart.day.branch,
      element: STEM_DATA[stem].element,
      hook: buildInviteHook({
        stem,
        branchHanja: BRANCH_DATA[chart.day.branch].hanja,
        sex: inv.person_a.sex,
        keyword: DAY_MASTER_PROFILE[stem].keyword[0],
      }),
    },
  };
}
