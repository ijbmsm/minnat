import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StoryPage } from "@/components/story-page";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { getStory } from "@/lib/stories";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

// 빈 배열 = 빌드 때 아무것도 미리 만들지 않고, 처음 요청된 주소부터 revalidate 주기로 캐시한다(on-demand ISR).
// 이게 없으면 revalidate 를 적어도 매 요청 동적 렌더된다 (2026-11-06 빌드 출력 ƒ 확인).
export async function generateStaticParams() {
  return [];
}

// 사안은 크롤러가 계속 만들고 바꾸므로 빌드 시점에 목록을 고정하지 않는다 (위 빈 generateStaticParams).

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) return { title: "사안을 찾을 수 없습니다" };

  const url = `https://drinkplace.kr/stories/${slug}`;
  return {
    title: `${story.title} — 전체 흐름`,
    description: story.blurb,
    alternates: { canonical: url },
    openGraph: {
      title: `${story.title} — 전체 흐름`,
      description: story.blurb,
      type: "article",
      url,
    },
    twitter: { card: "summary_large_image", title: story.title, description: story.blurb },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const story = await getStory(slug);
  if (!story) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "술자리", url: "https://drinkplace.kr" },
          { name: "사건 추적", url: "https://drinkplace.kr/stories" },
          { name: story.title, url: `https://drinkplace.kr/stories/${slug}` },
        ]}
      />
      <StoryPage story={story} />
    </>
  );
}
