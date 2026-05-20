"use client";

import { motion } from "framer-motion";
import type { ScoreResult, Issue } from "@/types";
import { CAMP_COLORS } from "@/lib/constants";
import { CategorySummary } from "./category-summary";
import { FluidBackground } from "./fluid-background";

interface SplitScreenProps {
  score: ScoreResult;
  issues: Issue[];
}

export function SplitScreen({ score, issues }: SplitScreenProps) {
  const blueIssues = issues.filter((i) => i.camp === "blue");
  const redIssues = issues.filter((i) => i.camp === "red");

  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden">
      {/* WebGL 유체 배경 */}
      <FluidBackground score={score} />

      {/* 노이즈 오버레이 (한지 질감) */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* 콘텐츠 */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4">
        {/* 부제 */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-3 text-[10px] tracking-[0.35em] text-white/30 uppercase sm:text-xs"
        >
          색안경 벗고, 팩트로 보는 정치
        </motion.p>

        {/* 타이틀 */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-16 text-center text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl"
          style={{ textShadow: "0 0 40px rgba(0,0,0,0.5)" }}
        >
          민낯
        </motion.h1>

        {/* 퍼센티지 — 좌우로 크게 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mb-6 flex w-full max-w-3xl items-center justify-between"
        >
          {/* 파랑 */}
          <div className="flex flex-col items-start">
            <span
              className="text-6xl font-bold tabular-nums leading-none sm:text-7xl md:text-8xl"
              style={{
                color: CAMP_COLORS.blue.glow,
                textShadow: `0 0 60px ${CAMP_COLORS.blue.primary}80`,
              }}
            >
              {score.bluePct}
              <span className="text-2xl font-normal text-white/25 sm:text-3xl">%</span>
            </span>
            <span className="mt-2 text-xs tracking-wide text-white/30 sm:text-sm">
              {CAMP_COLORS.blue.label}
            </span>
          </div>

          {/* 중앙 */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            <span className="text-[10px] tracking-widest text-white/20 uppercase">vs</span>
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
          </motion.div>

          {/* 빨강 */}
          <div className="flex flex-col items-end">
            <span
              className="text-6xl font-bold tabular-nums leading-none sm:text-7xl md:text-8xl"
              style={{
                color: CAMP_COLORS.red.glow,
                textShadow: `0 0 60px ${CAMP_COLORS.red.primary}80`,
              }}
            >
              {score.redPct}
              <span className="text-2xl font-normal text-white/25 sm:text-3xl">%</span>
            </span>
            <span className="mt-2 text-xs tracking-wide text-white/30 sm:text-sm">
              {CAMP_COLORS.red.label}
            </span>
          </div>
        </motion.div>

        {/* 설명 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mb-16 text-center text-xs text-white/20"
        >
          비율이 높을수록 해당 진영의 부정적 이슈가 많습니다
        </motion.p>

        {/* 카테고리 요약 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
          className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2"
        >
          <CategorySummary camp="blue" issues={blueIssues} />
          <CategorySummary camp="red" issues={redIssues} />
        </motion.div>

        {/* 스크롤 힌트 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2 }}
          className="mt-20 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] tracking-widest text-white/15 uppercase">
            최근 이슈
          </span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-6 w-3.5 rounded-full border border-white/10"
          >
            <motion.div
              animate={{ y: [2, 10, 2] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto mt-1 h-1.5 w-0.5 rounded-full bg-white/20"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
