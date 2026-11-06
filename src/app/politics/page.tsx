import { HomePage } from "@/components/home-page";
import { getEvents } from "@/lib/data";
import { calculateEventScores, type ScoreView } from "@/lib/score";
import type { IssueEvent } from "@/types";

const VIEWS: ScoreView[] = ["hot", "recent", "midterm", "alltime"];
const refTime = (e: IssueEvent) => new Date(e.last_reported_at || e.created_at).getTime();

export const metadata = {
  title: "정치 스코어보드",
  description: "검찰 기소·법원 판결·윤리위 처분 같은 공식 처분만 모아 이슈 단위로 기록합니다. 정치인 개인 점수와 랭킹은 만들지 않습니다.",
  alternates: { canonical: "https://drinkplace.kr/politics" },
};

export const revalidate = 300;

export default async function Page() {
  const events = await getEvents({ limit: 1000 });

  // 점수는 여기서 보기별로 계산하고 숫자만 넘긴다 — 1000건을 브라우저로 보내지 않는다
  const scores = Object.fromEntries(
    VIEWS.map((v) => [v, calculateEventScores(events, v)]),
  ) as Record<ScoreView, ReturnType<typeof calculateEventScores>>;

  // 피드에 그려지는 것만: 최신 10건 + 진영별 최신 6건 (HomePage 가 같은 규칙으로 다시 고른다)
  const sorted = [...events].sort((a, b) => refTime(b) - refTime(a));
  const keep = new Map<string, IssueEvent>();
  for (const e of [
    ...sorted.slice(0, 10),
    ...sorted.filter((e) => e.camp === "blue").slice(0, 6),
    ...sorted.filter((e) => e.camp === "red").slice(0, 6),
  ]) keep.set(e.id, e);

  return <HomePage scores={scores} events={[...keep.values()]} />;
}
