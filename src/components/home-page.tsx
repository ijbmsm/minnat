"use client";

import { SplitScreen } from "./split-screen";
import { IssueCard } from "./issue-card";
import { Nav } from "./nav";
import { MOCK_ISSUES } from "@/lib/mock-data";
import { calculateScores } from "@/lib/score";

export function HomePage() {
  const scoredIssues = MOCK_ISSUES.filter((i) => i.category !== "controversial");
  const controversialIssues = MOCK_ISSUES.filter((i) => i.category === "controversial");
  const score = calculateScores(MOCK_ISSUES);

  // 최신순 정렬
  const sortedIssues = [...scoredIssues].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return (
    <>
      <Nav />
      <main>
        {/* 풀스크린 스플릿 히어로 */}
        <SplitScreen score={score} issues={MOCK_ISSUES} />

        {/* 최근 이슈 섹션 */}
        <section className="mx-auto max-w-4xl px-4 py-20">
          <h2 className="mb-8 text-2xl font-bold text-white/90">최근 이슈</h2>
          <div className="space-y-4">
            {sortedIssues.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        </section>

        {/* 논란 정책 섹션 */}
        {controversialIssues.length > 0 && (
          <section className="mx-auto max-w-4xl px-4 pb-20">
            <div className="mb-8 flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white/90">논란 정책</h2>
              <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-white/40">
                점수 미반영
              </span>
            </div>
            <div className="space-y-4">
              {controversialIssues.map((issue, i) => (
                <IssueCard key={issue.id} issue={issue} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* 푸터 */}
        <footer className="border-t border-white/5 py-12 text-center text-xs text-white/25">
          <p>민낯 — 색안경 벗고, 팩트로 보는 정치</p>
          <p className="mt-1">모든 점수의 근거는 투명하게 공개됩니다.</p>
        </footer>
      </main>
    </>
  );
}
