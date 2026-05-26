"use client";

import type { IssueEvent } from "@/types";
import { SCORED_CATEGORIES, CAMP_COLORS } from "@/lib/constants";
import { type ScoreView } from "@/lib/score";

interface CategoryBarChartProps {
  events: IssueEvent[];
  view: ScoreView;
}

function filterEventByView(event: IssueEvent, view: ScoreView): boolean {
  const refDate = event.last_reported_at || event.created_at;
  const days = (Date.now() - new Date(refDate).getTime()) / 86400000;
  switch (view) {
    case "hot": return days <= 30;
    case "recent": return days <= 365;
    case "midterm": return days <= 1825;
    case "alltime": return true;
  }
}

export function CategoryBarChart({ events, view }: CategoryBarChartProps) {
  const filtered = events.filter((e) => filterEventByView(e, view));

  const categories = SCORED_CATEGORIES.map((cat) => {
    const blueCount = filtered.filter((e) => e.camp === "blue" && e.category === cat.key).length;
    const redCount = filtered.filter((e) => e.camp === "red" && e.category === cat.key).length;
    return { ...cat, blueCount, redCount };
  }).filter((c) => c.blueCount + c.redCount > 0);

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 py-12 text-center text-white/25">
        비교할 공식 처분 사건이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {categories.map((cat) => {
        const catMax = Math.max(cat.blueCount, cat.redCount, 1);
        const bluePct = Math.max(3, (cat.blueCount / catMax) * 100);
        const redPct = Math.max(3, (cat.redCount / catMax) * 100);

        return (
          <div key={cat.key}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-white/70">{cat.label}</span>
              <span className="text-xs text-white/25">
                총 {cat.blueCount + cat.redCount}건
              </span>
            </div>

            {/* 파랑 바 */}
            <div className="mb-1.5 flex items-center gap-3">
              <span className="w-10 text-right text-xs tabular-nums" style={{ color: CAMP_COLORS.blue.glow }}>
                {cat.blueCount}건
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
              <span className="w-10 text-right text-xs tabular-nums" style={{ color: CAMP_COLORS.red.glow }}>
                {cat.redCount}건
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
