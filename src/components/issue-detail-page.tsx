"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Nav } from "./nav";
import type { Issue, IssueEvent } from "@/types";
import { CATEGORY_MAP, CAMP_COLORS, SOURCE_TIER_LABEL, CRIMINAL_STAGE_LABEL, CRIMINAL_STAGE_WEIGHT } from "@/lib/constants";
import { calculateIssueScore, calculateEventScore } from "@/lib/score";

interface IssueDetailPageProps {
  issue: Issue;
  event?: IssueEvent | null;
}

const EASE = [0.32, 0.72, 0, 1] as const;

export function IssueDetailPage({ issue, event }: IssueDetailPageProps) {
  const config = CATEGORY_MAP[issue.category];
  const colors = CAMP_COLORS[issue.camp];
  const isArchive = config?.isArchive ?? false;
  const isScored = config?.isScored ?? false;

  const score = event ? calculateEventScore(event) : calculateIssueScore(issue);
  const coverageCount = event?.coverage_count ?? issue.coverage_count;
  const headlineDays = event?.headline_days ?? issue.headline_days;
  const posWeight = event?.position_weight ?? issue.position_weight;
  const criminalStage = event?.criminal_stage ?? issue.criminal_stage;
  const crossSources = event?.cross_verified_sources ?? issue.cross_verified_sources;

  const publishedDate = new Date(issue.published_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Nav />

      {/* ── 상단 사건 개요 ── */}
      <section
        className="relative overflow-hidden border-b border-white/5"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${colors.primary}08, transparent 70%), #0a0a0c`,
        }}
      >
        {/* 그라데이션 바 — 진영 표시 */}
        <div
          className="absolute top-0 left-0 h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.primary}40, transparent)`,
          }}
        />

        <div className="mx-auto w-full max-w-5xl px-6 pt-24 pb-16 md:px-8">
          {/* 뒤로가기 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <Link
              href="/issues"
              className="mb-8 inline-flex items-center gap-2 text-sm text-white/75 transition-colors duration-300 hover:text-white"
            >
              <span>&larr;</span>
              <span>타임라인</span>
            </Link>
          </motion.div>

          {/* Eyebrow 뱃지들 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="mb-5 flex flex-wrap items-center gap-2.5"
          >
            <span
              className="rounded-full px-3 py-1 text-[10px] font-medium tracking-[0.15em] uppercase"
              style={{
                backgroundColor: `${colors.primary}15`,
                color: colors.glow,
              }}
            >
              {colors.label}
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.1em] text-white/75 uppercase">
              {config?.label}
            </span>
            {criminalStage && (
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-medium text-red-400/60">
                {CRIMINAL_STAGE_LABEL[criminalStage]}
              </span>
            )}
            {isArchive && (
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] text-amber-400/50">
                기록
              </span>
            )}
            {event && event.issue_count > 1 && (
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] text-blue-400/50">
                {event.issue_count}개 보도 종합
              </span>
            )}
          </motion.div>

          {/* 제목 — 대형 타이포 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
            className="mb-6 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white/95 sm:text-4xl md:text-5xl"
          >
            {issue.title}
          </motion.h1>

          {/* 메타 라인 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
            className="mb-8 flex flex-wrap items-center gap-4 text-sm text-white/75"
          >
            {issue.actor_name && (
              <span className="text-white/75">{issue.actor_name}</span>
            )}
            <span>{publishedDate}</span>
            <span>{SOURCE_TIER_LABEL[issue.source_tier]}</span>
            {coverageCount > 1 && <span>{coverageCount}개 매체 보도</span>}
          </motion.div>

          {/* 점수 — 대형 (scored일 때만) */}
          {isScored && score > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
              className="flex items-end gap-3"
            >
              <span
                className="font-mono text-6xl font-bold tabular-nums leading-none md:text-7xl"
                style={{
                  color: colors.glow,
                  textShadow: `0 0 40px ${colors.primary}50`,
                }}
              >
                {score.toFixed(1)}
              </span>
              <span className="mb-2 text-lg text-white/75">/100</span>
            </motion.div>
          )}

        </div>
      </section>

      {/* ── 본문 콘텐츠 ── */}
      <main className="mx-auto max-w-5xl px-6 py-24 md:px-8">
        {/* 2열 레이아웃: 좌=본문, 우=메타 */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_340px]">

          {/* 좌측: 본문 */}
          <div className="space-y-10">
            {/* 요약 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <p className="text-lg leading-relaxed text-white/75 md:text-xl md:leading-relaxed">
                {issue.summary}
              </p>
            </motion.div>

            {/* 사건 맥락 — 관련 보도 */}
            {event && event.member_issues && event.member_issues.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                {/* Doppelrand shell */}
                <div className="rounded-[1.5rem] bg-white/[0.02] p-[1px] ring-1 ring-white/5">
                  <div className="rounded-[calc(1.5rem-1px)] bg-[#0c0c10] p-6 md:p-8">
                    <div className="mb-6 flex items-center gap-3">
                      <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/75 uppercase">
                        사건 맥락
                      </span>
                      <span className="text-xs text-white/75">
                        {event.issue_count}개 보도 · {event.headline_days}일간 지속
                      </span>
                    </div>

                    {/* 타임라인 */}
                    <div className="mb-6 flex items-center gap-2 text-[11px] text-white/75">
                      <span>{new Date(event.first_reported_at).toLocaleDateString("ko-KR")}</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-white/10 via-white/5 to-white/10" />
                      <span>{new Date(event.last_reported_at).toLocaleDateString("ko-KR")}</span>
                    </div>

                    {/* 보도 목록 */}
                    <div className="space-y-2">
                      {event.member_issues.map((mi) => {
                        const isCurrent = mi.id === issue.id;
                        return (
                          <div
                            key={mi.id}
                            className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 transition-colors ${
                              isCurrent
                                ? "bg-white/[0.05] ring-1 ring-white/10"
                                : "hover:bg-white/[0.02]"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              {isCurrent ? (
                                <p className="text-sm text-white">
                                  {mi.title}
                                  <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/75">
                                    현재
                                  </span>
                                </p>
                              ) : (
                                <Link
                                  href={`/issues/${mi.id}`}
                                  className="block text-sm text-white/75 transition-colors duration-300 hover:text-white"
                                >
                                  {mi.title}
                                </Link>
                              )}
                              <p className="mt-1 text-[11px] text-white/75">
                                {mi.source_name} · {new Date(mi.published_at).toLocaleDateString("ko-KR")}
                              </p>
                            </div>
                            {!isCurrent && mi.source_url && (
                              <a
                                href={mi.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 rounded-full border border-white/5 px-3 py-1 text-[10px] text-white/75 transition-colors duration-300 hover:border-white/15 hover:text-white"
                              >
                                원문
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI 분석 */}
            {issue.ai_analysis && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <div className="rounded-[1.5rem] bg-white/[0.02] p-[1px] ring-1 ring-white/5">
                  <div className="rounded-[calc(1.5rem-1px)] bg-[#0c0c10] p-6 md:p-8">
                    <span className="mb-6 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/75 uppercase">
                      AI 분석
                    </span>

                    {/* 신뢰도 바 */}
                    <div className="mb-6">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-white/75">분류 신뢰도</span>
                        <span className="font-mono text-sm tabular-nums text-white/75">
                          {Math.round(issue.ai_analysis.confidence * 100)}%
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${issue.ai_analysis.confidence * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3, ease: EASE }}
                          className="h-full rounded-full bg-green-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-5 text-sm">
                      <div>
                        <p className="mb-1.5 text-[11px] font-medium tracking-wide text-white/75 uppercase">판단 근거</p>
                        <p className="leading-relaxed text-white/75">{issue.ai_analysis.reasoning}</p>
                      </div>
                      <div>
                        <p className="mb-1.5 text-[11px] font-medium tracking-wide text-white/75 uppercase">진영 판단</p>
                        <p className="leading-relaxed text-white/75">{issue.ai_analysis.camp_reasoning}</p>
                      </div>
                      {issue.ai_analysis.evidence_sentence && (
                        <div>
                          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-white/75 uppercase">근거 문장</p>
                          <p className="border-l-2 border-white/10 pl-4 leading-relaxed text-white/75 italic">
                            &ldquo;{issue.ai_analysis.evidence_sentence}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* 우측 사이드바: 메타 정보 (데스크탑) */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* 점수 근거 */}
            {isScored && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <div className="rounded-[1.25rem] bg-white/[0.02] p-[1px] ring-1 ring-white/5">
                  <div className="rounded-[calc(1.25rem-1px)] bg-[#0c0c10] p-5">
                    <span className="mb-4 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/75 uppercase">
                      점수 근거
                    </span>

                    {event && event.issue_count > 1 && (
                      <p className="mb-4 text-[11px] text-blue-400/40">
                        {event.issue_count}개 보도 종합 사건 단위 산출
                      </p>
                    )}

                    <p className="mb-4 text-[10px] leading-relaxed text-white/75">
                      base = 보도량(×0.40) + 공식처리(×0.35) + 지속일수(×0.25)
                      <br />→ ×다양도 ×직책 ×시간감쇠
                    </p>

                    <div className="space-y-3 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-white/75">보도 매체</span>
                        <span className="font-mono tabular-nums text-white/75">{coverageCount}개</span>
                      </div>
                      {criminalStage && (
                        <div className="flex justify-between">
                          <span className="text-white/75">형사 단계</span>
                          <span className="font-mono tabular-nums text-white/75">
                            {CRIMINAL_STAGE_LABEL[criminalStage]} ({CRIMINAL_STAGE_WEIGHT[criminalStage]}/10)
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-white/75">지속일수</span>
                        <span className="font-mono tabular-nums text-white/75">{headlineDays}일</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/75">직책 가중치</span>
                        <span className="font-mono tabular-nums text-white/75">×{posWeight}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Archive 안내 */}
            {isArchive && (
              <div className="rounded-[1.25rem] bg-amber-500/[0.03] p-[1px] ring-1 ring-amber-500/15">
                <div className="rounded-[calc(1.25rem-1px)] bg-[#0c0c10] p-5">
                  <span className="mb-3 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-medium text-amber-400/60">
                    기록 — 점수 없음
                  </span>
                  <p className="text-sm leading-relaxed text-white/75">
                    공식 처분이 아닌 기록입니다. 원문과 맥락을 보존하며, 판단은 사용자의 몫입니다.
                  </p>
                </div>
              </div>
            )}

            {/* 출처 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <div className="rounded-[1.25rem] bg-white/[0.02] p-[1px] ring-1 ring-white/5">
                <div className="rounded-[calc(1.25rem-1px)] bg-[#0c0c10] p-5">
                  <span className="mb-4 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/75 uppercase">
                    출처
                  </span>

                  <p className="mb-1 text-sm text-white/75">{issue.source_name}</p>
                  <p className="mb-4 text-[11px] text-white/75">
                    {SOURCE_TIER_LABEL[issue.source_tier]} (Tier {issue.source_tier})
                  </p>

                  <a
                    href={issue.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/8 px-4 py-2.5 text-xs text-white/75 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/20 hover:text-white"
                  >
                    원문 보기
                    <span className="text-[10px]">&nearr;</span>
                  </a>

                  {/* 교차검증 */}
                  {crossSources.length > 0 && (
                    <div className="mt-4 border-t border-white/5 pt-4">
                      <p className="mb-2 text-[10px] text-white/75">교차검증 매체</p>
                      <div className="flex flex-wrap gap-1.5">
                        {crossSources.map((s, i) => (
                          <span
                            key={i}
                            className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/75"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* 본인 입장 */}
            <div className="rounded-[1.25rem] bg-white/[0.02] p-[1px] ring-1 ring-white/5">
              <div className="rounded-[calc(1.25rem-1px)] bg-[#0c0c10] p-5">
                <span className="mb-3 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/75 uppercase">
                  본인 입장
                </span>
                <p className="text-xs text-white/75">확인되지 않음</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
