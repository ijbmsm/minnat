"use client";

import { useState } from "react";
import { SplitScreen } from "./split-screen";
import { IssueCard } from "./issue-card";
import { Nav } from "./nav";
import { ViewTabs } from "./view-tabs";
import { calculateScores, type ScoreView } from "@/lib/score";
import { CATEGORY_MAP } from "@/lib/constants";
import type { Issue } from "@/types";

interface HomePageProps {
  issues: Issue[];
}

export function HomePage({ issues }: HomePageProps) {
  const [view, setView] = useState<ScoreView>("recent");
  const score = calculateScores(issues, view);

  const scoredIssues = issues.filter((i) => CATEGORY_MAP[i.category]?.isScored);
  const archiveIssues = issues.filter((i) => CATEGORY_MAP[i.category]?.isArchive);

  const sortedScored = [...scoredIssues].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
  const sortedArchive = [...archiveIssues].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return (
    <>
      <Nav />
      <main>
        <SplitScreen score={score} issues={issues} view={view} onViewChange={setView} />

        {/* 점수 이슈 (공식 처분) */}
        <section className="mx-auto max-w-4xl px-4 py-20">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white/90">공식 처분 이슈</h2>
            <ViewTabs current={view} onChange={setView} />
          </div>
          {sortedScored.length === 0 ? (
            <div className="rounded-xl border border-white/5 py-16 text-center text-white/30">
              수집된 공식 처분 이슈가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedScored.slice(0, 20).map((issue, i) => (
                <IssueCard key={issue.id} issue={issue} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* Archive (기록) */}
        {sortedArchive.length > 0 && (
          <section className="mx-auto max-w-4xl px-4 pb-20">
            <div className="mb-8 flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white/90">행보 기록</h2>
              <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-white/40">
                점수 없음
              </span>
            </div>
            <div className="space-y-4">
              {sortedArchive.slice(0, 15).map((issue, i) => (
                <IssueCard key={issue.id} issue={issue} index={i} />
              ))}
            </div>
          </section>
        )}

        <footer className="border-t border-white/5 py-12 text-center text-xs text-white/25">
          <p>민낯 — 사회·제도의 반응을 측정합니다</p>
          <p className="mt-1">모든 점수의 근거는 투명하게 공개됩니다.</p>
        </footer>
      </main>
    </>
  );
}
