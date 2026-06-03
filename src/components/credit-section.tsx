"use client";

import { motion } from "framer-motion";
import type { CreditEvent, NetScore } from "@/types";
import { CREDIT_CATEGORY_CONFIG } from "@/lib/constants";

const EASE = [0.32, 0.72, 0, 1] as const;

interface CreditSectionProps {
  credits: CreditEvent[];
  netScore: NetScore;
  campColor: string;
}

export function CreditSection({ credits, netScore, campColor }: CreditSectionProps) {
  if (credits.length === 0) return null;

  const pct = Math.round(netScore.creditRatio * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div className="rounded-[1.25rem] bg-emerald-500/[0.02] p-[1px] ring-1 ring-emerald-500/15">
        <div className="rounded-[calc(1.25rem-1px)] bg-[#0c0c10] p-5">
          <span className="mb-4 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-emerald-400/70 uppercase">
            감경 요소
          </span>

          {/* 감경률 바 */}
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-white/50">감경률</span>
              <span className="font-mono text-sm tabular-nums text-emerald-400/70">
                {pct}%
                <span className="text-[10px] text-white/30"> / 최대 70%</span>
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(pct / 70) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3, ease: EASE }}
                className="h-full rounded-full bg-emerald-500/40"
              />
            </div>
          </div>

          {/* 점수 변환 */}
          <div className="mb-4 flex items-center gap-2 text-sm">
            <span className="font-mono tabular-nums text-white/50">
              {netScore.grossScore.toFixed(1)}
            </span>
            <span className="text-white/20">&rarr;</span>
            <span
              className="font-mono font-bold tabular-nums"
              style={{ color: campColor }}
            >
              {netScore.netScore.toFixed(1)}
            </span>
          </div>

          {/* 개별 감경 항목 */}
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] text-white/40 transition-colors hover:text-white/60">
              <span>상세 {credits.length}건</span>
              <span className="transition-transform duration-300 group-open:rotate-180">
                &#9662;
              </span>
            </summary>
            <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
              {credits.map((credit) => {
                const config = CREDIT_CATEGORY_CONFIG[credit.credit_category];
                return (
                  <div key={credit.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                            credit.credit_type === "special"
                              ? "bg-emerald-500/15 text-emerald-400/70"
                              : "bg-white/5 text-white/50"
                          }`}
                        >
                          {config?.label}
                        </span>
                      </div>
                      {credit.description && (
                        <p className="mt-1 text-[11px] leading-snug text-white/40">
                          {credit.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-emerald-400/50">
                      -{Math.round(credit.credit_value * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </details>
        </div>
      </div>
    </motion.div>
  );
}
