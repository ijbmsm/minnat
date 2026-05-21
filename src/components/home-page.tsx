"use client";

import { useState } from "react";
import Link from "next/link";
import { SplitScreen } from "./split-screen";
import { IssueCard } from "./issue-card";
import { Nav } from "./nav";
import { ViewTabs } from "./view-tabs";
import { CategoryBarChart } from "./category-bar-chart";
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
  const sortedScored = [...scoredIssues].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return (
    <>
      <Nav />
      <main>
        {/* 메인 스코어보드 */}
        <SplitScreen score={score} issues={issues} view={view} onViewChange={setView} />

        {/* 카테고리 바 차트 */}
        <section className="mx-auto max-w-4xl px-4 py-16">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white/90">카테고리별 비교</h2>
              <p className="mt-1 text-xs text-white/30">공식 처분 유형별 진영 비교</p>
            </div>
            <ViewTabs current={view} onChange={setView} />
          </div>
          <CategoryBarChart issues={issues} view={view} />
        </section>

        {/* 최근 공식 처분 */}
        <section className="mx-auto max-w-4xl px-4 pb-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white/90">최근 공식 처분</h2>
            <Link
              href="/explore"
              className="text-sm text-white/30 transition-colors hover:text-white/50"
            >
              전체 탐색 &rarr;
            </Link>
          </div>
          {sortedScored.length === 0 ? (
            <div className="rounded-xl border border-white/5 py-16 text-center text-white/30">
              수집된 공식 처분 이슈가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedScored.slice(0, 8).map((issue, i) => (
                <IssueCard key={issue.id} issue={issue} index={i} />
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-white/5 py-12 text-center text-xs text-white/25">
          <p>민낯 — 사회·제도의 반응을 측정합니다</p>
          <p className="mt-1">모든 점수의 근거는 투명하게 공개됩니다.</p>
        </footer>
      </main>
    </>
  );
}
