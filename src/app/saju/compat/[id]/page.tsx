import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { SajuCompatPage } from "@/components/saju-compat-page";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** 저장된 궁합 리딩 (이력에서 진입). 본인만. */
export default async function CompatReadingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/saju/compat/${id}`);

  return (
    <>
      <Nav />
      <SajuCompatPage loggedIn readingId={id} />
    </>
  );
}
