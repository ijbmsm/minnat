import { HomePage } from "@/components/home-page";
import { getIssues } from "@/lib/data";
import { calculateScores } from "@/lib/score";

export const revalidate = 300; // 5분마다 재검증

export default async function Page() {
  const issues = await getIssues({ limit: 50 });
  const score = calculateScores(issues);
  return <HomePage score={score} issues={issues} />;
}
