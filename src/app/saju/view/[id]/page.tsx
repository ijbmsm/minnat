import { Nav } from "@/components/nav";
import { SajuPage } from "@/components/saju-page";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  full:   "종합 사주",
  love:   "연애운",
  career: "직업운",
  today:  "오늘 운세",
};

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const { data } = await anonClient()
    .from("saju_readings")
    .select("type, birth_year, day_stem")
    .eq("id", id)
    .single();

  if (!data) return { title: "사주 풀이 — 술자리" };

  const typeLabel = TYPE_LABEL[data.type as string] ?? "사주 풀이";
  const dayMaster = (data.day_stem as string) ?? "";
  const birthYear = data.birth_year as number;

  return {
    title: `${dayMaster} ${typeLabel} — 술자리`,
    description: `${birthYear}년생 ${dayMaster}일간 사주 AI 분석. 전통 명리학 기반 무료 풀이.`,
    alternates: { canonical: `https://drinkplace.kr/saju/view/${id}` },
    openGraph: {
      title: `${dayMaster} ${typeLabel} — 술자리`,
      description: `${birthYear}년생 사주 AI 풀이`,
      url: `https://drinkplace.kr/saju/view/${id}`,
      images: [{
        url: `https://drinkplace.kr/api/saju/og?id=${id}`,
        width: 1200,
        height: 630,
      }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function PublicSajuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Nav />
      <SajuPage readingId={id} publicApi />
    </>
  );
}
