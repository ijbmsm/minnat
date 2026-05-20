import { IssuesPage } from "@/components/issues-page";

export const metadata = {
  title: "이슈 목록 — 민낯",
  description: "팩트 기반으로 수집된 정치 이슈 전체 목록",
};

export default function Page() {
  return <IssuesPage />;
}
