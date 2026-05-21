"use client";

import { useState } from "react";
import { SplitScreen } from "./split-screen";
import { IssueCard } from "./issue-card";
import { Nav } from "./nav";
import { ViewTabs } from "./view-tabs";
import { calculateScores, type ScoreView } from "@/lib/score";
import type { Issue } from "@/types";

interface HomePageProps {
  issues: Issue[];
}

export function HomePage({ issues }: HomePageProps) {
  const [view, setView] = useState<ScoreView>("recent");
  const score = calculateScores(issues, view);

  const scoredIssues = issues.filter((i) => i.category !== "controversial");
  const controversialIssues = issues.filter((i) => i.category === "controversial");

  const sortedIssues = [...scoredIssues].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return (
    <>
      <Nav />
      <main>
        <SplitScreen score={score} issues={issues} view={view} onViewChange={setView} />

        <section className="mx-auto max-w-4xl px-4 py-20">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white/90">최근 이슈</h2>
            <ViewTabs current={view} onChange={setView} />
          </div>
          {sortedIssues.length === 0 ? (
            <div className="rounded-xl border border-white/5 py-16 text-center text-white/30">
              수집된 이슈가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedIssues.slice(0, 20).map((issue, i) => (
                <IssueCard key={issue.id} issue={issue} index={i} />
              ))}
            </div>
          )}
        </section>

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

        <footer className="border-t border-white/5 py-12 text-center text-xs text-white/25">
          <p>민낯 — 색안경 벗고, 팩트로 보는 정치</p>
          <p className="mt-1">모든 점수의 근거는 투명하게 공개됩니다.</p>
        </footer>
      </main>
    </>
  );
}
