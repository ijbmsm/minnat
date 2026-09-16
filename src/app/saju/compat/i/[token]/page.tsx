import { Nav } from "@/components/nav";
import { SajuCompatInvitePage } from "@/components/saju-compat-invite-page";
import { loadInvite, publicInviteView } from "@/lib/saju/invite-server";
import { RELATION_LABEL } from "@/lib/saju/compat";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

/**
 * 궁합 초대 랜딩 (P2-5). 메타데이터는 요청 시점에 초대 row 로 생성 — 카톡·인스타 크롤러가 읽는다.
 * 카드·메타 어디에도 생년월일시는 없다 (일주·오행·후킹 문장만).
 */
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const inv = await loadInvite(token);
  if (!inv) return { title: "궁합 초대 — 술자리" };
  const v = publicInviteView(inv);
  const who = v.inviter.name ? `${v.inviter.name}이(가)` : '누군가';
  const title = `${who} 너와의 ${RELATION_LABEL[v.relation]} 궁합이 궁금하대 — 술자리`;
  const og = new URLSearchParams({
    variant: 'invite',
    stem: v.inviter.stem,
    branch: v.inviter.branch,
    element: v.inviter.element,
    hook: v.inviter.hook.line,
    partner: v.inviter.hook.partnerElementHanja,
    ...(v.inviter.name ? { name: v.inviter.name } : {}),
  });
  const url = `https://drinkplace.kr/saju/compat/i/${token}`;
  return {
    title,
    description: `${v.inviter.hook.dayPillarHanja} · ${v.inviter.hook.line} 생년월일만 넣으면 둘의 궁합이 열려.`,
    robots: { index: false },
    alternates: { canonical: url },
    openGraph: {
      title,
      description: v.inviter.hook.line,
      url,
      images: [{ url: `https://drinkplace.kr/api/saju/og?${og.toString()}`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function CompatInviteRoute({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await loadInvite(token);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const view = inv ? publicInviteView(inv) : null;
  const isInviter = !!inv && !!user && inv.inviter_id === user.id;

  return (
    <>
      <Nav />
      <SajuCompatInvitePage token={token} invite={view} loggedIn={!!user} isInviter={isInviter} />
    </>
  );
}
