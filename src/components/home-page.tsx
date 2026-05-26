"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SplitScreen } from "./split-screen";
import { Nav } from "./nav";
import { ViewTabs } from "./view-tabs";
import { calculateEventScores, calculateEventScore, type ScoreView } from "@/lib/score";
import { CATEGORY_MAP, CAMP_COLORS, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import type { IssueEvent, CriminalStage } from "@/types";

interface HomePageProps {
  events: IssueEvent[];
}

// ── 컴팩트 카드 (3열 그리드용) ──

function CompactCard({ event }: { event: IssueEvent }) {
  const colors = CAMP_COLORS[event.camp];
  const config = CATEGORY_MAP[event.category];
  const refDate = event.last_reported_at || event.created_at;
  const dateStr = new Date(refDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });

  return (
    <Link
      href={`/issues/${event.representative_issue_id}`}
      className="group relative block overflow-hidden rounded-2xl bg-white/[0.02] transition-all duration-200 hover:bg-white/[0.05]"
    >
      {/* 상단 컬러 바 */}
      <div className="h-0.5" style={{ backgroundColor: colors.primary }} />

      <div className="p-4">
        {/* 카테고리 + 날짜 */}
        <div className="mb-2.5 flex items-center justify-between">
          <span
            className="rounded-full px-2 py-0.5 text-[9px] font-medium"
            style={{ backgroundColor: `${colors.primary}12`, color: colors.glow }}
          >
            {config?.label}
          </span>
          <span className="text-[10px] text-white/20">{dateStr}</span>
        </div>

        {/* 행위자 */}
        {event.actor_name && (
          <p className="mb-1 text-xs font-medium text-white/50">{event.actor_name}</p>
        )}

        {/* 요약 — 2줄 */}
        <p className="line-clamp-2 text-[13px] leading-snug text-white/55 transition-colors group-hover:text-white/75">
          {event.summary || config?.label}
        </p>

        {/* 하단 메트릭 */}
        <div className="mt-3 flex items-center gap-2.5 text-[10px] text-white/20">
          {event.criminal_stage && (event.criminal_stage in CRIMINAL_STAGE_LABEL) && (
            <span className="text-red-400/40">
              {CRIMINAL_STAGE_LABEL[event.criminal_stage as CriminalStage]}
            </span>
          )}
          {event.coverage_count > 1 && (
            <span>{event.coverage_count}개 매체</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── 타임라인 ──

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "오늘";
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

function RecentTimeline({ events }: { events: IssueEvent[] }) {
  const recent = [...events]
    .sort((a, b) => new Date(b.last_reported_at || b.created_at).getTime() - new Date(a.last_reported_at || a.created_at).getTime())
    .slice(0, 12);

  if (recent.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400/80" />
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/30 uppercase">
            최근 기록
          </span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white/90">
          공식 처분 타임라인
        </h2>
        <p className="mt-2 text-sm text-white/30">
          법원·검찰·선관위 등 공식 기관의 최신 처분 기록
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent md:left-4" />

        <div className="space-y-1">
          {recent.map((event, i) => {
            const colors = CAMP_COLORS[event.camp];
            const config = CATEGORY_MAP[event.category];
            const refDate = event.last_reported_at || event.created_at;
            const relative = formatRelativeDate(refDate);
            const dateStr = new Date(refDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
              >
                <Link
                  href={`/issues/${event.representative_issue_id}`}
                  className="group relative flex gap-4 rounded-xl py-3 pl-8 pr-4 transition-colors hover:bg-white/[0.03] md:pl-10"
                >
                  <div
                    className="absolute left-1.5 top-5 h-3 w-3 rounded-full ring-2 ring-[#0c0c10] md:left-2.5"
                    style={{ backgroundColor: colors.primary }}
                  />

                  <div className="w-16 shrink-0 pt-0.5">
                    <p className="text-[11px] font-medium text-white/35">{dateStr}</p>
                    <p className="text-[10px] text-white/15">{relative}</p>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      {event.actor_name && (
                        <span className="text-sm font-medium text-white/70">{event.actor_name}</span>
                      )}
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px]"
                        style={{ backgroundColor: `${colors.primary}15`, color: colors.glow }}
                      >
                        {config?.label}
                      </span>
                      {event.criminal_stage && (event.criminal_stage in CRIMINAL_STAGE_LABEL) && (
                        <span className="text-[10px] text-white/25">
                          {CRIMINAL_STAGE_LABEL[event.criminal_stage as CriminalStage]}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-[13px] text-white/45 transition-colors group-hover:text-white/65">
                      {event.summary}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/issues"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm text-white/35 transition-colors hover:border-white/20 hover:text-white/55"
        >
          전체 타임라인 보기 &rarr;
        </Link>
      </div>
    </section>
  );
}

// ── 메인 ──

export function HomePage({ events }: HomePageProps) {
  const [view, setView] = useState<ScoreView>("recent");
  const score = calculateEventScores(events, view);

  // 진영별 최신순 전체 이벤트 (scored + archive + social 모두)
  const sortedByDate = [...events].sort(
    (a, b) => new Date(b.last_reported_at || b.created_at).getTime() - new Date(a.last_reported_at || a.created_at).getTime()
  );
  const blueEvents = sortedByDate.filter((e) => e.camp === "blue").slice(0, 9);
  const redEvents = sortedByDate.filter((e) => e.camp === "red").slice(0, 9);

  return (
    <>
      <Nav />
      <main>
        {/* 메인 스코어보드 */}
        <SplitScreen score={score} view={view} onViewChange={setView} />

        {/* ── 최근 기록 타임라인 ── */}
        <RecentTimeline events={events} />

        {/* ── 진영별 이슈 — 풀 width, 3열 그리드 ── */}
        <section className="w-full bg-white/[0.01] py-24">
          <div className="mx-auto max-w-[1400px] px-4 md:px-8">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="mb-3 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/30 uppercase">
                  진영별
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-white/90">
                  진영별 이슈
                </h2>
                <p className="mt-2 text-sm text-white/30">
                  최신 이슈를 진영별로 한눈에 비교합니다
                </p>
              </div>
              <Link
                href="/issues"
                className="group flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm text-white/40 hover:border-white/20 hover:text-white/60"
              >
                전체 타임라인
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">&rarr;</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              {/* 파랑 */}
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CAMP_COLORS.blue.primary, boxShadow: `0 0 12px ${CAMP_COLORS.blue.primary}60` }}
                  />
                  <span className="text-sm font-medium text-white/50">{CAMP_COLORS.blue.label}</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-blue-500/15 to-transparent" />
                  <span className="text-xs text-white/20">{blueEvents.length}건</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {blueEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.05, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <CompactCard event={event} />
                    </motion.div>
                  ))}
                </div>

                {blueEvents.length === 0 && (
                  <div className="rounded-xl border border-white/5 py-12 text-center text-xs text-white/20">
                    수집된 이슈 없음
                  </div>
                )}
              </div>

              {/* 빨강 */}
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CAMP_COLORS.red.primary, boxShadow: `0 0 12px ${CAMP_COLORS.red.primary}60` }}
                  />
                  <span className="text-sm font-medium text-white/50">{CAMP_COLORS.red.label}</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-red-500/15 to-transparent" />
                  <span className="text-xs text-white/20">{redEvents.length}건</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {redEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.05, ease: [0.32, 0.72, 0, 1] }}
                    >
                      <CompactCard event={event} />
                    </motion.div>
                  ))}
                </div>

                {redEvents.length === 0 && (
                  <div className="rounded-xl border border-white/5 py-12 text-center text-xs text-white/20">
                    수집된 이슈 없음
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/5 py-16 text-center text-xs text-white/20">
          <p className="tracking-wide">민낯 — 사회·제도의 반응을 측정합니다</p>
          <p className="mt-1.5">모든 점수의 근거는 투명하게 공개됩니다</p>
        </footer>
      </main>
    </>
  );
}
