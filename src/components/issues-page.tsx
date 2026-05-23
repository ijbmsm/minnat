"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Nav } from "./nav";
import { IssueFilter, type FilterState } from "./issue-filter";
import { calculateEventScore } from "@/lib/score";
import { CATEGORY_MAP, CAMP_COLORS, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import type { IssueEvent } from "@/types";

const EASE = [0.32, 0.72, 0, 1] as const;

interface IssuesPageProps {
  events: IssueEvent[];
}

// ── 날짜 그루핑 ──

interface DateGroup {
  label: string;
  blue: IssueEvent[];
  red: IssueEvent[];
  total: number;
}

function groupByDate(events: IssueEvent[]): DateGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthAgo = new Date(today.getTime() - 30 * 86400000);

  const groups: Record<string, { blue: IssueEvent[]; red: IssueEvent[] }> = {};
  const order: string[] = [];

  function addToGroup(label: string, event: IssueEvent) {
    if (!groups[label]) {
      groups[label] = { blue: [], red: [] };
      order.push(label);
    }
    groups[label][event.camp].push(event);
  }

  for (const event of events) {
    const date = new Date(event.last_reported_at || event.created_at);
    if (date >= today) addToGroup("오늘", event);
    else if (date >= yesterday) addToGroup("어제", event);
    else if (date >= weekAgo) addToGroup("이번 주", event);
    else if (date >= monthAgo) addToGroup("이번 달", event);
    else {
      const monthLabel = date.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
      addToGroup(monthLabel, event);
    }
  }

  // 각 그룹 내에서 시간순 정렬 (최신 위)
  const byTime = (a: IssueEvent, b: IssueEvent) =>
    new Date(b.last_reported_at || b.created_at).getTime() -
    new Date(a.last_reported_at || a.created_at).getTime();

  return order.map((label) => ({
    label,
    blue: groups[label].blue.sort(byTime),
    red: groups[label].red.sort(byTime),
    total: groups[label].blue.length + groups[label].red.length,
  }));
}

// ── 진영별 카드 (home-page.tsx의 CampEventCard와 동일 스타일) ──

