"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import type { ScoreResult, Issue } from "@/types";
import { CAMP_COLORS } from "@/lib/constants";
import { CategorySummary } from "./category-summary";

interface SplitScreenProps {
  score: ScoreResult;
  issues: Issue[];
}

export function SplitScreen({ score, issues }: SplitScreenProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const springPct = useSpring(50, { stiffness: 30, damping: 18 });
  const blueWidth = useTransform(springPct, (v) => `${v}%`);
  const redWidth = useTransform(springPct, (v) => `${100 - v}%`);
  const dividerLeft = useTransform(springPct, (v) => `${v}%`);

  useEffect(() => {
    if (mounted) {
      springPct.set(score.bluePct);
    }
  }, [mounted, score.bluePct, springPct]);

  const blueIssues = issues.filter((i) => i.camp === "blue");
  const redIssues = issues.filter((i) => i.camp === "red");

  return (
    <section className="relative min-h-[100dvh] w-full overflow-hidden bg-[#060608]">
      {/* ── 배경 분위기 레이어 (비율만큼 영역 차지) ── */}
      <div className="pointer-events-none absolute inset-0">
        {/* 파랑 — 좌측 배경 */}
        <motion.div
          className="absolute left-0 top-0 h-full"
          style={{ width: blueWidth }}
        >
          <div
            className="absolute inset-0 blur-[80px]"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${CAMP_COLORS.blue.primary}45, transparent 70%)`,
            }}
          />
          <div
            className="absolute inset-0 blur-[40px]"
            style={{
              background: `radial-gradient(ellipse at 60% 45%, ${CAMP_COLORS.blue.glow}30, transparent 55%)`,
            }}
          />
        </motion.div>

        {/* 빨강 — 우측 배경 */}
        <motion.div
          className="absolute right-0 top-0 h-full"
          style={{ width: redWidth }}
        >
          <div
            className="absolute inset-0 blur-[80px]"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${CAMP_COLORS.red.primary}45, transparent 70%)`,
            }}
          />
          <div
            className="absolute inset-0 blur-[40px]"
            style={{
              background: `radial-gradient(ellipse at 40% 55%, ${CAMP_COLORS.red.glow}30, transparent 55%)`,
            }}
          />
        </motion.div>

        {/* 경계 — 은은한 수직 라인 */}
        <motion.div
          className="absolute top-0 h-full w-px"
          style={{
            left: dividerLeft,
            background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.04) 70%, transparent)",
          }}
        />
      </div>

      {/* ── 콘텐츠 ── */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-4">
        {/* 부제 */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-3 text-[10px] tracking-[0.35em] text-white/25 uppercase sm:text-xs"
        >
          색안경 벗고, 팩트로 보는 정치
        </motion.p>

        {/* 타이틀 */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-16 text-center text-5xl font-bold tracking-tight text-white/90 sm:text-6xl md:text-7xl"
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
          {/* 파랑 퍼센트 */}
          <div className="flex flex-col items-start">
            <span
              className="text-6xl font-bold tabular-nums leading-none sm:text-7xl md:text-8xl"
              style={{ color: `${CAMP_COLORS.blue.glow}90` }}
            >
              {score.bluePct}
              <span className="text-2xl font-normal text-white/20 sm:text-3xl">%</span>
            </span>
            <span className="mt-2 text-xs tracking-wide text-white/25 sm:text-sm">
              {CAMP_COLORS.blue.label}
            </span>
          </div>

          {/* 중앙 구분 */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            <span className="text-[10px] tracking-widest text-white/15 uppercase">vs</span>
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          </motion.div>

          {/* 빨강 퍼센트 */}
          <div className="flex flex-col items-end">
            <span
              className="text-6xl font-bold tabular-nums leading-none sm:text-7xl md:text-8xl"
              style={{ color: `${CAMP_COLORS.red.glow}90` }}
            >
              {score.redPct}
              <span className="text-2xl font-normal text-white/20 sm:text-3xl">%</span>
            </span>
            <span className="mt-2 text-xs tracking-wide text-white/25 sm:text-sm">
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
