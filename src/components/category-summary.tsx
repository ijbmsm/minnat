"use client";

import type { Camp, Issue } from "@/types";
import { CATEGORIES, CAMP_COLORS, CATEGORY_MAP } from "@/lib/constants";
import { calculateIssueScore, type ScoreView } from "@/lib/score";

interface CategorySummaryProps {
  camp: Camp;
  issues: Issue[];
  view?: ScoreView;
}

export function CategorySummary({ camp, issues, view = "recent" }: CategorySummaryProps) {
  const colors = CAMP_COLORS[camp];

  // 점수 카테고리만 표시 (archive는 별도)
  const scored = CATEGORIES
    .filter((c) => c.isScored)
    .map((cat) => {
      const catIssues = issues.filter((i) => i.category === cat.key);
      const totalScore = catIssues.reduce((sum, i) => sum + calculateIssueScore(i, view), 0);
      return { ...cat, count: catIssues.length, totalScore: Math.round(totalScore * 10) / 10 };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.totalScore - a.totalScore);

  // archive 카테고리 건수
  const archived = CATEGORIES
    .filter((c) => c.isArchive)
    .map((cat) => {
      const count = issues.filter((i) => i.category === cat.key).length;
      return { ...cat, count };
    })
    .filter((c) => c.count > 0);

  const totalScoredIssues = scored.reduce((sum, s) => sum + s.count, 0);
  const totalArchiveIssues = archived.reduce((sum, a) => sum + a.count, 0);

  if (scored.length === 0 && archived.length === 0) return null;

  const maxScore = Math.max(...scored.map((s) => s.totalScore), 1);

  return (
    <div
      className="rounded-xl border p-5"
      style={{ borderColor: colors.border, backgroundColor: colors.bg }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide" style={{ color: colors.glow }}>
          {colors.label}
        </h3>
        <span className="text-xs tabular-nums text-white/25">
          {totalScoredIssues + totalArchiveIssues}건
        </span>
      </div>

      {/* 점수 이슈 */}
      {scored.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-white/20">공식 처분</p>
          {scored.map((cat) => {
            const barWidth = Math.max(4, (cat.totalScore / maxScore) * 100);
            return (
              <div key={cat.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-white/60">{cat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums text-white/30">{cat.count}건</span>
                    <span className="min-w-[3rem] text-right font-mono text-xs tabular-nums font-medium" style={{ color: colors.glow }}>
                      {cat.totalScore}
                    </span>
                  </div>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${barWidth}%`, backgroundColor: `${colors.primary}60` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Archive 이슈 */}
      {archived.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-white/15">기록 (점수 X)</p>
          {archived.map((cat) => (
            <div key={cat.key} className="flex items-center justify-between text-xs">
              <span className="text-white/30">{cat.label}</span>
              <span className="tabular-nums text-white/20">{cat.count}건</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
