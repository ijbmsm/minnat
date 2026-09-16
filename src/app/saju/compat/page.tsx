import { Nav } from "@/components/nav";
import { SajuCompatPage } from "@/components/saju-compat-page";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "사주 궁합 · 두 사람 케미",
  description: "두 사람의 일간·일지·십신으로 보는 궁합. 끌리는 이유와 부딪히는 이유를 점수와 함께. 상대 생년월일을 몰라도 초대 링크로 볼 수 있어요.",
  keywords: ["궁합", "사주 궁합", "커플 궁합", "무료 궁합", "생년월일 궁합", "연인 궁합"],
  alternates: { canonical: "https://drinkplace.kr/saju/compat" },
  openGraph: {
    title: "사주 궁합 · 두 사람 케미",
    description: "끌리는 이유, 부딪히는 이유. 두 사주로 보는 궁합.",
    url: "https://drinkplace.kr/saju/compat",
    type: "website" as const,
  },
};

export default async function CompatPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { mode } = await searchParams;

  // 비로그인도 두 사람 입력 + 엔진 분석까지 (P1-2). AI 풀이부터 로그인.
  return (
    <>
      <Nav />
      <SajuCompatPage loggedIn={!!user} initialMode={mode === 'invite' ? 'invite' : 'both'} />
    </>
  );
}
