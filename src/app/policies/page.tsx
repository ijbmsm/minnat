import { PoliciesPage } from "@/components/policies-page";
import { getIssues } from "@/lib/data";

export const metadata = {
  title: "논란 정책 — 민낯",
  description: "가치 판단이 갈리는 정책들. 점수에 반영되지 않으며 객관적 정보만 제공합니다.",
};

export const revalidate = 300;

export default async function Page() {
  const issues = await getIssues({ category: "controversial" });
  return <PoliciesPage issues={issues} />;
}
