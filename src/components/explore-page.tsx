"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Nav } from "./nav";
import { ViewTabs } from "./view-tabs";
import { IssueBubble } from "./issue-bubble";
import { TimelineView } from "./timeline-view";
import { CATEGORY_MAP, CAMP_COLORS, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import { calculateEventScore, type ScoreView } from "@/lib/score";
import type { Issue, IssueEvent } from "@/types";

const EASE = [0.32, 0.72, 0, 1] as const;

type Tab = "bubble" | "timeline" | "all";

interface ExplorePageProps {
  issues: Issue[];
  events: IssueEvent[];
}

function EventRow({ event, view }: { event: IssueEvent; view: ScoreView }) {
  const colors = CAMP_COLORS[event.camp];
  const config = CATEGORY_MAP[event.category];
  const score = calculateEventScore(event, view);

  return (
    <Link
      href={`/issues/${event.representative_issue_id}`}
      className="group flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.03]"
    >
      <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colors.primary }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-white transition-colors group-hover:text-white">
          {event.summary || "사건 요약 없음"}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/75">
          <span>{config?.label}</span>
          {event.actor_name && <span>{event.actor_name}</span>}
          {event.criminal_stage && (
            <span className="text-red-400/40">{CRIMINAL_STAGE_LABEL[event.criminal_stage]}</span>
          )}
          {event.coverage_count > 1 && <span>{event.coverage_count}개 매체</span>}
        </div>
      </div>
      {score > 0 && (
        <span className="shrink-0 font-mono text-sm font-semibold tabular-nums" style={{ color: colors.glow }}>
          {score.toFixed(1)}
        </span>
      )}
    </Link>
  );
}

export function ExplorePage({ issues, events }: ExplorePageProps) {
  const [view, setView] = useState<ScoreView>("alltime");
  const [tab, setTab] = useState<Tab>("bubble");

  const sortedEvents = [...events].sort((a, b) => {
    const scoreB = calculateEventScore(b, view);
    const scoreA = calculateEventScore(a, view);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.last_reported_at || b.created_at).getTime() -
           new Date(a.last_reported_at || a.created_at).getTime();
  });

  const scoredEvents = sortedEvents.filter((e) => CATEGORY_MAP[e.category]?.isScored);
  const archiveEvents = sortedEvents.filter((e) => !CATEGORY_MAP[e.category]?.isScored);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-20 md:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/75 uppercase">
              탐색
            </span>
            <h1 className="text-3xl font-bold tracking-tight">이슈 탐색</h1>
            <p className="mt-1 text-sm text-white/75">다양한 시각으로 사건을 탐색합니다</p>
          </div>
          <ViewTabs current={view} onChange={setView} />
        </div>

        {/* 탭 전환 */}
        <div className="mb-8 flex rounded-xl border border-white/8 p-0.5">
          {([
            { key: "bubble" as const, label: "이슈 맵" },
            { key: "timeline" as const, label: "타임라인" },
            { key: "all" as const, label: "전체 사건" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm transition-all duration-300 ${
                tab === key
                  ? "bg-white/10 text-white"
                  : "text-white/75 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        {tab === "bubble" && (
          <div>
            <p className="mb-4 text-xs text-white/75">원이 클수록 점수가 높은 이슈. 호버하면 상세 표시.</p>
            <IssueBubble issues={issues} view={view} />
          </div>
        )}

        {tab === "timeline" && (
          <div>
            <p className="mb-4 text-xs text-white/75">연도별 공식 처분 이력 — 좌측 파랑, 우측 빨강</p>
            <TimelineView issues={issues} view={view} />
          </div>
        )}

        {tab === "all" && (
          <div>
            {/* Scored */}
            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs font-medium text-white/75">공식 처분</span>
              <span className="text-[11px] text-white/75">{scoredEvents.length}건</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="mb-8 rounded-[1.25rem] bg-white/[0.01] ring-1 ring-white/5">
              {scoredEvents.slice(0, 50).map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02, ease: EASE }}
                >
                  <EventRow event={event} view={view} />
                </motion.div>
              ))}
            </div>

            {/* Archive */}
            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs font-medium text-white/75">기록</span>
              <span className="text-[11px] text-white/75">{archiveEvents.length}건</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="rounded-[1.25rem] bg-white/[0.01] ring-1 ring-white/5">
              {archiveEvents.slice(0, 30).map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02, ease: EASE }}
                >
                  <EventRow event={event} view={view} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
