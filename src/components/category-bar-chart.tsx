"use client";

import type { Issue } from "@/types";
import { SCORED_CATEGORIES, CAMP_COLORS } from "@/lib/constants";
import { calculateIssueScore, type ScoreView } from "@/lib/score";

interface CategoryBarChartProps {
  issues: Issue[];
  view: ScoreView;
}

export function CategoryBarChart({ issues, view }: CategoryBarChartProps) {
  const categories = SCORED_CATEGORIES.map((cat) => {
    const blueIssues = issues.filter((i) => i.camp === "blue" && i.category === cat.key);
    const redIssues = issues.filter((i) => i.camp === "red" && i.category === cat.key);
    const blueScore = blueIssues.reduce((s, i) => s + calculateIssueScore(i, view), 0);
    const redScore = redIssues.reduce((s, i) => s + calculateIssueScore(i, view), 0);
    return {
      ...cat,
      blueCount: blueIssues.length,
      redCount: redIssues.length,
      blueScore: Math.round(blueScore * 10) / 10,
      redScore: Math.round(redScore * 10) / 10,
    };
  }).filter((c) => c.blueCount + c.redCount > 0);

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 py-12 text-center text-white/25">
        비교할 공식 처분 이슈가 없습니다.
      </div>
    );
  }

  const maxScore = Math.max(...categories.flatMap((c) => [c.blueScore, c.redScore]), 1);

  return (
    <div className="space-y-8">
      {categories.map((cat) => {
        const bluePct = Math.max(3, (cat.blueScore / maxScore) * 100);
        const redPct = Math.max(3, (cat.redScore / maxScore) * 100);

        return (
          <div key={cat.key}>
            {/* 라벨 */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-white/70">{cat.label}</span>
              <span className="text-xs text-white/25">
                파랑 {cat.blueCount}건 · 빨강 {cat.redCount}건
              </span>
            </div>

            {/* 파랑 바 */}
            <div className="mb-1.5 flex items-center gap-3">
              <span className="w-16 text-right text-xs tabular-nums" style={{ color: CAMP_COLORS.blue.glow }}>
                {cat.blueScore}
              </span>
              <div className="flex-1">
                <div className="h-7 overflow-hidden rounded-md bg-white/[0.03]">
                  <div
                    className="h-full rounded-md transition-all duration-700"
                    style={{
                      width: `${bluePct}%`,
                      background: `linear-gradient(to right, ${CAMP_COLORS.blue.primary}90, ${CAMP_COLORS.blue.primary}50)`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 빨강 바 */}
            <div className="flex items-center gap-3">
              <span className="w-16 text-right text-xs tabular-nums" style={{ color: CAMP_COLORS.red.glow }}>
                {cat.redScore}
              </span>
              <div className="flex-1">
                <div className="h-7 overflow-hidden rounded-md bg-white/[0.03]">
                  <div
                    className="h-full rounded-md transition-all duration-700"
                    style={{
                      width: `${redPct}%`,
                      background: `linear-gradient(to right, ${CAMP_COLORS.red.primary}90, ${CAMP_COLORS.red.primary}50)`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 범례 */}
      <div className="flex justify-center gap-8 pt-2 text-xs text-white/30">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: CAMP_COLORS.blue.primary }} />
          {CAMP_COLORS.blue.label}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: CAMP_COLORS.red.primary }} />
          {CAMP_COLORS.red.label}
        </div>
      </div>
    </div>
  );
}
