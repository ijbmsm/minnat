"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SplitScreen } from "./split-screen";
import { Nav } from "./nav";
import { ViewTabs } from "./view-tabs";
import { CategoryBarChart } from "./category-bar-chart";
import { calculateEventScores, calculateEventScore, type ScoreView } from "@/lib/score";
import { CATEGORY_MAP, CAMP_COLORS, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import type { IssueEvent, CriminalStage } from "@/types";

interface HomePageProps {
  events: IssueEvent[];
}

// ── 진영별 Event 카드 ──

function buildHeadline(event: IssueEvent): string {
  const summary = event.summary || "";
  const firstSentence = summary.split(/[.。!]\s*/)[0];
  if (firstSentence && firstSentence.length > 5) {
    return firstSentence.length > 60 ? firstSentence.slice(0, 60) + "…" : firstSentence;
  }
  const config = CATEGORY_MAP[event.category];
  const actor = event.actor_name || "";
  return actor ? `${actor}, ${config?.description || config?.label || ""}` : config?.label || "";
}

function CampEventCard({ event, view }: { event: IssueEvent; view: ScoreView }) {
  const colors = CAMP_COLORS[event.camp];
  const config = CATEGORY_MAP[event.category];
  const score = calculateEventScore(event, view);
  const headline = buildHeadline(event);

  return (
    <Link
      href={`/issues/${event.representative_issue_id}`}
      className="group block"
    >
      <div
        className="rounded-[1.25rem] p-[1px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.01]"
        style={{
          background: `linear-gradient(135deg, ${colors.primary}15, transparent 60%)`,
        }}
      >
        <div className="rounded-[calc(1.25rem-1px)] bg-white/[0.03] p-5 backdrop-blur-sm">
          {/* 상단: 카테고리 + 점수 */}
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase"
                style={{
                  backgroundColor: `${colors.primary}12`,
                  color: `${colors.glow}`,
                }}
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
              <span
                className="font-mono text-lg font-bold tabular-nums leading-none"
                style={{ color: colors.glow }}
              >
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
          <div className="flex items-center gap-3 text-[11px] text-white/25">
            {event.actor_name && (
              <span className="text-white/35">{event.actor_name}</span>
            )}
            {event.coverage_count > 1 && (
              <span>{event.coverage_count}개 매체</span>
            )}
            {event.headline_days > 1 && (
              <span>{event.headline_days}일</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

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
        {/* 세로 타임라인 선 */}
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
                  {/* 타임라인 점 */}
                  <div
                    className="absolute left-1.5 top-5 h-3 w-3 rounded-full ring-2 ring-[#0c0c10] md:left-2.5"
                    style={{ backgroundColor: colors.primary }}
                  />

                  {/* 날짜 */}
                  <div className="w-16 shrink-0 pt-0.5">
                    <p className="text-[11px] font-medium text-white/35">{dateStr}</p>
                    <p className="text-[10px] text-white/15">{relative}</p>
                  </div>

                  {/* 내용 */}
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

export function HomePage({ events }: HomePageProps) {
  const [view, setView] = useState<ScoreView>("recent");
  const score = calculateEventScores(events, view);

  // 진영별 상위 Event
  const scoredEvents = events.filter((e) => CATEGORY_MAP[e.category]?.isScored);
  const blueEvents = scoredEvents
    .filter((e) => e.camp === "blue")
    .sort((a, b) => calculateEventScore(b, view) - calculateEventScore(a, view))
    .slice(0, 5);
  const redEvents = scoredEvents
    .filter((e) => e.camp === "red")
    .sort((a, b) => calculateEventScore(b, view) - calculateEventScore(a, view))
    .slice(0, 5);

  return (
    <>
      <Nav />
      <main>
        {/* 메인 스코어보드 */}
        <SplitScreen score={score} view={view} onViewChange={setView} />

        {/* 카테고리 바 차트 */}
        <section className="mx-auto max-w-5xl px-4 py-24">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="mb-3 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/30 uppercase">
                카테고리
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white/90">
                유형별 비교
              </h2>
            </div>
            <ViewTabs current={view} onChange={setView} />
          </div>
          <CategoryBarChart events={events} view={view} />
        </section>

        {/* ── 최근 기록 타임라인 ── */}
        <RecentTimeline events={events} />

        {/* ── 주요 사건: 파랑 vs 빨강 2열 ── */}
        <section className="mx-auto max-w-6xl px-4 pb-32">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="mb-3 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/30 uppercase">
                주요 사건
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white/90">
                진영별 공식 처분
              </h2>
              <p className="mt-2 text-sm text-white/30">
                점수가 높은 공식 처분 사건을 진영별로 비교합니다
              </p>
            </div>
            <Link
              href="/issues"
              className="group flex items-center gap-2 rounded-full border border-white/10 px-5 py-2 text-sm text-white/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/20 hover:text-white/60"
            >
              전체 타임라인
              <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
                &rarr;
              </span>
            </Link>
          </div>

          {blueEvents.length === 0 && redEvents.length === 0 ? (
            <div className="rounded-2xl border border-white/5 py-20 text-center text-white/25">
              수집된 공식 처분 사건이 없습니다
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              {/* 파랑 (좌) */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
              >
                {/* Column header */}
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: CAMP_COLORS.blue.primary,
                      boxShadow: `0 0 12px ${CAMP_COLORS.blue.primary}60`,
                    }}
                  />
                  <span className="text-sm font-medium text-white/50">
                    {CAMP_COLORS.blue.label}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-blue-500/15 to-transparent" />
                </div>

                <div className="space-y-3">
                  {blueEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.08,
                        ease: [0.32, 0.72, 0, 1],
                      }}
                    >
                      <CampEventCard event={event} view={view} />
                    </motion.div>
                  ))}
                  {blueEvents.length === 0 && (
                    <div className="rounded-xl border border-white/5 py-12 text-center text-xs text-white/20">
                      관련 공식 처분 없음
                    </div>
                  )}
                </div>
              </motion.div>

              {/* 빨강 (우) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
              >
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: CAMP_COLORS.red.primary,
                      boxShadow: `0 0 12px ${CAMP_COLORS.red.primary}60`,
                    }}
                  />
                  <span className="text-sm font-medium text-white/50">
                    {CAMP_COLORS.red.label}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-red-500/15 to-transparent" />
                </div>

                <div className="space-y-3">
                  {redEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.08,
                        ease: [0.32, 0.72, 0, 1],
                      }}
                    >
                      <CampEventCard event={event} view={view} />
                    </motion.div>
                  ))}
                  {redEvents.length === 0 && (
                    <div className="rounded-xl border border-white/5 py-12 text-center text-xs text-white/20">
                      관련 공식 처분 없음
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </section>

        <footer className="border-t border-white/5 py-16 text-center text-xs text-white/20">
          <p className="tracking-wide">민낯 — 사회·제도의 반응을 측정합니다</p>
          <p className="mt-1.5">모든 점수의 근거는 투명하게 공개됩니다</p>
        </footer>
      </main>
    </>
  );
}
