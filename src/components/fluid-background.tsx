"use client";

import { useEffect, useRef, useCallback } from "react";
import WebGLFluidEnhanced from "webgl-fluid-enhanced";
import type { ScoreResult } from "@/types";

const PARTY_COLORS = {
  blue: "#003B96",
  red: "#E61E2B",
} as const;

interface FluidBackgroundProps {
  score: ScoreResult;
}

export function FluidBackground({ score }: FluidBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fluidRef = useRef<WebGLFluidEnhanced | null>(null);
  const initializedRef = useRef(false);

  const triggerSplats = useCallback((bluePct: number, redPct: number) => {
    const fluid = fluidRef.current;
    const container = containerRef.current;
    if (!fluid || !container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    // 파랑 — 좌측에서 분사 (점수 비례)
    const blueStrength = Math.max(200, bluePct * 15);
    for (let i = 0; i < 3; i++) {
      const x = w * (0.1 + Math.random() * 0.25);
      const y = h * (0.2 + Math.random() * 0.6);
      fluid.splatAtLocation(
        x, y,
        blueStrength * (0.5 + Math.random()),
        (Math.random() - 0.5) * blueStrength,
        PARTY_COLORS.blue
      );
    }

    // 빨강 — 우측에서 분사
    const redStrength = Math.max(200, redPct * 15);
    for (let i = 0; i < 3; i++) {
      const x = w * (0.65 + Math.random() * 0.25);
      const y = h * (0.2 + Math.random() * 0.6);
      fluid.splatAtLocation(
        x, y,
        -redStrength * (0.5 + Math.random()),
        (Math.random() - 0.5) * redStrength,
        PARTY_COLORS.red
      );
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const fluid = new WebGLFluidEnhanced(containerRef.current);
    fluidRef.current = fluid;

    fluid.setConfig({
      simResolution: 128,
      dyeResolution: 1024,
      densityDissipation: 0.97,
      velocityDissipation: 0.98,
      pressure: 0.8,
      curl: 20,
      splatRadius: 0.35,
      splatForce: 6000,
      shading: true,
      colorful: false,
      colorUpdateSpeed: 6,
      backgroundColor: "#060608",
      transparent: false,
      brightness: 0.4,
      bloom: true,
      bloomIterations: 8,
      bloomResolution: 256,
      bloomIntensity: 0.3,
      bloomThreshold: 0.6,
      bloomSoftKnee: 0.7,
      sunrays: false,
      colorPalette: [PARTY_COLORS.blue, PARTY_COLORS.red],
      hover: true,
    });

    fluid.start();

    // 초기 분사 — 약간 지연 후
    const timer = setTimeout(() => {
      triggerSplats(score.bluePct, score.redPct);
    }, 500);

    // 주기적으로 은은하게 추가 분사 (살아있는 느낌)
    const interval = setInterval(() => {
      const container = containerRef.current;
      const f = fluidRef.current;
      if (!container || !f) return;

      const w = container.clientWidth;
      const h = container.clientHeight;

      // 파랑 쪽 작은 분사
      f.splatAtLocation(
        w * (0.05 + Math.random() * 0.3),
        h * (0.1 + Math.random() * 0.8),
        80 + Math.random() * 120,
        (Math.random() - 0.5) * 80,
        PARTY_COLORS.blue
      );

      // 빨강 쪽 작은 분사
      f.splatAtLocation(
        w * (0.65 + Math.random() * 0.3),
        h * (0.1 + Math.random() * 0.8),
        -(80 + Math.random() * 120),
        (Math.random() - 0.5) * 80,
        PARTY_COLORS.red
      );
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      fluid.stop();
    };
  }, [score.bluePct, score.redPct, triggerSplats]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full"
      style={{ background: "#060608" }}
    />
  );
}
