"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import type { ScoreResult } from "@/types";
import { CAMP_COLORS } from "@/lib/constants";
import { CategorySummary } from "./category-summary";
import type { Issue } from "@/types";

interface SplitScreenProps {
  score: ScoreResult;
  issues: Issue[];
}

export function SplitScreen({ score, issues }: SplitScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const springPct = useSpring(50, { stiffness: 40, damping: 20 });
  const blueWidth = useTransform(springPct, (v) => `${v}%`);
  const redWidth = useTransform(springPct, (v) => `${100 - v}%`);

  useEffect(() => {
    if (mounted) {
      springPct.set(score.bluePct);
    }
  }, [mounted, score.bluePct, springPct]);

  const blueIssues = issues.filter((i) => i.camp === "blue");
  const redIssues = issues.filter((i) => i.camp === "red");

  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#0a0a0c]">
      {/* 배경 글로우 */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-0 top-0 h-full"
          style={{ width: blueWidth }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse at 30% 50%, ${CAMP_COLORS.blue.glow}, transparent 70%)`,
            }}
          />
        </motion.div>
        <motion.div
          className="absolute right-0 top-0 h-full"
          style={{ width: redWidth }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(ellipse at 70% 50%, ${CAMP_COLORS.red.glow}, transparent 70%)`,
            }}
          />
        </motion.div>
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4">
        {/* 타이틀 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-2 text-center"
        >
          <p className="text-xs tracking-[0.3em] text-white/40 uppercase">
            팩트로 보는 대한민국 정치
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12 text-center text-5xl font-bold tracking-tight text-white/90 sm:text-6xl md:text-7xl"
        >
          민낯
        </motion.h1>

        {/* 스플릿 게이지 */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="relative mb-8 h-20 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/5 sm:h-24"
        >
          {/* 파랑 영역 */}
          <motion.div
            className="absolute left-0 top-0 flex h-full items-center justify-center"
            style={{ width: blueWidth }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${CAMP_COLORS.blue.primary}cc, ${CAMP_COLORS.blue.primary}66)`,
              }}
            />
            <div className="relative z-10 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tabular-nums text-white sm:text-4xl">
                {score.bluePct}
              </span>
              <span className="text-sm font-medium text-white/60">%</span>
            </div>
          </motion.div>

          {/* 빨강 영역 */}
          <motion.div
            className="absolute right-0 top-0 flex h-full items-center justify-center"
            style={{ width: redWidth }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${CAMP_COLORS.red.primary}66, ${CAMP_COLORS.red.primary}cc)`,
              }}
            />
            <div className="relative z-10 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tabular-nums text-white sm:text-4xl">
                {score.redPct}
              </span>
              <span className="text-sm font-medium text-white/60">%</span>
            </div>
          </motion.div>

          {/* 경계선 */}
          <motion.div
            className="absolute top-0 z-20 h-full w-px bg-white/30"
            style={{ left: blueWidth }}
          >
            <div className="absolute -left-1 -top-1 h-[calc(100%+8px)] w-0.5 bg-white/50 blur-sm" />
          </motion.div>
        </motion.div>

        {/* 진영 라벨 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mb-12 flex w-full max-w-4xl justify-between px-2 text-xs tracking-wide sm:text-sm"
        >
          <span style={{ color: CAMP_COLORS.blue.glow }}>
            {CAMP_COLORS.blue.label}
          </span>
          <span style={{ color: CAMP_COLORS.red.glow }}>
            {CAMP_COLORS.red.label}
          </span>
        </motion.div>

        {/* 카테고리 요약 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2"
        >
          <CategorySummary camp="blue" issues={blueIssues} />
          <CategorySummary camp="red" issues={redIssues} />
        </motion.div>

        {/* 스크롤 힌트 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-white/30">최근 이슈</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-5 w-3 rounded-full border border-white/20"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mx-auto mt-1 h-1.5 w-0.5 rounded-full bg-white/40"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
