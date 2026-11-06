import { Suspense, cache } from "react";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import Skeleton from "./skeleton";
import { SajuPage } from "@/components/saju-page";
import { loadPublicReading as loadPublicReadingRaw } from "@/lib/saju/reading-public";
import { STEM_DATA } from "@/lib/saju/constants";
import { DAY_MASTER_PROFILE } from "@/lib/saju/interpret";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// generateMetadata 와 페이지가 같은 요청에서 두 번 조회하지 않게 한다
const loadPublicReading = cache(loadPublicReadingRaw);

/** 마크다운 기호를 걷고 앞부분만 — 서버 요약용 */
function excerpt(body: string, max = 360): string {
  const plain = body.replace(/[#*_>`~-]+/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > max ? `${plain.slice(0, max).trimEnd()}…` : plain;
}

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
  if (!reading) return { title: "사주 풀이" };

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
    title: `${dayPillar} ${typeLabel}`,
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
  // 스트리밍(Suspense) 전에 존재부터 확인한다 — 여기서 notFound() 해야 상태 코드가 404 로 나간다
  const reading = await loadPublicReading(id);
  if (!reading) notFound();

  const dm = reading.chart.day.stem;
  const profile = DAY_MASTER_PROFILE[dm];
  const dayPillar = `${dm}${reading.chart.day.branch}`;
  const typeLabel = TYPE_LABEL[reading.type] ?? "사주 풀이";
  const first = reading.ai_sections?.find((sec) => sec.body?.trim());

  return (
    <>
      <Nav />
      <Suspense fallback={<Skeleton />}>
        <SajuPage readingId={id} publicApi />
      </Suspense>
      {/*
        서버 렌더 요약. 풀이 본문은 클라이언트가 불러오므로 이게 없으면 봇에게는 빈 페이지다(소프트 404).
        출생정보는 넣지 않는다 — 일주·키워드·첫 섹션 발췌만.
      */}
      <section
        aria-label="풀이 요약"
        style={{
          maxWidth: 640, margin: "0 auto", padding: "32px 20px 64px",
          borderTop: "1px solid rgba(232,223,200,0.085)",
          fontFamily: "var(--font-noto-serif-kr), serif", color: "rgba(232,223,200,0.66)",
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 500, color: "rgba(232,223,200,0.94)", margin: "0 0 8px" }}>
          {dayPillar} 일주 · {typeLabel} 요약
        </h2>
        <p style={{ fontSize: 13, margin: "0 0 12px", color: "#c2a35b" }}>{profile.keyword.join(" · ")}</p>
        <p style={{ fontSize: 14, lineHeight: 1.75, margin: "0 0 12px" }}>{profile.core}</p>
        {first && (
          <>
            <h3 style={{ fontSize: 14, fontWeight: 500, color: "rgba(232,223,200,0.94)", margin: "16px 0 6px" }}>{first.title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.75, margin: 0 }}>{excerpt(first.body)}</p>
          </>
        )}
      </section>
    </>
  );
}
