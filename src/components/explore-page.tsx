"use client";

import { useState } from "react";
import { Nav } from "./nav";
import { ViewTabs } from "./view-tabs";
import { IssueBubble } from "./issue-bubble";
import { TimelineView } from "./timeline-view";
import { IssueCard } from "./issue-card";
import { CATEGORY_MAP } from "@/lib/constants";
import type { ScoreView } from "@/lib/score";
import type { Issue } from "@/types";

type Tab = "bubble" | "timeline" | "all";

interface ExplorePageProps {
  issues: Issue[];
}

export function ExplorePage({ issues }: ExplorePageProps) {
  const [view, setView] = useState<ScoreView>("alltime");
  const [tab, setTab] = useState<Tab>("bubble");

  const scoredIssues = issues.filter((i) => CATEGORY_MAP[i.category]?.isScored);
  const sortedAll = [...issues].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-20">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">탐색</h1>
            <p className="mt-1 text-sm text-white/40">이슈를 다양한 시각으로 탐색</p>
          </div>
          <ViewTabs current={view} onChange={setView} />
        </div>

        {/* 탭 전환 */}
        <div className="mb-8 flex rounded-lg border border-white/10 p-0.5">
          {([
            { key: "bubble" as const, label: "이슈 맵" },
            { key: "timeline" as const, label: "타임라인" },
            { key: "all" as const, label: "전체 이슈" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-md px-4 py-2 text-sm transition-colors ${
                tab === key
                  ? "bg-white/10 text-white"
                  : "text-white/35 hover:text-white/55"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        {tab === "bubble" && (
          <div>
            <p className="mb-4 text-xs text-white/25">원이 클수록 점수가 높은 이슈. 호버하면 상세 표시.</p>
            <IssueBubble issues={issues} view={view} />
          </div>
        )}

        {tab === "timeline" && (
          <div>
            <p className="mb-4 text-xs text-white/25">연도별 공식 처분 이력 — 좌측 파랑, 우측 빨강</p>
            <TimelineView issues={issues} view={view} />
          </div>
        )}

        {tab === "all" && (
          <div className="space-y-4">
            {sortedAll.slice(0, 50).map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
