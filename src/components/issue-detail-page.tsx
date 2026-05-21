"use client";

import Link from "next/link";
import { Nav } from "./nav";
import type { Issue } from "@/types";
import {
  CATEGORY_MAP,
  CAMP_COLORS,
  SEVERITY_LABEL,
  IMPACT_LABEL,
  SOURCE_TIER_LABEL,
  SEVERITY_MULTIPLIER,
  IMPACT_MULTIPLIER,
} from "@/lib/constants";
import { calculateIssueScore } from "@/lib/score";

interface IssueDetailPageProps {
  issue: Issue;
}

export function IssueDetailPage({ issue }: IssueDetailPageProps) {
  const config = CATEGORY_MAP[issue.category];
  const colors = CAMP_COLORS[issue.camp];
  const score = calculateIssueScore(issue);
  const isControversial = issue.category === "controversial";

  const publishedDate = new Date(issue.published_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const daysSince = Math.max(
    0,
    (Date.now() - new Date(issue.published_at).getTime()) / 86400000
  );

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pt-24 pb-20">
        {/* 뒤로가기 */}
        <Link
          href="/issues"
          className="mb-6 inline-block text-sm text-white/40 transition-colors hover:text-white/60"
        >
          &larr; 이슈 목록
        </Link>

        {/* 메타 정보 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
          <span className="text-sm font-medium" style={{ color: colors.glow }}>
            {colors.label}
          </span>
          <span className="text-sm text-white/50">{config?.label}</span>
          {!isControversial && (
            <span className="text-sm text-white/30">
              {SEVERITY_LABEL[issue.severity]}
            </span>
          )}
          <span className="text-sm text-white/25">{publishedDate}</span>
        </div>

        {/* 제목 */}
        <h1 className="mb-4 text-3xl font-bold leading-tight">{issue.title}</h1>

        {/* 요약 */}
        <p className="mb-8 text-base leading-relaxed text-white/60">
          {issue.summary}
        </p>

        {/* 출처 */}
        <div className="mb-8 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <h2 className="mb-3 text-sm font-semibold text-white/50">출처</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">{issue.source_name}</p>
              <p className="text-xs text-white/30">
                {SOURCE_TIER_LABEL[issue.source_tier]} (Tier {issue.source_tier})
              </p>
            </div>
            <a
              href={issue.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/10 px-4 py-1.5 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/70"
            >
              원문 보기
            </a>
          </div>
        </div>

        {/* 점수 산출 근거 */}
        {!isControversial && (
          <div className="mb-8 rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="mb-4 text-sm font-semibold text-white/50">
              점수 산출 근거
            </h2>

            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums" style={{ color: config?.isPositive ? "#22c55e" : colors.glow }}>
                {config?.isPositive ? "+" : ""}{score}
              </span>
              <span className="text-sm text-white/30">점</span>
            </div>

            <div className="space-y-2 text-sm">
              <p className="mb-3 text-xs text-white/25">
                가중 합 방식: 0.4×카테고리 + 0.3×심각도 + 0.2×범위 + 0.1×시간 → 시그모이드(0~100)
              </p>
              <div className="flex justify-between">
                <span className="text-white/40">카테고리 ({config?.label})</span>
                <span className="tabular-nums text-white/60">가중치 {config?.baseWeight}/10 (×0.4)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">심각도 ({SEVERITY_LABEL[issue.severity]})</span>
                <span className="tabular-nums text-white/60">×{SEVERITY_MULTIPLIER[issue.severity]} (×0.3)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">영향 범위 ({IMPACT_LABEL[issue.impact_scope]})</span>
                <span className="tabular-nums text-white/60">×{IMPACT_MULTIPLIER[issue.impact_scope]} (×0.2)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">경과 시간</span>
                <span className="tabular-nums text-white/60">{Math.round(daysSince)}일 전 (×0.1)</span>
              </div>
              <div className="mt-3 border-t border-white/5 pt-3">
                <div className="flex justify-between font-medium">
                  <span className="text-white/60">최종 점수</span>
                  <span className="tabular-nums text-white/80">{score} / 100</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isControversial && (
          <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h2 className="mb-2 text-sm font-semibold text-amber-400/80">
              논란 정책 — 점수 미반영
            </h2>
            <p className="text-sm leading-relaxed text-white/50">
              이 이슈는 가치 판단이 갈리는 정책으로, 스코어보드 점수에 반영되지 않습니다.
              정책 내용과 객관적 수치만 제공합니다.
            </p>
          </div>
        )}

        {/* AI 분석 */}
        {issue.ai_analysis && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="mb-4 text-sm font-semibold text-white/50">
              AI 분석 근거
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-white/30">신뢰도</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-green-500/60"
                      style={{ width: `${issue.ai_analysis.confidence * 100}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-white/50">
                    {Math.round(issue.ai_analysis.confidence * 100)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="mb-1 text-white/30">분석 근거</p>
                <p className="text-white/60">{issue.ai_analysis.reasoning}</p>
              </div>
              <div>
                <p className="mb-1 text-white/30">카테고리 판단 이유</p>
                <p className="text-white/60">{issue.ai_analysis.category_rationale}</p>
              </div>
              <div>
                <p className="mb-1 text-white/30">심각도 판단 이유</p>
                <p className="text-white/60">{issue.ai_analysis.severity_rationale}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
