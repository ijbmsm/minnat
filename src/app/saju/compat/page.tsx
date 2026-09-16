import { Nav } from "@/components/nav";
import { SajuCompatPage } from "@/components/saju-compat-page";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "궁합 · 술자리",
  description: "두 사주로 보는 케미. 끌리는 이유, 부딪히는 이유.",
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
