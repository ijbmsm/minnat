import { IssuesPage } from "@/components/issues-page";
import { getIssues } from "@/lib/data";

export const metadata = {
  title: "이슈 목록 — 민낯",
  description: "팩트 기반으로 수집된 정치 이슈 전체 목록",
};

export const revalidate = 300;

export default async function Page() {
  const issues = await getIssues();
  return <IssuesPage initialIssues={issues} />;
}
