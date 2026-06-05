import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { SajuCompatPage } from "@/components/saju-compat-page";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "궁합 · 술자리",
  description: "두 사주로 보는 케미. 끌리는 이유, 부딪히는 이유.",
};

export default async function CompatPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/saju/compat");

  return (
    <>
      <Nav />
      <SajuCompatPage />
    </>
  );
}
