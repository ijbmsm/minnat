"use client";

import { motion } from "framer-motion";
import type { ScoreResult, Issue } from "@/types";
import { CAMP_COLORS } from "@/lib/constants";
import { CategorySummary } from "./category-summary";
import { FluidBackground } from "./fluid-background";
import { ViewTabs } from "./view-tabs";
import type { ScoreView } from "@/lib/score";

interface SplitScreenProps {
  score: ScoreResult;
  issues: Issue[];
  view: ScoreView;
  onViewChange: (view: ScoreView) => void;
}

export function SplitScreen({ score, issues, view, onViewChange }: SplitScreenProps) {
  const blueIssues = issues.filter((i) => i.camp === "blue");
  const redIssues = issues.filter((i) => i.camp === "red");

  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden">
      {/* 배경 — 처음엔 검정, 1초 후 먹 배경이 서서히 드러남 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3, delay: 0.5, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <FluidBackground score={score} />
      </motion.div>

      {/* 콘텐츠 */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4">

        {/* 부제 — 배경이 깔린 후 등장 */}
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, letterSpacing: "0.35em" }}
          transition={{ duration: 1.5, delay: 2 }}
          className="mb-3 text-[10px] text-white/30 uppercase sm:text-xs"
        >
          색안경 벗고, 팩트로 보는 정치
        </motion.p>

        {/* 타이틀 — 크게 등장 후 줄어듦 */}
        <motion.h1
          initial={{ opacity: 0, scale: 1.3, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.2, delay: 2.5, ease: "easeOut" }}
          className="mb-20 text-center text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl"
          style={{ textShadow: "0 0 40px rgba(0,0,0,0.5)" }}
        >
          민낯
        </motion.h1>

        {/* 퍼센티지 — 양쪽에서 슬라이드 인 */}
        <div className="mb-6 flex w-full max-w-3xl items-center justify-between">
          {/* 파랑 — 좌측에서 등장 */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 3.2, ease: "easeOut" }}
            className="flex flex-col items-start"
          >
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
          </motion.div>

          {/* 중앙 구분선 — 위아래에서 자라남 */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.8, delay: 3.8 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.2 }}
              className="text-[10px] tracking-widest text-white/20 uppercase"
            >
              vs
            </motion.span>
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
          </motion.div>

          {/* 빨강 — 우측에서 등장 */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 3.2, ease: "easeOut" }}
            className="flex flex-col items-end"
          >
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
          </motion.div>
        </div>

        {/* Dual Metric — 1인당 평균 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 4.2 }}
          className="mb-4 flex w-full max-w-3xl justify-between text-[10px] tabular-nums text-white/20"
        >
          <span>이슈 {score.blueCount}건 | 1인당 {score.bluePerCapita.toFixed(1)}</span>
          <span>{score.redPerCapita.toFixed(1)} 1인당 | {score.redCount}건 이슈</span>
        </motion.div>

        {/* 뷰 탭 + 설명 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 4.5 }}
          className="mb-16 flex flex-col items-center gap-3"
        >
          <ViewTabs current={view} onChange={onViewChange} />
          <p className="text-center text-xs text-white/20">
            비율이 높을수록 해당 진영의 부정적 이슈가 많습니다
          </p>
        </motion.div>

        {/* 카테고리 요약 — 아래에서 올라옴 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 5 }}
          className="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2"
        >
          <CategorySummary camp="blue" issues={blueIssues} />
          <CategorySummary camp="red" issues={redIssues} />
        </motion.div>

        {/* 스크롤 힌트 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5.8 }}
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
