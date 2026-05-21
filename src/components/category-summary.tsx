"use client";

import type { Camp, Issue } from "@/types";
import { CATEGORIES, CAMP_COLORS } from "@/lib/constants";
import { calculateIssueScore, type ScoreView } from "@/lib/score";

interface CategorySummaryProps {
  camp: Camp;
  issues: Issue[];
  view?: ScoreView;
}

export function CategorySummary({ camp, issues, view = "recent" }: CategorySummaryProps) {
  const colors = CAMP_COLORS[camp];

  const summary = CATEGORIES
    .filter((c) => c.isScored)
    .map((cat) => {
      const catIssues = issues.filter((i) => i.category === cat.key);
      const totalScore = catIssues.reduce((sum, i) => sum + calculateIssueScore(i, view), 0);
      return { ...cat, count: catIssues.length, totalScore: Math.round(totalScore * 10) / 10 };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.totalScore - a.totalScore);

  if (summary.length === 0) return null;

  // 최대 점수 (바 비율 계산용)
  const maxScore = Math.max(...summary.map((s) => Math.abs(s.totalScore)), 1);

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3
          className="text-sm font-semibold tracking-wide"
          style={{ color: colors.glow }}
        >
          {colors.label}
        </h3>
        <span className="text-xs tabular-nums text-white/25">
          {issues.length}건
        </span>
      </div>
      <div className="space-y-2">
        {summary.map((cat) => {
          const barWidth = Math.max(4, (Math.abs(cat.totalScore) / maxScore) * 100);
          return (
            <div key={cat.key}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-white/60">{cat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-white/30">
                    {cat.count}건
                  </span>
                  <span
                    className="min-w-[3.5rem] text-right font-mono text-xs tabular-nums font-medium"
                    style={{ color: cat.isPositive ? "#22c55e" : colors.glow }}
                  >
                    {cat.isPositive ? "+" : ""}{cat.totalScore}
                  </span>
                </div>
              </div>
              {/* 점수 바 */}
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: cat.isPositive ? "#22c55e40" : `${colors.primary}60`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
