import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StoryPage } from "@/components/story-page";
import { BreadcrumbJsonLd } from "@/components/json-ld";
import { getStory } from "@/lib/stories";

interface Props {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

// generateStaticParams 를 두지 않는다. 사안은 크롤러가 계속 만들고 바꾸므로
// 빌드 시점에 목록을 고정할 수 없고, 조회가 쿠키 기반 클라이언트를 탄다.
// revalidate 로 캐시하면 충분하다.

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
