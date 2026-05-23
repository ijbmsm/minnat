"use client";

import { useState } from "react";
import Link from "next/link";
import { SplitScreen } from "./split-screen";
import { EventCard, getEventCardSize } from "./event-card";
import { Nav } from "./nav";
import { ViewTabs } from "./view-tabs";
import { CategoryBarChart } from "./category-bar-chart";
import { calculateScores, calculateEventScore, type ScoreView } from "@/lib/score";
import { CATEGORY_MAP } from "@/lib/constants";
import type { Issue, IssueEvent } from "@/types";

interface HomePageProps {
  issues: Issue[];
  events: IssueEvent[];
}

export function HomePage({ issues, events }: HomePageProps) {
  const [view, setView] = useState<ScoreView>("recent");
  const score = calculateScores(issues, view);

  // 점수 높은 Event 상위 6개
  const topEvents = [...events]
    .filter((e) => CATEGORY_MAP[e.category]?.isScored)
    .sort((a, b) => calculateEventScore(b, view) - calculateEventScore(a, view))
    .slice(0, 6);

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

        {/* 주요 사건 (Event 기반) */}
        <section className="mx-auto max-w-4xl px-4 pb-16">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white/90">주요 사건</h2>
              <p className="mt-1 text-xs text-white/30">점수가 높은 공식 처분 사건</p>
            </div>
            <Link
              href="/issues"
              className="text-sm text-white/30 transition-colors hover:text-white/50"
            >
              전체 타임라인 &rarr;
            </Link>
          </div>
          {topEvents.length === 0 ? (
            <div className="rounded-xl border border-white/5 py-16 text-center text-white/30">
              수집된 공식 처분 사건이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {topEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  size={getEventCardSize(event)}
                />
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
