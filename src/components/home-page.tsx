"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SplitScreen } from "./split-screen";
import { Nav } from "./nav";
import { calculateEventScores, type ScoreView } from "@/lib/score";
import { CATEGORY_MAP, CAMP_COLORS, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import type { IssueEvent, CriminalStage } from "@/types";

const EASE = [0.32, 0.72, 0, 1] as const;

interface HomePageProps {
  events: IssueEvent[];
}

// ── 유틸 ──

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function getRefDate(e: IssueEvent): string {
  return e.last_reported_at || e.created_at;
}

function CampDot({ camp }: { camp: "blue" | "red" }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: CAMP_COLORS[camp].primary }}
    />
  );
}

// ── Hero 카드 (가장 큰 이벤트) ──

function HeroCard({ event }: { event: IssueEvent }) {
  const colors = CAMP_COLORS[event.camp];
  const config = CATEGORY_MAP[event.category];

  return (
    <Link href={`/issues/${event.representative_issue_id}`} className="group block">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        {/* Doppelrand — outer shell */}
        <div className="rounded-[2rem] bg-white/[0.03] p-1.5 ring-1 ring-white/[0.06]">
          {/* inner core */}
          <div
            className="relative overflow-hidden rounded-[calc(2rem-6px)] p-8 md:p-12"
            style={{
              background: `radial-gradient(ellipse 70% 50% at 30% 0%, ${colors.primary}08, transparent 70%), rgba(255,255,255,0.02)`,
            }}
          >
            {/* 진영 + 카테고리 */}
            <div className="mb-5 flex items-center gap-3">
              <CampDot camp={event.camp} />
              <span
                className="rounded-full px-3 py-1 text-[10px] font-medium tracking-[0.1em] uppercase"
                style={{ backgroundColor: `${colors.primary}10`, color: colors.glow }}
              >
                {config?.label}
              </span>
              {event.criminal_stage && (event.criminal_stage in CRIMINAL_STAGE_LABEL) && (
                <span className="text-[11px] text-red-400/50">
                  {CRIMINAL_STAGE_LABEL[event.criminal_stage as CriminalStage]}
                </span>
              )}
              <span className="text-[11px] text-white/20">{formatRelative(getRefDate(event))}</span>
            </div>

            {/* 행위자 */}
            {event.actor_name && (
              <p className="mb-2 text-sm font-medium text-white/40">{event.actor_name}</p>
            )}

            {/* 헤드라인 */}
            <h2 className="mb-4 text-2xl font-bold leading-snug tracking-tight text-white/90 transition-colors duration-500 group-hover:text-white md:text-3xl md:leading-snug">
              {event.summary || config?.label}
            </h2>

            {/* 메트릭 */}
            <div className="flex items-center gap-4 text-xs text-white/25">
              {event.coverage_count > 1 && <span>{event.coverage_count}개 매체 보도</span>}
              {event.headline_days > 1 && <span>{event.headline_days}일째 지속</span>}
              <span>{CAMP_COLORS[event.camp].label}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ── 미디엄 카드 (2열 그리드) ──

function MediumCard({ event, index }: { event: IssueEvent; index: number }) {
  const colors = CAMP_COLORS[event.camp];
  const config = CATEGORY_MAP[event.category];

  return (
    <Link href={`/issues/${event.representative_issue_id}`} className="group block h-full">
      <motion.div
        className="h-full"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: index * 0.06, ease: EASE }}
      >
        <div className="h-full rounded-[1.5rem] bg-white/[0.02] p-1 ring-1 ring-white/[0.05] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:bg-white/[0.04] group-hover:ring-white/[0.08]">
          <div className="flex h-full flex-col rounded-[calc(1.5rem-4px)] p-6">
            {/* 상단 */}
            <div className="mb-4 flex items-center gap-2.5">
              <CampDot camp={event.camp} />
              <span
                className="rounded-full px-2.5 py-0.5 text-[9px] font-medium tracking-wide uppercase"
                style={{ backgroundColor: `${colors.primary}10`, color: colors.glow }}
              >
                {config?.label}
              </span>
              {event.criminal_stage && (event.criminal_stage in CRIMINAL_STAGE_LABEL) && (
                <span className="text-[10px] text-red-400/40">
                  {CRIMINAL_STAGE_LABEL[event.criminal_stage as CriminalStage]}
                </span>
              )}
            </div>

            {/* 행위자 */}
            {event.actor_name && (
              <p className="mb-1.5 text-xs font-medium text-white/40">{event.actor_name}</p>
            )}

            {/* 요약 */}
            <p className="mb-auto line-clamp-3 text-[15px] leading-relaxed text-white/60 transition-colors duration-300 group-hover:text-white/80">
              {event.summary || config?.label}
            </p>

            {/* 하단 */}
            <div className="mt-5 flex items-center justify-between border-t border-white/[0.04] pt-4">
              <span className="text-[11px] text-white/20">{formatRelative(getRefDate(event))}</span>
              <div className="flex items-center gap-3 text-[10px] text-white/15">
                {event.coverage_count > 1 && <span>{event.coverage_count}개 매체</span>}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ── 사이드바 피드 아이템 ──

function FeedItem({ event, index }: { event: IssueEvent; index: number }) {
  const colors = CAMP_COLORS[event.camp];
  const config = CATEGORY_MAP[event.category];

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: EASE }}
    >
      <Link
        href={`/issues/${event.representative_issue_id}`}
        className="group flex gap-4 rounded-xl py-3 px-2 transition-colors duration-300 hover:bg-white/[0.03]"
      >
        {/* 넘버링 */}
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums" style={{ backgroundColor: `${colors.primary}10`, color: colors.glow }}>
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <CampDot camp={event.camp} />
            <span className="text-[10px] text-white/25">{config?.label}</span>
            <span className="text-[10px] text-white/15">{formatRelative(getRefDate(event))}</span>
          </div>
          <p className="line-clamp-2 text-[13px] leading-snug text-white/55 transition-colors duration-300 group-hover:text-white/80">
            {event.actor_name && <span className="font-medium text-white/65">{event.actor_name} — </span>}
            {event.summary || config?.label}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

// ── 메인 ──

export function HomePage({ events }: HomePageProps) {
  const [view, setView] = useState<ScoreView>("recent");
  const score = calculateEventScores(events, view);

  const sorted = [...events].sort(
    (a, b) => new Date(getRefDate(b)).getTime() - new Date(getRefDate(a)).getTime()
  );

  // Hero: 최신 1건
  const hero = sorted[0] ?? null;
  // 미디엄 그리드: 2~5번째
  const mediumEvents = sorted.slice(1, 5);
  // 사이드바 피드: 파랑 최신 8건 + 빨강 최신 8건
  const blueFeed = sorted.filter((e) => e.camp === "blue").slice(0, 8);
  const redFeed = sorted.filter((e) => e.camp === "red").slice(0, 8);

  return (
    <>
      <Nav />
      <main>
        {/* 메인 스코어보드 */}
        <SplitScreen score={score} view={view} onViewChange={setView} />

        {/* ── 뉴스 그리드 ── */}
        <section className="mx-auto max-w-[1400px] px-4 py-24 md:px-8">
          {/* 섹션 헤더 */}
          <motion.div
            className="mb-14 flex flex-wrap items-end justify-between gap-6"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div>
              <span className="mb-3 inline-block rounded-full bg-white/[0.04] px-4 py-1.5 text-[10px] font-medium tracking-[0.2em] text-white/30 uppercase">
                최신 이슈
              </span>
              <h2 className="text-4xl font-bold tracking-tight text-white/90">
                오늘의 이슈
              </h2>
            </div>
            <Link
              href="/issues"
              className="group flex items-center gap-3 rounded-full bg-white/[0.04] px-6 py-3 text-sm text-white/50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.08] hover:text-white/70"
            >
              전체 타임라인
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.08] text-xs transition-transform duration-300 group-hover:translate-x-0.5">
                &rarr;
              </span>
            </Link>
          </motion.div>

          {/* Hero + 미디엄 그리드 */}
          {hero && (
            <div className="mb-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Hero — 8칸 */}
                <div className="lg:col-span-8">
                  <HeroCard event={hero} />
                </div>

                {/* 우측 2개 스택 — 4칸 */}
                <div className="flex flex-col gap-6 lg:col-span-4">
                  {mediumEvents.slice(0, 2).map((event, i) => (
                    <div key={event.id} className="flex-1">
                      <MediumCard event={event} index={i} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 하단 2열 미디엄 */}
          {mediumEvents.length > 2 && (
            <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2">
              {mediumEvents.slice(2, 4).map((event, i) => (
                <MediumCard key={event.id} event={event} index={i + 2} />
              ))}
            </div>
          )}

          {/* ── 진영별 피드 — 2열 ── */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
            {/* 파랑 피드 */}
            <div>
              <motion.div
                className="mb-6 flex items-center gap-3"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: CAMP_COLORS.blue.primary, boxShadow: `0 0 12px ${CAMP_COLORS.blue.primary}50` }}
                />
                <span className="text-sm font-semibold text-white/55">{CAMP_COLORS.blue.label}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-blue-500/15 to-transparent" />
              </motion.div>

              <div className="divide-y divide-white/[0.04]">
                {blueFeed.map((event, i) => (
                  <FeedItem key={event.id} event={event} index={i} />
                ))}
              </div>

              {blueFeed.length === 0 && (
                <p className="py-12 text-center text-xs text-white/15">수집된 이슈 없음</p>
              )}
            </div>

            {/* 빨강 피드 */}
            <div>
              <motion.div
                className="mb-6 flex items-center gap-3"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: CAMP_COLORS.red.primary, boxShadow: `0 0 12px ${CAMP_COLORS.red.primary}50` }}
                />
                <span className="text-sm font-semibold text-white/55">{CAMP_COLORS.red.label}</span>
                <div className="h-px flex-1 bg-gradient-to-r from-red-500/15 to-transparent" />
              </motion.div>

              <div className="divide-y divide-white/[0.04]">
                {redFeed.map((event, i) => (
                  <FeedItem key={event.id} event={event} index={i} />
                ))}
              </div>

              {redFeed.length === 0 && (
                <p className="py-12 text-center text-xs text-white/15">수집된 이슈 없음</p>
              )}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.04] py-20 text-center">
          <p className="text-xs tracking-widest text-white/20">민낯 — 사회·제도의 반응을 측정합니다</p>
          <p className="mt-2 text-[11px] text-white/10">모든 점수의 근거는 투명하게 공개됩니다</p>
        </footer>
      </main>
    </>
  );
}