function CampCard({ event }: { event: IssueEvent }) {
  const colors = CAMP_COLORS[event.camp];
  const config = CATEGORY_MAP[event.category];
  const score = calculateEventScore(event);

  return (
    <Link href={`/issues/${event.representative_issue_id}`} className="group block">
      <div
        className="rounded-[1.25rem] p-[1px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.01]"
        style={{ background: `linear-gradient(135deg, ${colors.primary}15, transparent 60%)` }}
      >
        <div className="rounded-[calc(1.25rem-1px)] bg-white/[0.03] p-4 md:p-5">
          {/* 상단 */}
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase"
                style={{ backgroundColor: `${colors.primary}12`, color: colors.glow }}
              >
                {config?.label}
              </span>
              {event.criminal_stage && (
                <span className="text-[10px] text-red-400/50">
                  {CRIMINAL_STAGE_LABEL[event.criminal_stage]}
                </span>
              )}
            </div>
            {score > 0 && (
              <span className="font-mono text-base font-bold tabular-nums leading-none" style={{ color: colors.glow }}>
                {score.toFixed(1)}
              </span>
            )}
          </div>

          {/* 제목 */}
          <p className="mb-2 line-clamp-2 text-[14px] font-medium leading-snug text-white/80 transition-colors duration-300 group-hover:text-white">
            {event.summary || "사건 요약 없음"}
          </p>

          {/* 하단 */}
          <div className="flex items-center gap-2.5 text-[11px] text-white/25">
            {event.actor_name && <span className="text-white/35">{event.actor_name}</span>}
            {event.coverage_count > 1 && <span>{event.coverage_count}개 매체</span>}
            {event.issue_count > 1 && <span>{event.issue_count}개 보도</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── 컬럼 헤더 ──

function ColumnHeader({ camp }: { camp: "blue" | "red" }) {
  const colors = CAMP_COLORS[camp];
  const gradientDir = camp === "blue" ? "to-r" : "to-r";
  const fromColor = camp === "blue" ? "from-blue-500/15" : "from-red-500/15";

  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div
        className="h-2.5 w-2.5 rounded-full"
        style={{
          backgroundColor: colors.primary,
          boxShadow: `0 0 10px ${colors.primary}50`,
        }}
      />
      <span className="text-xs font-medium text-white/40">{colors.label}</span>
      <div className={`h-px flex-1 bg-gradient-${gradientDir} ${fromColor} to-transparent`} />
    </div>
  );
}

// ── 메인 컴포넌트 ──

export function IssuesPage({ events }: IssuesPageProps) {
  const [filters, setFilters] = useState<FilterState>({
    camp: "all",
    category: "all",
    sort: "latest",
  });
  const [showArchive, setShowArchive] = useState(false);

  const { scored, archive, dateGroups } = useMemo(() => {
    const filtered = events.filter((event) => {
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

  // 점수순일 때 좌우 분리
  const blueScored = scored.filter((e) => e.camp === "blue");
  const redScored = scored.filter((e) => e.camp === "red");

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 pt-24 pb-20 md:px-8">
        {/* 헤더 */}
        <div className="mb-10">
          <span className="mb-3 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/30 uppercase">
            타임라인
          </span>
          <h1 className="text-3xl font-bold tracking-tight">이슈 타임라인</h1>
          <p className="mt-2 text-sm text-white/35">
            공식 처분 기반 정치 사건을 진영별로 비교합니다
          </p>
        </div>

        <div className="mb-10">
          <IssueFilter onFilterChange={setFilters} />
        </div>

        {scored.length === 0 && archive.length === 0 ? (
          <div className="rounded-2xl border border-white/5 py-20 text-center text-white/25">
            해당 조건의 사건이 없습니다
          </div>
        ) : (
          <>
            {/* ── 날짜 그루핑 + 좌우 분할 (최신순) ── */}
            {filters.sort === "latest" && dateGroups.length > 0 ? (
              <div className="space-y-12">
                {dateGroups.map((group, gi) => (
                  <motion.section
                    key={group.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, delay: gi * 0.05, ease: EASE }}
                  >
                    {/* 날짜 헤더 */}
                    <div className="mb-6 flex items-center gap-4">
                      <h2 className="text-sm font-semibold text-white/50">{group.label}</h2>
                      <div className="h-px flex-1 bg-white/5" />
                      <span className="text-[11px] tabular-nums text-white/20">
                        {group.total}건
                      </span>
                    </div>

                    {/* 좌우 2열 */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                      {/* 파랑 (좌) */}
                      <div>
                        {gi === 0 && <ColumnHeader camp="blue" />}
                        {group.blue.length > 0 ? (
                          <div className="space-y-3">
                            {group.blue.map((event, i) => (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
                              >
                                <CampCard event={event} />
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-white/[0.03] py-8 text-center text-[11px] text-white/15">
                            이 기간 해당 없음
                          </div>
                        )}
                      </div>

                      {/* 빨강 (우) */}
                      <div>
                        {gi === 0 && <ColumnHeader camp="red" />}
                        {group.red.length > 0 ? (
                          <div className="space-y-3">
                            {group.red.map((event, i) => (
                              <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
                              >
                                <CampCard event={event} />
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-white/[0.03] py-8 text-center text-[11px] text-white/15">
                            이 기간 해당 없음
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.section>
                ))}
              </div>
            ) : scored.length > 0 ? (
              /* ── 점수순 — 좌우 분할 (날짜 그루핑 없이) ── */
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                <div>
                  <ColumnHeader camp="blue" />
                  <div className="space-y-3">
                    {blueScored.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.04, ease: EASE }}
                      >
                        <CampCard event={event} />
                      </motion.div>
                    ))}
                    {blueScored.length === 0 && (
                      <div className="rounded-xl border border-white/[0.03] py-12 text-center text-xs text-white/15">
                        해당 없음
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <ColumnHeader camp="red" />
                  <div className="space-y-3">
                    {redScored.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.04, ease: EASE }}
                      >
                        <CampCard event={event} />
                      </motion.div>
                    ))}
                    {redScored.length === 0 && (
                      <div className="rounded-xl border border-white/[0.03] py-12 text-center text-xs text-white/15">
                        해당 없음
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {/* ── Archive 접기 ── */}
            {archive.length > 0 && (
              <div className="mt-16">
                <button
                  onClick={() => setShowArchive(!showArchive)}
                  className="mb-5 flex w-full items-center gap-3 text-left transition-colors"
                >
                  <span className="rounded-full bg-white/[0.03] px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/25 uppercase">
                    기록
                  </span>
                  <span className="text-xs text-white/20">{archive.length}건</span>
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-xs text-white/20">
                    {showArchive ? "접기" : "펼치기"}
                  </span>
                  <svg
                    className={`h-3 w-3 text-white/15 transition-transform duration-300 ${showArchive ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showArchive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6"
                  >
                    {/* Archive도 좌우 분리 */}
                    <div className="space-y-1 rounded-[1.25rem] bg-white/[0.01] p-3 ring-1 ring-white/5">
                      <p className="mb-2 px-2 text-[10px] text-white/20">{CAMP_COLORS.blue.label}</p>
                      {archive.filter((e) => e.camp === "blue").map((event) => (
                        <Link
                          key={event.id}
                          href={`/issues/${event.representative_issue_id}`}
                          className="group flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.03]"
                        >
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `${CAMP_COLORS.blue.primary}40` }} />
                          <span className="flex-1 truncate text-[13px] text-white/35 transition-colors group-hover:text-white/55">
                            {event.actor_name && <span className="text-white/20">{event.actor_name} — </span>}
                            {event.summary || event.category}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <div className="space-y-1 rounded-[1.25rem] bg-white/[0.01] p-3 ring-1 ring-white/5">
                      <p className="mb-2 px-2 text-[10px] text-white/20">{CAMP_COLORS.red.label}</p>
                      {archive.filter((e) => e.camp === "red").map((event) => (
                        <Link
                          key={event.id}
                          href={`/issues/${event.representative_issue_id}`}
                          className="group flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.03]"
                        >
                          <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: `${CAMP_COLORS.red.primary}40` }} />
                          <span className="flex-1 truncate text-[13px] text-white/35 transition-colors group-hover:text-white/55">
                            {event.actor_name && <span className="text-white/20">{event.actor_name} — </span>}
                            {event.summary || event.category}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
