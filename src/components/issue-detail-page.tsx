"use client";

import Link from "next/link";
import { Nav } from "./nav";
import type { Issue, IssueEvent } from "@/types";
import { CATEGORY_MAP, CAMP_COLORS, SOURCE_TIER_LABEL, CRIMINAL_STAGE_LABEL, CRIMINAL_STAGE_WEIGHT } from "@/lib/constants";
import { calculateIssueScore, calculateEventScore } from "@/lib/score";

interface IssueDetailPageProps {
  issue: Issue;
  event?: IssueEvent | null;
}

export function IssueDetailPage({ issue, event }: IssueDetailPageProps) {
  const config = CATEGORY_MAP[issue.category];
  const colors = CAMP_COLORS[issue.camp];
  const isArchive = config?.isArchive ?? false;
  const isScored = config?.isScored ?? false;

  // event가 있으면 event 레벨 점수, 없으면 issue 레벨
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
          {criminalStage && (
            <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs text-red-400/60">
              {CRIMINAL_STAGE_LABEL[criminalStage]}
            </span>
          )}
          {isArchive && (
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/25">기록</span>
          )}
          {event && event.issue_count > 1 && (
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400/50">
              {event.issue_count}개 보도
            </span>
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
                {coverageCount > 1 && ` · ${coverageCount}개 매체 보도`}
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
          {crossSources.length > 0 && (
            <div className="mt-3 border-t border-white/5 pt-3">
              <p className="mb-2 text-xs text-white/30">교차검증 매체</p>
              <div className="flex flex-wrap gap-2">
                {crossSources.map((s, i) => (
                  <span key={i} className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/40">
                    {s.name} ({s.lean})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 사건 맥락 (Event Context) */}
        {event && event.member_issues && event.member_issues.length > 1 && (
          <div className="mb-8 rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="mb-4 text-sm font-semibold text-white/50">
              사건 맥락 — {event.issue_count}개 보도 종합
            </h2>

            {/* 타임라인 */}
            <div className="mb-4 flex items-center gap-3 text-xs text-white/30">
              <span>
                최초 보도: {new Date(event.first_reported_at).toLocaleDateString("ko-KR")}
              </span>
              <span className="text-white/10">→</span>
              <span>
                최신 보도: {new Date(event.last_reported_at).toLocaleDateString("ko-KR")}
              </span>
              <span className="text-white/10">|</span>
              <span>{event.headline_days}일간 지속</span>
            </div>

            {/* 관련 보도 목록 */}
            <div className="space-y-2">
              {event.member_issues.map((mi) => (
                <div
                  key={mi.id}
                  className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                    mi.id === issue.id ? "bg-white/[0.04] border border-white/10" : "bg-white/[0.01]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {mi.id === issue.id ? (
                      <p className="truncate text-white/70">
                        {mi.title}
                        <span className="ml-2 text-[10px] text-white/30">현재 보기</span>
                      </p>
                    ) : (
                      <Link
                        href={`/issues/${mi.id}`}
                        className="block truncate text-white/50 transition-colors hover:text-white/70"
                      >
                        {mi.title}
                      </Link>
                    )}
                    <p className="mt-0.5 text-xs text-white/25">
                      {mi.source_name} · {SOURCE_TIER_LABEL[mi.source_tier]} · {new Date(mi.published_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  {mi.source_url && mi.id !== issue.id && (
                    <a
                      href={mi.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[10px] text-white/20 hover:text-white/40"
                    >
                      원문
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

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

            {event && event.issue_count > 1 && (
              <p className="mb-3 text-xs text-blue-400/40">
                이 점수는 {event.issue_count}개 보도를 종합한 사건 단위로 산출됩니다.
              </p>
            )}

            <p className="mb-3 text-xs text-white/25">
              base = 보도량(×0.40) + 공식처리(×0.35) + 지속일수(×0.25) → ×다양도 ×직책 ×시간감쇠
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/40">보도 매체 수</span>
                <span className="tabular-nums text-white/60">{coverageCount}개 (×0.40)</span>
              </div>
              {criminalStage && (
                <div className="flex justify-between">
                  <span className="text-white/40">형사 단계 ({CRIMINAL_STAGE_LABEL[criminalStage]})</span>
                  <span className="tabular-nums text-white/60">{CRIMINAL_STAGE_WEIGHT[criminalStage]}/10 (×0.35)</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/40">헤드라인 지속</span>
                <span className="tabular-nums text-white/60">{headlineDays}일 (×0.25)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">직책 가중치</span>
                <span className="tabular-nums text-white/60">×{posWeight}</span>
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
