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

export function IssueCard({ issue, index }: IssueCardProps) {
  const config = CATEGORY_MAP[issue.category];
  const colors = CAMP_COLORS[issue.camp];
  const score = calculateIssueScore(issue);
  const isPositive = config?.isPositive ?? false;
  const isControversial = issue.category === "controversial";

  const publishedDate = new Date(issue.published_at).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link
        href={`/issues/${issue.id}`}
        className="group block rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
      >
        <div className="mb-3 flex items-center gap-3">
          {/* 진영 도트 */}
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: colors.primary }}
          />

          {/* 카테고리 */}
          <span className="text-xs font-medium text-white/50">
            {config?.label ?? issue.category}
          </span>

          {/* 심각도 */}
          {!isControversial && (
            <span className="text-xs text-white/30">
              {SEVERITY_LABEL[issue.severity]}
            </span>
          )}

          {/* 소스 티어 */}
          <span className="text-xs text-white/20">
            {SOURCE_TIER_LABEL[issue.source_tier]}
          </span>

          <span className="ml-auto text-xs tabular-nums text-white/25">
            {publishedDate}
          </span>
        </div>

        <h3 className="mb-2 text-base font-medium leading-snug text-white/85 transition-colors group-hover:text-white">
          {issue.title}
        </h3>

        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-white/40">
          {issue.summary}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">
            {issue.source_name}
          </span>

          {isControversial ? (
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-white/40">
              점수 미반영
            </span>
          ) : (
            <span
              className="font-mono text-sm font-semibold tabular-nums"
              style={{ color: isPositive ? "#22c55e" : colors.glow }}
            >
              {isPositive ? "+" : ""}{score}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
