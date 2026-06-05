import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { SajuPage } from "@/components/saju-page";
import type { ReadingType } from "@/components/saju-page";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SajuDetailPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (!["full", "today", "love", "career"].includes(type)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/saju/${type}/${id}`);

  return (
    <>
      <Nav />
      <SajuPage fixedType={type as ReadingType} readingId={id} />
    </>
  );
}
