import { Suspense } from "react";
import { IssueDetailPage } from "@/components/issue-detail-page";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/components/json-ld";
import { SimilarCasesLoader } from "@/components/similar-cases-loader";
import { SimilarCasesSkeleton } from "@/components/similar-cases-section";
import { getIssueById, getEventByIssueId, getCreditsForEvent } from "@/lib/data";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const issue = await getIssueById(id);
  if (!issue) return { title: "이슈를 찾을 수 없습니다" };
  return {
    title: issue.title,
    description: issue.summary,
    alternates: {
      canonical: `https://minnat.kr/issues/${id}`,
    },
    openGraph: {
      title: issue.title,
      description: issue.summary,
      type: "article",
      publishedTime: issue.published_at,
      url: `https://minnat.kr/issues/${id}`,
    },
    twitter: {
      card: "summary",
      title: issue.title,
      description: issue.summary,
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const issue = await getIssueById(id);
  if (!issue) notFound();

  // 병렬 로딩: 이벤트 + 감경 데이터
  const [event, credits] = await Promise.all([
    getEventByIssueId(id),
    issue.event_id ? getCreditsForEvent(issue.event_id) : Promise.resolve([]),
  ]);

  return (
    <>
      <ArticleJsonLd
        title={issue.title}
        description={issue.summary}
        datePublished={issue.published_at}
        url={`https://minnat.kr/issues/${id}`}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "민낯", url: "https://minnat.kr" },
          { name: "이슈", url: "https://minnat.kr/issues" },
          { name: issue.title, url: `https://minnat.kr/issues/${id}` },
        ]}
      />
      <IssueDetailPage
        issue={issue}
        event={event}
        credits={credits}
        similarCasesSlot={
          event ? (
            <Suspense fallback={<SimilarCasesSkeleton />}>
              <SimilarCasesLoader eventId={event.id} />
            </Suspense>
          ) : null
        }
      />
    </>
  );
}
