import { ExplorePage } from "@/components/explore-page";
import { getIssues } from "@/lib/data";

export const metadata = {
  title: "탐색 — 민낯",
  description: "이슈 버블 맵, 타임라인, 전체 이슈 탐색",
};

export const revalidate = 300;

export default async function Page() {
  const issues = await getIssues({ limit: 500 });
  return <ExplorePage issues={issues} />;
}
