"use client";

import { useState, useMemo } from "react";
import { Nav } from "./nav";
import { EventCard, getEventCardSize } from "./event-card";
import { IssueFilter, type FilterState } from "./issue-filter";
import { calculateEventScore } from "@/lib/score";
import { CATEGORY_MAP } from "@/lib/constants";
import type { IssueEvent } from "@/types";

interface IssuesPageProps {
  events: IssueEvent[];
}

// ── 날짜 그루핑 ──

interface DateGroup {
  label: string;
  events: IssueEvent[];
}

function groupByDate(events: IssueEvent[]): DateGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthAgo = new Date(today.getTime() - 30 * 86400000);

  const groups: Record<string, IssueEvent[]> = {};
  const order: string[] = [];

  function addToGroup(label: string, event: IssueEvent) {
    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label].push(event);
  }

  for (const event of events) {
    const date = new Date(event.last_reported_at || event.created_at);

    if (date >= today) {
      addToGroup("오늘", event);
    } else if (date >= yesterday) {
      addToGroup("어제", event);
    } else if (date >= weekAgo) {
      addToGroup("이번 주", event);
    } else if (date >= monthAgo) {
      addToGroup("이번 달", event);
    } else {
      const monthLabel = date.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
      addToGroup(monthLabel, event);
    }
  }

  return order.map((label) => ({ label, events: groups[label] }));
}

export function IssuesPage({ events }: IssuesPageProps) {
  const [filters, setFilters] = useState<FilterState>({
    camp: "all",
    category: "all",
    sort: "latest",
  });
  const [showArchive, setShowArchive] = useState(false);

  const { scored, archive, dateGroups } = useMemo(() => {
    let filtered = events.filter((event) => {
      if (filters.camp !== "all" && event.camp !== filters.camp) return false;
      if (filters.category !== "all" && event.category !== filters.category) return false;
      return true;
    });

    const scored = filtered.filter((e) => CATEGORY_MAP[e.category]?.isScored);
    const archive = filtered.filter((e) => !CATEGORY_MAP[e.category]?.isScored);

    const sortFn = filters.sort === "score"
      ? (a: IssueEvent, b: IssueEvent) => calculateEventScore(b) - calculateEventScore(a)
      : (a: IssueEvent, b: IssueEvent) =>
          new Date(b.last_reported_at || b.created_at).getTime() -
          new Date(a.last_reported_at || a.created_at).getTime();

    scored.sort(sortFn);
    archive.sort(sortFn);

    const dateGroups = filters.sort === "latest" ? groupByDate(scored) : [];

    return { scored, archive, dateGroups };
  }, [events, filters]);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-4 pt-24 pb-20">
        <h1 className="mb-2 text-3xl font-bold">이슈 타임라인</h1>
        <p className="mb-8 text-sm text-white/40">
          공식 처분 기반 정치 사건 — 점수가 높을수록 크게 표시됩니다
        </p>

        <div className="mb-8">
          <IssueFilter onFilterChange={setFilters} />
        </div>

        {scored.length === 0 && archive.length === 0 ? (
          <div className="rounded-xl border border-white/5 py-16 text-center text-white/30">
            해당 조건의 사건이 없습니다.
          </div>
        ) : (
          <>
            {/* 공식 처분 — 타임라인 또는 점수순 */}
            {filters.sort === "latest" && dateGroups.length > 0 ? (
              <div className="space-y-8">
                {dateGroups.map((group) => (
                  <section key={group.label}>
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="text-sm font-semibold text-white/50">{group.label}</h2>
                      <div className="h-px flex-1 bg-white/5" />
                      <span className="text-[11px] tabular-nums text-white/20">
                        {group.events.length}건
                      </span>
                    </div>
                    <div className="space-y-3">
                      {group.events.map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          size={getEventCardSize(event)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : scored.length > 0 ? (
              <div className="space-y-3">
                {scored.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    size={getEventCardSize(event)}
                  />
                ))}
              </div>
            ) : null}

            {/* Archive — 접히는 섹션 */}
            {archive.length > 0 && (
              <div className="mt-10">
                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className="mb-4 flex w-full items-center gap-3 text-left"
                >
                  <h2 className="text-sm font-semibold text-white/30">
                    기록 ({archive.length}건)
                  </h2>
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-xs text-white/20">
                    {showArchive ? "접기" : "펼치기"}
                  </span>
                  <svg
                    className={`h-3 w-3 text-white/20 transition-transform ${showArchive ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showArchive && (
                  <div className="space-y-1 rounded-xl border border-white/5 bg-white/[0.01] p-3">
                    {archive.map((event) => (
                      <EventCard key={event.id} event={event} size="small" />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
