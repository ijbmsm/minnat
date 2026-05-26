"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SplitScreen } from "./split-screen";
import { Nav } from "./nav";
import { calculateEventScores } from "@/lib/score";
import type { ScoreView } from "@/lib/score";
import { CATEGORY_MAP, CAMP_COLORS, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import type { IssueEvent, CriminalStage } from "@/types";

const EASE = [0.32, 0.72, 0, 1] as const;

interface HomePageProps {
  events: IssueEvent[];
}

function getRefDate(e: IssueEvent): string {
  return e.last_reported_at || e.created_at;
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// ── 피드 아이템 (메인 리스트) ──

function FeedCard({ event, index }: { event: IssueEvent; index: number }) {
  const colors = CAMP_COLORS[event.camp];
  const config = CATEGORY_MAP[event.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.03, ease: EASE }}
    >
      <Link
        href={`/issues/${event.representative_issue_id}`}
        className="group relative block"
      >
        <div className="flex gap-5 border-b border-white/[0.04] py-6 transition-colors duration-300 group-hover:bg-white/[0.01]">
          {/* 좌측: 진영 인디케이터 */}
          <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
            <div
              className="h-8 w-px"
              style={{ background: `linear-gradient(to bottom, ${colors.primary}30, transparent)` }}
            />
          </div>

          {/* 우측: 콘텐츠 */}
          <div className="min-w-0 flex-1">
            {/* 메타 라인 */}
            <div className="mb-2 flex flex-wrap items-center gap-2.5 text-[11px]">
              <span style={{ color: `${colors.glow}cc` }} className="font-medium">
                {CAMP_COLORS[event.camp].label}
              </span>
              <span className="text-white/10">&middot;</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px]"
                style={{ backgroundColor: `${colors.primary}0d`, color: `${colors.glow}99` }}
              >
                {config?.label}
              </span>
              {event.criminal_stage && (event.criminal_stage in CRIMINAL_STAGE_LABEL) && (
                <>
                  <span className="text-white/10">&middot;</span>
                  <span className="text-red-400/50">
                    {CRIMINAL_STAGE_LABEL[event.criminal_stage as CriminalStage]}
                  </span>
                </>
              )}
              <span className="ml-auto text-white/20">{formatRelative(getRefDate(event))}</span>
            </div>

            {/* 행위자 */}
            {event.actor_name && (
              <p className="mb-1 text-xs font-semibold text-white/45">{event.actor_name}</p>
            )}

            {/* 요약 */}
            <p className="line-clamp-2 text-[15px] leading-relaxed text-white/60 transition-colors duration-300 group-hover:text-white/85">
              {event.summary || config?.label}
            </p>

            {/* 하단 메트릭 */}
            {(event.coverage_count > 1 || event.headline_days > 1) && (
              <div className="mt-2.5 flex items-center gap-4 text-[10px] text-white/15">
                {event.coverage_count > 1 && <span>{event.coverage_count}개 매체</span>}
                {event.headline_days > 1 && <span>{event.headline_days}일째</span>}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── 사이드 피드 (진영별 요약) ──

function SideFeed({ camp, events }: { camp: "blue" | "red"; events: IssueEvent[] }) {
  const colors = CAMP_COLORS[camp];

  return (
    <div>
      <div className="mb-5 flex items-center gap-2.5">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: colors.primary }}
        />
        <span className="text-sm font-semibold text-white/50">{colors.label}</span>
        <div
          className="h-px flex-1"
          style={{ background: `linear-gradient(to right, ${colors.primary}20, transparent)` }}
        />
      </div>

      <div className="space-y-0.5">
        {events.map((event, i) => {
          const config = CATEGORY_MAP[event.category];
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.03, ease: EASE }}
            >
              <Link
                href={`/issues/${event.representative_issue_id}`}
                className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors duration-200 hover:bg-white/[0.03]"
              >
                <span className="mt-1 text-[11px] font-bold tabular-nums text-white/15">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] leading-snug text-white/50 transition-colors duration-200 group-hover:text-white/75">
                    {event.actor_name && (
                      <span className="font-medium text-white/60">{event.actor_name} </span>
                    )}
                    {event.summary || config?.label}
                  </p>
                  <span className="mt-1 block text-[10px] text-white/15">{formatRelative(getRefDate(event))}</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {events.length === 0 && (
        <p className="py-8 text-center text-[11px] text-white/15">수집된 이슈 없음</p>
      )}
    </div>
  );
}

// ── 메인 ──

export function HomePage({ events }: HomePageProps) {
  const [view, setView] = useState<ScoreView>("recent");
  const score = calculateEventScores(events, view);

  const sorted = [...events].sort(
    (a, b) => new Date(getRefDate(b)).getTime() - new Date(getRefDate(a)).getTime()
  );

  // 메인 피드: 최신 10건
  const mainFeed = sorted.slice(0, 10);
  // 사이드: 진영별 최신 6건
  const blueSide = sorted.filter((e) => e.camp === "blue").slice(0, 6);
  const redSide = sorted.filter((e) => e.camp === "red").slice(0, 6);

  return (
    <>
      <Nav />
      <main>
        <SplitScreen score={score} view={view} onViewChange={setView} />

        {/* ── 뉴스 피드 ── */}
        <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
          {/* 섹션 헤더 */}
          <motion.div
            className="mb-12 flex items-end justify-between"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div>
              <span className="mb-2 inline-block rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/25 uppercase">
                이슈 피드
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white/90">최신 이슈</h2>
            </div>
            <Link
              href="/issues"
              className="text-sm text-white/30 transition-colors hover:text-white/55"
            >
              전체 보기 &rarr;
            </Link>
          </motion.div>

          {/* 2열: 메인 피드(좌) + 사이드(우) */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/* 메인 피드 — 8칸 */}
            <div className="lg:col-span-8">
              {mainFeed.map((event, i) => (
                <FeedCard key={event.id} event={event} index={i} />
              ))}

              {mainFeed.length === 0 && (
                <div className="py-20 text-center text-sm text-white/20">
                  수집된 이슈가 없습니다
                </div>
              )}
            </div>

            {/* 사이드바 — 4칸 */}
            <aside className="lg:col-span-4">
              <div className="sticky top-20 space-y-10">
                <SideFeed camp="blue" events={blueSide} />
                <SideFeed camp="red" events={redSide} />

                {/* 하단 링크 */}
                <div className="space-y-2 pt-4 border-t border-white/[0.04]">
                  <Link href="/board" className="block text-sm text-white/30 transition-colors hover:text-white/55">
                    게시판 &rarr;
                  </Link>
                  <Link href="/report" className="block text-sm text-white/30 transition-colors hover:text-white/55">
                    누락 기록 제보 &rarr;
                  </Link>
                  <Link href="/politicians" className="block text-sm text-white/30 transition-colors hover:text-white/55">
                    정치인 &rarr;
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <footer className="border-t border-white/[0.04] py-16 text-center">
          <p className="text-xs tracking-widest text-white/20">민낯 — 사회·제도의 반응을 측정합니다</p>
          <p className="mt-2 text-[11px] text-white/10">모든 점수의 근거는 투명하게 공개됩니다</p>
        </footer>
      </main>
    </>
  );
}
