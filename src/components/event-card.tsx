"use client";

import Link from "next/link";
import type { IssueEvent } from "@/types";
import { CATEGORY_MAP, CAMP_COLORS, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import { calculateEventScore } from "@/lib/score";

interface EventCardProps {
  event: IssueEvent;
  size: "large" | "medium" | "small";
}

/**
 * 3단계 크기의 Event 카드
 *
 * large:  점수 > 15 — 풀사이즈, 제목+요약+점수+커버리지+형사단계
 * medium: 점수 > 0 또는 verified — 제목+카테고리+점수+커버리지
 * small:  archive/미검증 — 한 줄, 제목+카테고리만
 */
export function EventCard({ event, size }: EventCardProps) {
  const config = CATEGORY_MAP[event.category];
  const colors = CAMP_COLORS[event.camp];
  const score = calculateEventScore(event);
  const isScored = config?.isScored ?? false;

  if (size === "large") {
    return (
      <Link
        href={`/issues/${event.representative_issue_id}`}
        className="group block rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-all hover:border-white/15 hover:bg-white/[0.05]"
      >
        {/* 상단 메타 */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.primary }} />
          <span className="text-xs font-medium" style={{ color: colors.glow }}>
            {config?.label}
          </span>
          {event.criminal_stage && (
            <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] text-red-400/60">
              {CRIMINAL_STAGE_LABEL[event.criminal_stage]}
            </span>
          )}
          {event.issue_count > 1 && (
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-400/50">
              {event.issue_count}개 보도
            </span>
          )}
          {event.verified && (
            <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-[11px] text-green-400/50">
              검증됨
            </span>
          )}
        </div>

        {/* 제목 */}
        <h3 className="mb-2 text-lg font-semibold leading-snug text-white/90 transition-colors group-hover:text-white">
          {event.actor_name && (
            <span className="mr-1.5 text-white/40">{event.actor_name}</span>
          )}
          {event.summary || "사건 요약 없음"}
        </h3>

        {/* 하단: 메트릭 + 점수 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-white/30">
            <span>{event.coverage_count}개 매체</span>
            {event.headline_days > 1 && <span>{event.headline_days}일간 지속</span>}
          </div>
          {isScored && score > 0 && (
            <div className="flex items-center gap-1.5">
              <span
                className="font-mono text-lg font-bold tabular-nums"
                style={{ color: colors.glow }}
              >
                {score.toFixed(1)}
              </span>
              <span className="text-[10px] text-white/20">/100</span>
            </div>
          )}
        </div>
      </Link>
    );
  }

  if (size === "medium") {
    return (
      <Link
        href={`/issues/${event.representative_issue_id}`}
        className="group block rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.04]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.primary }} />
              <span className="text-[11px] text-white/40">{config?.label}</span>
              {event.criminal_stage && (
                <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400/50">
                  {CRIMINAL_STAGE_LABEL[event.criminal_stage]}
                </span>
              )}
              {event.issue_count > 1 && (
                <span className="text-[10px] text-white/20">{event.issue_count}개 보도</span>
              )}
            </div>
            <p className="line-clamp-2 text-sm leading-snug text-white/75 transition-colors group-hover:text-white/90">
              {event.actor_name && (
                <span className="text-white/35">{event.actor_name} — </span>
              )}
              {event.summary || "사건 요약 없음"}
            </p>
          </div>
          {isScored && score > 0 && (
            <span
              className="shrink-0 font-mono text-sm font-semibold tabular-nums"
              style={{ color: colors.glow }}
            >
              {score.toFixed(1)}
            </span>
          )}
        </div>
      </Link>
    );
  }

  // small — archive, 미검증
  return (
    <Link
      href={`/issues/${event.representative_issue_id}`}
      className="group flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.03]"
    >
      <div className="h-1.5 w-1.5 rounded-full bg-white/15" />
      <span className="flex-1 truncate text-[13px] text-white/40 transition-colors group-hover:text-white/60">
        {event.actor_name && (
          <span className="text-white/25">{event.actor_name} — </span>
        )}
        {event.summary || event.category}
      </span>
      <span className="shrink-0 text-[10px] text-white/15">{config?.label}</span>
    </Link>
  );
}

/**
 * Event의 점수/상태에 따라 카드 크기를 결정한다
 */
export function getEventCardSize(event: IssueEvent): "large" | "medium" | "small" {
  const config = CATEGORY_MAP[event.category];
  const isScored = config?.isScored ?? false;
  const score = calculateEventScore(event);

  if (isScored && score > 15) return "large";
  if (isScored && score > 0) return "medium";
  if (event.verified && isScored) return "medium";
  return "small";
}
