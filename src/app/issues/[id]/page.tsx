import { IssueDetailPage } from "@/components/issue-detail-page";
import { getIssueById } from "@/lib/data";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const issue = await getIssueById(id);
  if (!issue) return { title: "이슈를 찾을 수 없습니다 — 민낯" };
  return {
    title: `${issue.title} — 민낯`,
    description: issue.summary,
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const issue = await getIssueById(id);
  if (!issue) notFound();
  return <IssueDetailPage issue={issue} />;
}
