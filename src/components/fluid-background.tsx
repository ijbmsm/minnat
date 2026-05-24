"use client";

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const blueLayers = useMemo(() => generateLayers(8, 42), []);
  const redLayers = useMemo(() => generateLayers(8, 99), []);

  // CSS transition으로 처리 (spring이 아니라 브라우저 네이티브)
  const blueW = `${score.bluePct + 8}%`;
  const redW = `${score.redPct + 8}%`;

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-[#0c0c10]"
      style={{ opacity: ready ? 1 : 0, transition: "opacity 2s ease" }}
    >
      {/* 파랑 — 좌측 */}
      <div
        className="absolute left-0 top-0 h-full origin-left"
        style={{
          width: blueW,
          transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
          animation: "edge-breathe 20s ease-in-out infinite",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right,
              #0a2050 0%, #0d2a6a 15%, #103080 30%,
              rgba(16,48,128,0.5) 55%, rgba(16,48,128,0.15) 75%, transparent 100%
            )`,
          }}
        />
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
              willChange: "transform",
              animation: `${layer.anim} ${layer.duration}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* 빨강 — 우측 */}
      <div
        className="absolute right-0 top-0 h-full origin-right"
        style={{
          width: redW,
          transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
          animation: "edge-breathe 24s ease-in-out infinite reverse",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to left,
              #501010 0%, #6a1515 15%, #801a1a 30%,
              rgba(128,26,26,0.5) 55%, rgba(128,26,26,0.15) 75%, transparent 100%
            )`,
          }}
        />
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
              willChange: "transform",
              animation: `${layer.anim} ${layer.duration}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* 톤 다운 */}
      <div className="pointer-events-none absolute inset-0 bg-black/30" />

      {/* 노이즈 */}
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
