"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Nav } from "./nav";
import { IssueFilter, type FilterState, type EventTypeFilter } from "./issue-filter";
import { calculateEventScore } from "@/lib/score";
import { CATEGORY_MAP, CAMP_COLORS, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import type { IssueEvent } from "@/types";

const EASE = [0.32, 0.72, 0, 1] as const;
const FOUR_HOURS = 4 * 60 * 60 * 1000;

interface IssuesPageProps {
  events: IssueEvent[];
}

// ── 타임라인 Row: 같은 시간대(4h)의 blue/red를 하나의 row로 ──

interface TimelineRow {
  blue: IssueEvent | null;
  red: IssueEvent | null;
  time: number; // 대표 timestamp
}

interface DateSection {
  label: string;
  rows: TimelineRow[];
}

function getEventTime(e: IssueEvent): number {
  return new Date(e.last_reported_at || e.created_at).getTime();
}

function buildTimelineRows(events: IssueEvent[]): TimelineRow[] {
  // 전체 events를 시간순 정렬 (최신 먼저)
  const sorted = [...events].sort((a, b) => getEventTime(b) - getEventTime(a));
  const rows: TimelineRow[] = [];
  const used = new Set<string>();

  for (const event of sorted) {
    if (used.has(event.id)) continue;
    used.add(event.id);

    const time = getEventTime(event);
    const side = event.camp;

    // 반대편 진영에서 4시간 이내 이벤트 찾기
    const otherCamp = side === "blue" ? "red" : "blue";
    let partner: IssueEvent | null = null;

    for (const candidate of sorted) {
      if (used.has(candidate.id)) continue;
      if (candidate.camp !== otherCamp) continue;
      if (Math.abs(getEventTime(candidate) - time) <= FOUR_HOURS) {
        partner = candidate;
        used.add(candidate.id);
        break;
      }
    }

    rows.push({
      blue: side === "blue" ? event : partner,
      red: side === "red" ? event : partner,
      time,
    });
  }

  return rows;
}

function groupRowsByDate(rows: TimelineRow[]): DateSection[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  const monthAgo = new Date(today.getTime() - 30 * 86400000);

  const sections: Record<string, TimelineRow[]> = {};
  const order: string[] = [];

  function addRow(label: string, row: TimelineRow) {
    if (!sections[label]) {
      sections[label] = [];
      order.push(label);
    }
    sections[label].push(row);
  }

  for (const row of rows) {
    const date = new Date(row.time);
    if (date >= today) addRow("오늘", row);
    else if (date >= yesterday) addRow("어제", row);
    else if (date >= weekAgo) addRow("이번 주", row);
    else if (date >= monthAgo) addRow("이번 달", row);
    else {
      const monthLabel = date.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
      addRow(monthLabel, row);
    }
  }

  return order.map((label) => ({ label, rows: sections[label] }));
}

// ── 진영별 카드 ──

function buildHeadline(event: IssueEvent): string {
  // summary 첫 문장을 헤드라인으로 사용
  const summary = event.summary || "";
  const firstSentence = summary.split(/[.。!]\s*/)[0];
  if (firstSentence && firstSentence.length > 5) {
    return firstSentence.length > 60 ? firstSentence.slice(0, 60) + "…" : firstSentence;
  }
  // fallback: actor + category
  const config = CATEGORY_MAP[event.category];
  const actor = event.actor_name || "";
  return actor ? `${actor}, ${config?.description || config?.label || ""}` : config?.label || "";
}

function CampCard({ event }: { event: IssueEvent }) {
  const colors = CAMP_COLORS[event.camp];
  const config = CATEGORY_MAP[event.category];
  const score = calculateEventScore(event);
  const headline = buildHeadline(event);

  return (
    <Link href={`/issues/${event.representative_issue_id}`} className="group block">
      <div
        className="rounded-[1.25rem] p-[1px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.01]"
        style={{ background: `linear-gradient(135deg, ${colors.primary}15, transparent 60%)` }}
      >
        <div className="rounded-[calc(1.25rem-1px)] bg-white/[0.03] p-4 md:p-5">
          {/* 상단: 카테고리 뱃지 + 점수 */}
          <div className="mb-2 flex items-center justify-between">
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

          {/* 핵심 헤드라인 — 1줄 */}
          <h3 className="mb-1 truncate text-[15px] font-semibold text-white/90 transition-colors duration-300 group-hover:text-white">
            {headline}
          </h3>

          {/* 보조 요약 — 1줄 */}
          {event.summary && (
            <p className="mb-2 line-clamp-1 text-[13px] leading-snug text-white/40">
              {event.summary}
            </p>
          )}

          {/* 하단 메트릭 */}
          <div className="flex items-center gap-2.5 text-[11px] text-white/25">
            {event.coverage_count > 1 && <span>{event.coverage_count}개 매체</span>}
            {event.issue_count > 1 && <span>{event.issue_count}개 보도</span>}
            {event.headline_days > 1 && <span>{event.headline_days}일</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── 메인 ──

export function IssuesPage({ events }: IssuesPageProps) {
  const [filters, setFilters] = useState<FilterState>({
    camp: "all",
    category: "all",
    sort: "latest",
    eventType: "all",
  });

  function filterByEventType(e: IssueEvent, eventType: EventTypeFilter): boolean {
    const isScored = CATEGORY_MAP[e.category]?.isScored ?? false;
    const isSocial = e.category === "social_controversy";
    switch (eventType) {
      case "all": return true;
      case "scored": return isScored;
      case "social": return isSocial;
      case "archive": return !isScored && !isSocial;
    }
  }

  const { timelineEvents, dateSections } = useMemo(() => {
    const filtered = events.filter((event) => {
      if (filters.camp !== "all" && event.camp !== filters.camp) return false;
      if (filters.category !== "all" && event.category !== filters.category) return false;
      if (!filterByEventType(event, filters.eventType)) return false;
      return true;
    });

    // 타임라인 rows 생성
    const rows = buildTimelineRows(filtered);
    const dateSections = filters.sort === "latest" ? groupRowsByDate(rows) : [];

    // 점수순
    if (filters.sort === "score") {
      filtered.sort((a, b) => calculateEventScore(b) - calculateEventScore(a));
    }

    return { timelineEvents: filtered, dateSections };
  }, [events, filters]);

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
            공식 처분 기반 정치 사건을 시간순으로 비교합니다
          </p>
        </div>

        <div className="mb-10">
          <IssueFilter onFilterChange={setFilters} />
        </div>

        {timelineEvents.length === 0 ? (
          <div className="rounded-2xl border border-white/5 py-20 text-center text-white/25">
            해당 조건의 사건이 없습니다
          </div>
        ) : (
          <>
            {/* 컬럼 헤더 — 최상단 1번만 */}
            <div className="mb-8 hidden grid-cols-2 gap-6 md:grid">
              {(["blue", "red"] as const).map((camp) => {
                const colors = CAMP_COLORS[camp];
                const fromColor = camp === "blue" ? "from-blue-500/15" : "from-red-500/15";
                return (
                  <div key={camp} className="flex items-center gap-2.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: colors.primary,
                        boxShadow: `0 0 10px ${colors.primary}50`,
                      }}
                    />
                    <span className="text-xs font-medium text-white/40">{colors.label}</span>
                    <div className={`h-px flex-1 bg-gradient-to-r ${fromColor} to-transparent`} />
                  </div>
                );
              })}
            </div>

            {/* ── 최신순: 통합 타임라인 ── */}
            {filters.sort === "latest" && dateSections.length > 0 ? (
              <div className="space-y-10">
                {dateSections.map((section, si) => (
                  <motion.section
                    key={section.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, delay: si * 0.04, ease: EASE }}
                  >
                    {/* 날짜 헤더 */}
                    <div className="mb-5 flex items-center gap-4">
                      <h2 className="text-sm font-semibold text-white/50">{section.label}</h2>
                      <div className="h-px flex-1 bg-white/5" />
                      <span className="text-[11px] tabular-nums text-white/20">
                        {section.rows.length}건
                      </span>
                    </div>

                    {/* 타임라인 rows */}
                    <div className="space-y-3">
                      {section.rows.map((row, ri) => (
                        <motion.div
                          key={`${row.time}-${ri}`}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: ri * 0.04, ease: EASE }}
                          className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6"
                        >
                          {/* 파랑 (좌) */}
                          <div>
                            {row.blue ? (
                              <CampCard event={row.blue} />
                            ) : (
                              <div className="hidden md:block" />
                            )}
                          </div>
                          {/* 빨강 (우) */}
                          <div>
                            {row.red ? (
                              <CampCard event={row.red} />
                            ) : (
                              <div className="hidden md:block" />
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                ))}
              </div>
            ) : timelineEvents.length > 0 ? (
              /* ── 점수순 ── */
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                {(["blue", "red"] as const).map((camp) => {
                  const campEvents = timelineEvents.filter((e) => e.camp === camp);
                  return (
                    <div key={camp}>
                      <div className="space-y-3">
                        {campEvents.map((event, i) => (
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
                        {campEvents.length === 0 && (
                          <div className="rounded-xl border border-white/[0.03] py-12 text-center text-xs text-white/15">
                            해당 없음
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

          </>
        )}
      </main>
    </>
  );
}
