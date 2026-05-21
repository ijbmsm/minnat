"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Issue } from "@/types";
import { CATEGORY_MAP, CAMP_COLORS, SEVERITY_LABEL, SOURCE_TIER_LABEL } from "@/lib/constants";
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
  const isPositive = config?.isPositive ?? false;
  const isControversial = issue.category === "controversial";
  const verified = issue.verified;

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
          <span className="text-xs font-medium text-white/50">
            {config?.label ?? issue.category}
          </span>
          {!isControversial && (
            <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-white/30">
              {SEVERITY_LABEL[issue.severity]}
            </span>
          )}
          {verified ? (
            <span className="rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400/50">
              검증됨
            </span>
          ) : (
            <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400/50">
              미검증
            </span>
          )}
          <span className="ml-auto text-[11px] text-white/20">
            {relativeTime(issue.published_at)}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="mb-2 text-[15px] font-medium leading-snug text-white/85 transition-colors group-hover:text-white">
          {issue.title}
        </h3>

        {/* 요약 */}
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-white/35">
          {issue.summary}
        </p>

        {/* 하단 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/25">{issue.source_name}</span>
            <span className="text-[10px] text-white/15">
              Tier {issue.source_tier}
            </span>
          </div>

          {isControversial ? (
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] text-white/30">
              점수 미반영
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span
                className="font-mono text-sm font-semibold tabular-nums"
                style={{ color: isPositive ? "#22c55e" : colors.glow }}
              >
                {isPositive ? "+" : ""}{score.toFixed(1)}
              </span>
              <span className="text-[10px] text-white/15">/100</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
