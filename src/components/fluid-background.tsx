"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import type { ScoreResult } from "@/types";

interface FluidBackgroundProps {
  score: ScoreResult;
}

interface SmokeLayer {
  x: number;
  y: number;
  size: number;
  opacity: number;
  anim: string;
  duration: number;
}

function generateLayers(count: number, seed: number): SmokeLayer[] {
  // 시드 기반 의사 난수 (SSR/CSR 일치)
  let s = seed;
  function rand() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  }

  const anims = ["smoke-drift-1", "smoke-drift-2", "smoke-drift-3", "smoke-drift-4", "smoke-drift-5"];
  return Array.from({ length: count }, () => ({
    x: Math.round(rand() * 100),
    y: Math.round(rand() * 100),
    size: 25 + Math.round(rand() * 30),
    opacity: 0.3 + rand() * 0.5,
    anim: anims[Math.floor(rand() * anims.length)],
    duration: 18 + Math.round(rand() * 25),
  }));
}

export function FluidBackground({ score }: FluidBackgroundProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const springPct = useSpring(50, { stiffness: 20, damping: 15 });
  const blueWidth = useTransform(springPct, (v) => `${v + 8}%`);
  const redWidth = useTransform(springPct, (v) => `${100 - v + 8}%`);

  useEffect(() => {
    if (mounted) springPct.set(score.bluePct);
  }, [mounted, score.bluePct, springPct]);

  const blueLayers = useMemo(() => generateLayers(8, 42), []);
  const redLayers = useMemo(() => generateLayers(8, 99), []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0c0c10]">
      <style>{`
        @keyframes smoke-drift-1 {
          0%   { transform: translate(0%, 0%) scale(1); }
          33%  { transform: translate(4%, -5%) scale(1.08); }
          66%  { transform: translate(-3%, 4%) scale(0.95); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        @keyframes smoke-drift-2 {
          0%   { transform: translate(0%, 0%) scale(1); }
          33%  { transform: translate(-5%, 3%) scale(0.93); }
          66%  { transform: translate(3%, -4%) scale(1.05); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        @keyframes smoke-drift-3 {
          0%   { transform: translate(0%, 0%) scale(1.03); }
          50%  { transform: translate(6%, 3%) scale(0.94); }
          100% { transform: translate(0%, 0%) scale(1.03); }
        }
        @keyframes smoke-drift-4 {
          0%   { transform: translate(0%, 0%) scale(0.97); }
          40%  { transform: translate(-3%, -5%) scale(1.06); }
          70%  { transform: translate(4%, 2%) scale(0.98); }
          100% { transform: translate(0%, 0%) scale(0.97); }
        }
        @keyframes smoke-drift-5 {
          0%   { transform: translate(0%, 0%) scale(1); }
          30%  { transform: translate(2%, 5%) scale(1.04); }
          60%  { transform: translate(-4%, -2%) scale(0.96); }
          100% { transform: translate(0%, 0%) scale(1); }
        }
        @keyframes edge-breathe {
          0%   { transform: scaleX(1) scaleY(1); }
          25%  { transform: scaleX(1.03) scaleY(0.98); }
          50%  { transform: scaleX(0.97) scaleY(1.02); }
          75%  { transform: scaleX(1.02) scaleY(0.97); }
          100% { transform: scaleX(1) scaleY(1); }
        }
      `}</style>

      {/* 파랑 — 좌측에서 출발 */}
      <motion.div
        className="absolute left-0 top-0 h-full origin-left"
        style={{
          width: blueWidth,
          animation: "edge-breathe 20s ease-in-out infinite",
        }}
      >
        {/* 베이스 */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right,
              #0a2050 0%, #0d2a6a 20%, #103080 40%,
              rgba(16,48,128,0.6) 65%, rgba(16,48,128,0.2) 85%, transparent 100%
            )`,
          }}
        />
        {/* 연기 레이어들 — 무작위 위치, 각각 독립 움직임 */}
        {blueLayers.map((layer, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${layer.x - layer.size / 2}%`,
              top: `${layer.y - layer.size / 2}%`,
              width: `${layer.size * 2.5}%`,
              height: `${layer.size * 2.5}%`,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(12,35,100,${layer.opacity}) 0%, rgba(12,35,100,${layer.opacity * 0.3}) 40%, transparent 70%)`,
              filter: "blur(30px)",
              animation: `${layer.anim} ${layer.duration}s ease-in-out infinite`,
            }}
          />
        ))}
      </motion.div>

      {/* 빨강 — 우측에서 출발 */}
      <motion.div
        className="absolute right-0 top-0 h-full origin-right"
        style={{
          width: redWidth,
          animation: "edge-breathe 24s ease-in-out infinite reverse",
        }}
      >
        {/* 베이스 */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to left,
              #501010 0%, #6a1515 20%, #801a1a 40%,
              rgba(128,26,26,0.6) 65%, rgba(128,26,26,0.2) 85%, transparent 100%
            )`,
          }}
        />
        {/* 연기 레이어들 — 무작위 위치, 각각 독립 움직임 */}
        {redLayers.map((layer, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${layer.x - layer.size / 2}%`,
              top: `${layer.y - layer.size / 2}%`,
              width: `${layer.size * 2.5}%`,
              height: `${layer.size * 2.5}%`,
              borderRadius: "50%",
              background: `radial-gradient(circle, rgba(100,18,18,${layer.opacity}) 0%, rgba(100,18,18,${layer.opacity * 0.3}) 40%, transparent 70%)`,
              filter: "blur(30px)",
              animation: `${layer.anim} ${layer.duration}s ease-in-out infinite`,
            }}
          />
        ))}
      </motion.div>

      {/* 검은색 오버레이 — 톤 다운 */}
      <div className="pointer-events-none absolute inset-0 bg-black/30" />

      {/* 노이즈 — 질감 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "256px 256px",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
}
