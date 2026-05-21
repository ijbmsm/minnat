"use client";

import Link from "next/link";
import { Nav } from "./nav";
import type { Issue } from "@/types";
import { CATEGORY_MAP, CAMP_COLORS, SOURCE_TIER_LABEL, CRIMINAL_STAGE_LABEL, CRIMINAL_STAGE_WEIGHT } from "@/lib/constants";
import { calculateIssueScore } from "@/lib/score";

interface IssueDetailPageProps {
  issue: Issue;
}

export function IssueDetailPage({ issue }: IssueDetailPageProps) {
  const config = CATEGORY_MAP[issue.category];
  const colors = CAMP_COLORS[issue.camp];
  const score = calculateIssueScore(issue);
  const isArchive = config?.isArchive ?? false;
  const isScored = config?.isScored ?? false;

  const publishedDate = new Date(issue.published_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pt-24 pb-20">
        <Link
          href="/issues"
          className="mb-6 inline-block text-sm text-white/40 transition-colors hover:text-white/60"
        >
          &larr; 이슈 목록
        </Link>

        {/* 메타 정보 */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.primary }} />
          <span className="text-sm font-medium" style={{ color: colors.glow }}>{colors.label}</span>
          <span className="text-sm text-white/50">{config?.label}</span>
          {issue.criminal_stage && (
            <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs text-red-400/60">
              {CRIMINAL_STAGE_LABEL[issue.criminal_stage]}
            </span>
          )}
          {isArchive && (
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/25">기록</span>
          )}
          <span className="text-sm text-white/25">{publishedDate}</span>
        </div>

        <h1 className="mb-4 text-3xl font-bold leading-tight">{issue.title}</h1>
        <p className="mb-8 text-base leading-relaxed text-white/60">{issue.summary}</p>

        {/* 본인 입장 */}
        <div className="mb-8 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <p className="text-xs text-white/30">본인 입장 확인되지 않음</p>
        </div>

        {/* 출처 */}
        <div className="mb-8 rounded-xl border border-white/5 bg-white/[0.02] p-5">
          <h2 className="mb-3 text-sm font-semibold text-white/50">출처</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">{issue.source_name}</p>
              <p className="text-xs text-white/30">
                {SOURCE_TIER_LABEL[issue.source_tier]} (Tier {issue.source_tier})
                {issue.coverage_count > 1 && ` · ${issue.coverage_count}개 매체 보도`}
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
          {/* 교차검증 소스 */}
          {issue.cross_verified_sources.length > 0 && (
            <div className="mt-3 border-t border-white/5 pt-3">
              <p className="mb-2 text-xs text-white/30">교차검증 매체</p>
              <div className="flex flex-wrap gap-2">
                {issue.cross_verified_sources.map((s, i) => (
                  <span key={i} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/40">
                    {s.name} ({s.lean})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 점수 근거 (scored 카테고리만) */}
        {isScored && (
          <div className="mb-8 rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="mb-4 text-sm font-semibold text-white/50">점수 산출 근거</h2>

            <div className="mb-4 flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums" style={{ color: colors.glow }}>
                {score.toFixed(1)}
              </span>
              <span className="text-sm text-white/30">/100</span>
            </div>

            <p className="mb-3 text-xs text-white/25">
              base = 보도량(×0.40) + 공식처리(×0.35) + 지속일수(×0.25) → ×다양도 ×직책 ×시간감쇠
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">보도 매체 수</span>
                <span className="tabular-nums text-white/60">{issue.coverage_count}개 (×0.40)</span>
              </div>
              {issue.criminal_stage && (
                <div className="flex justify-between">
                  <span className="text-white/40">형사 단계 ({CRIMINAL_STAGE_LABEL[issue.criminal_stage]})</span>
                  <span className="tabular-nums text-white/60">{CRIMINAL_STAGE_WEIGHT[issue.criminal_stage]}/10 (×0.35)</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/40">헤드라인 지속</span>
                <span className="tabular-nums text-white/60">{issue.headline_days}일 (×0.25)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">직책 가중치</span>
                <span className="tabular-nums text-white/60">×{issue.position_weight}</span>
              </div>
            </div>
          </div>
        )}

        {/* Archive 안내 */}
        {isArchive && (
          <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h2 className="mb-2 text-sm font-semibold text-amber-400/80">기록 — 점수 없음</h2>
            <p className="text-sm leading-relaxed text-white/50">
              이 이슈는 공식 처분이 아닌 기록입니다. 점수가 부여되지 않으며, 원문과 맥락을 보존합니다.
              판단은 사용자의 몫입니다.
            </p>
          </div>
        )}

        {/* AI 분석 */}
        {issue.ai_analysis && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="mb-4 text-sm font-semibold text-white/50">AI 분석 근거</h2>
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
                <p className="mb-1 text-white/30">진영 판단 근거</p>
                <p className="text-white/60">{issue.ai_analysis.camp_reasoning}</p>
              </div>
              {issue.ai_analysis.evidence_sentence && (
                <div>
                  <p className="mb-1 text-white/30">근거 문장</p>
                  <p className="text-white/60 italic">&ldquo;{issue.ai_analysis.evidence_sentence}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
