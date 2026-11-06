import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Nav } from "@/components/nav";
import Skeleton from "./skeleton";
import { SajuPage } from "@/components/saju-page";
import type { ReadingType } from "@/components/saju-page";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

// 로그인해야 내용이 보이는 개인 페이지 — 봇에게는 빈 화면이라 소프트 404 로 잡힌다
export const metadata: Metadata = { robots: { index: false, follow: false } };


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
      <Suspense fallback={<Skeleton />}>
        <SajuPage fixedType={type as ReadingType} readingId={id} />
      </Suspense>
    </>
  );
}
