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

  const maxScore = Math.max(...categories.map((c) => Math.max(c.blueScore, c.redScore)), 1);

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const blueWidth = Math.max(2, (cat.blueScore / maxScore) * 100);
        const redWidth = Math.max(2, (cat.redScore / maxScore) * 100);

        return (
          <div key={cat.key}>
            {/* 라벨 */}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-white/60">{cat.label}</span>
              <span className="text-xs text-white/25">
                파랑 {cat.blueCount}건 vs 빨강 {cat.redCount}건
              </span>
            </div>

            {/* 좌우 바 */}
            <div className="flex items-center gap-1">
              {/* 파랑 (좌 → 우) */}
              <div className="flex flex-1 justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-white/30">{cat.blueScore}</span>
                  <div
                    className="h-6 rounded-l-md transition-all duration-700"
                    style={{
                      width: `${blueWidth}%`,
                      minWidth: "4px",
                      backgroundColor: `${CAMP_COLORS.blue.primary}80`,
                    }}
                  />
                </div>
              </div>

              {/* 구분선 */}
              <div className="h-6 w-px bg-white/10" />

              {/* 빨강 (좌 → 우) */}
              <div className="flex flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 rounded-r-md transition-all duration-700"
                    style={{
                      width: `${redWidth}%`,
                      minWidth: "4px",
                      backgroundColor: `${CAMP_COLORS.red.primary}80`,
                    }}
                  />
                  <span className="text-xs tabular-nums text-white/30">{cat.redScore}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 범례 */}
      <div className="flex justify-center gap-6 pt-2 text-xs text-white/25">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CAMP_COLORS.blue.primary }} />
          {CAMP_COLORS.blue.label}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CAMP_COLORS.red.primary }} />
          {CAMP_COLORS.red.label}
        </div>
      </div>
    </div>
  );
}
