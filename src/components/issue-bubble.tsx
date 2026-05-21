"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import type { Issue } from "@/types";
import { CAMP_COLORS, CATEGORY_MAP, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import { calculateIssueScore, type ScoreView } from "@/lib/score";

interface IssueBubbleProps {
  issues: Issue[];
  view: ScoreView;
}

export function IssueBubble({ issues, view }: IssueBubbleProps) {
  const bubbles = useMemo(() => {
    const scored = issues
      .filter((i) => CATEGORY_MAP[i.category]?.isScored)
      .map((issue) => ({
        issue,
        score: calculateIssueScore(issue, view),
      }))
      .filter((b) => b.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30); // 최대 30개

    if (scored.length === 0) return [];

    const maxScore = Math.max(...scored.map((b) => b.score));

    // 버블 위치 계산 — 파랑 좌측, 빨강 우측
    return scored.map((b, i) => {
      const isBlue = b.issue.camp === "blue";
      const size = Math.max(36, (b.score / maxScore) * 100);

      // 진영별 x 범위
      const xBase = isBlue ? 10 : 55;
      const xRange = 35;

      // 시드 기반 위치 (일관된 배치)
      const seed = b.issue.id.charCodeAt(0) + b.issue.id.charCodeAt(1);
      const x = xBase + ((seed * 7 + i * 13) % 100) / 100 * xRange;
      const y = 10 + ((seed * 11 + i * 17) % 100) / 100 * 75;

      return { ...b, size, x, y };
    });
  }, [issues, view]);

  if (bubbles.length === 0) {
    return (
      <div className="rounded-xl border border-white/5 py-12 text-center text-white/25">
        표시할 이슈가 없습니다.
      </div>
    );
  }

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-xl border border-white/5 bg-white/[0.01]">
      {/* 좌우 라벨 */}
      <div className="absolute top-3 left-4 text-xs text-white/20" style={{ color: CAMP_COLORS.blue.glow }}>
        {CAMP_COLORS.blue.label}
      </div>
      <div className="absolute top-3 right-4 text-xs text-white/20" style={{ color: CAMP_COLORS.red.glow }}>
        {CAMP_COLORS.red.label}
      </div>

      {/* 중앙선 */}
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/[0.03]" />

      {/* 버블 */}
      {bubbles.map((b, i) => {
        const colors = CAMP_COLORS[b.issue.camp];
        return (
          <motion.div
            key={b.issue.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03, type: "spring", stiffness: 200, damping: 15 }}
            className="group absolute"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <Link href={`/issues/${b.issue.id}`}>
              <div
                className="flex items-center justify-center rounded-full border transition-transform hover:scale-110"
                style={{
                  width: `${b.size}px`,
                  height: `${b.size}px`,
                  backgroundColor: `${colors.primary}25`,
                  borderColor: `${colors.primary}40`,
                }}
              >
                <span className="font-mono text-[10px] font-bold tabular-nums" style={{ color: colors.glow }}>
                  {b.score.toFixed(0)}
                </span>
              </div>

              {/* 호버 툴팁 */}
              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden w-48 -translate-x-1/2 rounded-lg border border-white/10 bg-[#0c0c10] p-2.5 shadow-xl group-hover:block">
                <p className="mb-1 line-clamp-2 text-[11px] leading-snug text-white/70">
                  {b.issue.title}
                </p>
                <div className="flex items-center gap-2 text-[9px] text-white/30">
                  {b.issue.criminal_stage && (
                    <span>{CRIMINAL_STAGE_LABEL[b.issue.criminal_stage]}</span>
                  )}
                  <span>{CATEGORY_MAP[b.issue.category]?.label}</span>
                  <span className="ml-auto font-mono" style={{ color: colors.glow }}>
                    {b.score.toFixed(1)}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
