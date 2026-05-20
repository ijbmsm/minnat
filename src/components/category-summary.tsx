"use client";

import type { Camp, Issue, IssueCategory } from "@/types";
import { CATEGORIES, CAMP_COLORS, CATEGORY_MAP } from "@/lib/constants";
import { calculateIssueScore } from "@/lib/score";

interface CategorySummaryProps {
  camp: Camp;
  issues: Issue[];
}

export function CategorySummary({ camp, issues }: CategorySummaryProps) {
  const colors = CAMP_COLORS[camp];

  // 카테고리별 집계 (점수 반영 대상만)
  const summary = CATEGORIES
    .filter((c) => c.isScored)
    .map((cat) => {
      const catIssues = issues.filter((i) => i.category === cat.key);
      const totalScore = catIssues.reduce((sum, i) => sum + calculateIssueScore(i), 0);
      return { ...cat, count: catIssues.length, totalScore: Math.round(totalScore * 10) / 10 };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.totalScore - a.totalScore);

  if (summary.length === 0) return null;

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      <h3
        className="mb-4 text-sm font-semibold tracking-wide"
        style={{ color: colors.glow }}
      >
        {colors.label}
      </h3>
      <div className="space-y-2.5">
        {summary.map((cat) => (
          <div
            key={cat.key}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-white/70">
              {cat.label}
            </span>
            <div className="flex items-center gap-3">
              <span className="tabular-nums text-white/40">
                {cat.count}건
              </span>
              <span
                className="min-w-[3rem] text-right font-mono text-xs tabular-nums"
                style={{ color: cat.isPositive ? "#22c55e" : colors.glow }}
              >
                {cat.isPositive ? "+" : ""}{cat.totalScore}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
