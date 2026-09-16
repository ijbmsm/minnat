import { Nav } from "@/components/nav";
import { SajuPage } from "@/components/saju-page";
import { loadPublicReading } from "@/lib/saju/reading-public";
import { STEM_DATA } from "@/lib/saju/constants";
import { DAY_MASTER_PROFILE } from "@/lib/saju/interpret";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  full:   "종합 사주",
  love:   "연애운",
  career: "직업운",
  today:  "오늘 운세",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const reading = await loadPublicReading(id);
  if (!reading) return { title: "사주 풀이 — 술자리" };

  const typeLabel = TYPE_LABEL[reading.type] ?? "사주 풀이";
  const dm = reading.chart.day.stem;
  const dmData = STEM_DATA[dm];
  const profile = DAY_MASTER_PROFILE[dm];
  const dayPillar = `${dm}${reading.chart.day.branch}`;

  // OG 이미지는 출생정보 없이 일주·오행만으로 그린다 (api/saju/og 쿼리 파라미터)
  const og = new URLSearchParams({
    stem: dm,
    branch: reading.chart.day.branch,
    hanja: dmData.hanja,
    element: dmData.element,
    image: dmData.image,
    keywords: profile.keyword.slice(0, 3).join(","),
  });

  return {
    title: `${dayPillar} ${typeLabel} — 술자리`,
    description: `${dayPillar} 일주의 ${typeLabel}. 전통 명리학 계산 + AI 풀이.`,
    alternates: { canonical: `https://drinkplace.kr/saju/view/${id}` },
    openGraph: {
      title: `${dayPillar} ${typeLabel} — 술자리`,
      description: `${profile.keyword.slice(0, 3).join(" · ")}`,
      url: `https://drinkplace.kr/saju/view/${id}`,
      images: [{
        url: `https://drinkplace.kr/api/saju/og?${og.toString()}`,
        width: 1080,
        height: 1080,
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
