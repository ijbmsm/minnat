"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Issue } from "@/types";
import { CAMP_COLORS, CATEGORY_MAP, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import { calculateIssueScore, type ScoreView } from "@/lib/score";

interface TimelineViewProps {
  issues: Issue[];
  view: ScoreView;
}

export function TimelineView({ issues, view }: TimelineViewProps) {
  // 점수 카테고리만
  const scored = issues.filter((i) => CATEGORY_MAP[i.category]?.isScored);

  // 연도별 그룹
  const byYear: Record<number, Issue[]> = {};
  for (const issue of scored) {
    const year = new Date(issue.published_at).getFullYear();
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(issue);
  }

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  if (years.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 py-12 text-center text-white/75">
        타임라인에 표시할 공식 처분 이슈가 없습니다.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 중앙선 */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/5" />

      {years.map((year) => {
        const yearIssues = byYear[year];
        const blueIssues = yearIssues.filter((i) => i.camp === "blue");
        const redIssues = yearIssues.filter((i) => i.camp === "red");

        return (
          <div key={year} className="mb-8">
            {/* 연도 마커 */}
            <div className="relative mb-4 flex justify-center">
              <span className="relative z-10 rounded-full border border-white/10 bg-[#0c0c10] px-4 py-1 text-sm font-bold tabular-nums text-white/75">
                {year}
              </span>
            </div>

            {/* 좌우 이슈 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 파랑 (좌) */}
              <div className="space-y-2 pr-4">
                {blueIssues.map((issue, i) => (
                  <TimelineCard key={issue.id} issue={issue} side="blue" index={i} view={view} />
                ))}
                {blueIssues.length === 0 && (
                  <div className="py-4 text-center text-xs text-white/75">—</div>
                )}
              </div>

              {/* 빨강 (우) */}
              <div className="space-y-2 pl-4">
                {redIssues.map((issue, i) => (
                  <TimelineCard key={issue.id} issue={issue} side="red" index={i} view={view} />
                ))}
                {redIssues.length === 0 && (
                  <div className="py-4 text-center text-xs text-white/75">—</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineCard({
  issue,
  side,
  index,
  view,
}: {
  issue: Issue;
  side: "blue" | "red";
  index: number;
  view: ScoreView;
}) {
  const colors = CAMP_COLORS[side];
  const score = calculateIssueScore(issue, view);
  const month = new Date(issue.published_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0, x: side === "blue" ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/issues/${issue.id}`}
        className="block rounded-lg border p-3 transition-colors hover:bg-white/[0.03]"
        style={{ borderColor: `${colors.primary}20` }}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] text-white/75">{month}</span>
          {issue.criminal_stage && (
            <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] text-red-400/50">
              {CRIMINAL_STAGE_LABEL[issue.criminal_stage]}
            </span>
          )}
        </div>
        <p className="mb-1 line-clamp-2 text-xs leading-snug text-white/75">
          {issue.title}
        </p>
        {score > 0 && (
          <span className="font-mono text-xs font-semibold tabular-nums" style={{ color: colors.glow }}>
            {score.toFixed(1)}
          </span>
        )}
      </Link>
    </motion.div>
  );
}
