"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Issue } from "@/types";
import { CATEGORY_MAP, CAMP_COLORS, SOURCE_TIER_LABEL, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import { calculateIssueScore } from "@/lib/score";

interface IssueCardProps {
  issue: Issue;
  index: number;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  const years = Math.floor(months / 12);
  return `${years}년 전`;
}

export function IssueCard({ issue, index }: IssueCardProps) {
  const config = CATEGORY_MAP[issue.category];
  const colors = CAMP_COLORS[issue.camp];
  const score = calculateIssueScore(issue);
  const isArchive = config?.isArchive ?? false;
  const isScored = config?.isScored ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5) }}
    >
      <Link
        href={`/issues/${issue.id}`}
        className="group block rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
      >
        {/* 상단 메타 */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />
          <span className="text-xs font-medium text-white/75">
            {config?.label ?? issue.category}
          </span>

          {/* 형사 단계 */}
          {issue.criminal_stage && (
            <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400/60">
              {CRIMINAL_STAGE_LABEL[issue.criminal_stage]}
            </span>
          )}

          {/* archive/scored 뱃지 */}
          {isArchive && (
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/75">
              기록
            </span>
          )}

          {/* 신뢰도 */}
          {isScored && (
            issue.trust_level === "high" ? (
              <span className="rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400/50">
                검증됨
              </span>
            ) : issue.verified ? (
              <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400/50">
                교차검증
              </span>
            ) : (
              <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400/50">
                확정 전
              </span>
            )
          )}

          <span className="ml-auto text-[11px] text-white/75">
            {relativeTime(issue.published_at)}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="mb-2 text-[15px] font-medium leading-snug text-white transition-colors group-hover:text-white">
          {issue.title}
        </h3>

        {/* 요약 */}
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-white/75">
          {issue.summary}
        </p>

        {/* 하단 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/75">{issue.source_name}</span>
            <span className="text-[10px] text-white/75">
              {SOURCE_TIER_LABEL[issue.source_tier]}
            </span>
            {issue.coverage_count > 1 && (
              <span className="text-[10px] text-white/75">
                {issue.coverage_count}개 매체
              </span>
            )}
          </div>

          {isScored && score > 0 ? (
            <div className="flex items-center gap-1.5">
              <span
                className="font-mono text-sm font-semibold tabular-nums"
                style={{ color: colors.glow }}
              >
                {score.toFixed(1)}
              </span>
              <span className="text-[10px] text-white/75">/100</span>
            </div>
          ) : isArchive ? (
            <span className="text-[10px] text-white/75">점수 없음</span>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}
