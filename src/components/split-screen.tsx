"use client";

import { motion } from "framer-motion";
import type { ScoreResult } from "@/types";
import { CAMP_COLORS } from "@/lib/constants";
import { FluidBackground } from "./fluid-background";
import { ViewTabs } from "./view-tabs";
import type { ScoreView } from "@/lib/score";

interface SplitScreenProps {
  score: ScoreResult;
  view: ScoreView;
  onViewChange: (view: ScoreView) => void;
}

export function SplitScreen({ score, view, onViewChange }: SplitScreenProps) {
  return (
    <section className="relative h-[100dvh] w-full overflow-clip bg-[#0c0c10]">
      {/* 배경 */}
      <FluidBackground score={score} />

      {/* 콘텐츠 */}
      <div className="relative z-10 flex h-full flex-col items-center px-4 pt-24">

        {/* 상단 spacer — 스크롤 힌트와 균형 */}
        <div className="flex-1" />

        {/* 타이틀 */}
        <motion.h1
          initial={{ opacity: 0, scale: 1.3, filter: "blur(12px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.2, delay: 2.5, ease: "easeOut" }}
          className="mb-12 text-center text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl"
          style={{ fontFamily: "'Shilla Culture', serif", WebkitTextStroke: "1px currentColor", textShadow: "0 0 40px rgba(0,0,0,0.5)" }}
        >
          술자리
        </motion.h1>

        {/* 퍼센티지 */}
        <div className="mb-4 flex w-full max-w-3xl items-center justify-between">
          {/* 파랑 */}
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
              <span className="text-2xl font-normal text-white/75 sm:text-3xl">%</span>
            </span>
            <span className="mt-2 text-xs tracking-wide text-white/75 sm:text-sm">
              {CAMP_COLORS.blue.label}
            </span>
          </motion.div>

          {/* 중앙 구분선 */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.8, delay: 3.8 }}
            className="flex flex-col items-center gap-1.5"
          >
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.2 }}
              className="text-[10px] tracking-widest text-white/75 uppercase"
            >
              vs
            </motion.span>
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
          </motion.div>

          {/* 빨강 */}
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
              <span className="text-2xl font-normal text-white/75 sm:text-3xl">%</span>
            </span>
            <span className="mt-2 text-xs tracking-wide text-white/75 sm:text-sm">
              {CAMP_COLORS.red.label}
            </span>
          </motion.div>
        </div>

        {/* 이슈 건수 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 4.2 }}
          className="mb-4 flex w-full max-w-3xl justify-between text-[10px] tabular-nums text-white/75"
        >
          <span>이슈 {score.blueCount}건 | 1인당 {score.bluePerCapita.toFixed(1)}</span>
          <span>{score.redPerCapita.toFixed(1)} 1인당 | {score.redCount}건 이슈</span>
        </motion.div>

        {/* 뷰 탭 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 4.5 }}
          className="flex flex-col items-center gap-2"
        >
          <ViewTabs current={view} onChange={onViewChange} />
          <p className="text-center text-[10px] text-white/75">
            비율이 높을수록 해당 진영의 부정적 이슈가 많습니다
          </p>
        </motion.div>

        {/* 하단 spacer */}
        <div className="flex-1" />

        {/* 스크롤 힌트 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5.5 }}
          className="pb-6"
        >
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
