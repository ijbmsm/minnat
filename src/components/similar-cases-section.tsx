"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { SimilarCase } from "@/types";
import { CATEGORY_MAP, CAMP_COLORS, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import type { CriminalStage } from "@/types";

const EASE = [0.32, 0.72, 0, 1] as const;

// ── Skeleton (서버 렌더 가능, "use client" 불필요하지만 같은 파일에 둠) ──

export function SimilarCasesSkeleton() {
  return (
    <div className="rounded-[1.5rem] bg-white/[0.02] p-[1px] ring-1 ring-white/5">
      <div className="rounded-[calc(1.5rem-1px)] bg-[#0c0c10] p-6 md:p-8">
        <div className="mb-6 h-5 w-20 animate-pulse rounded-full bg-white/5" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl bg-white/[0.02] p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-white/10" />
                <div className="h-3 w-16 rounded bg-white/5" />
                <div className="h-3 w-12 rounded bg-white/5" />
              </div>
              <div className="mb-2 h-4 w-3/4 rounded bg-white/5" />
              <div className="h-1 w-1/2 rounded-full bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Content (클라이언트 컴포넌트, motion 사용) ──

export function SimilarCasesContent({ cases }: { cases: SimilarCase[] }) {
  if (cases.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      <div className="rounded-[1.5rem] bg-white/[0.02] p-[1px] ring-1 ring-white/5">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#0c0c10] p-6 md:p-8">
          <span className="mb-6 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/75 uppercase">
            같은 카테고리 사건
          </span>

          <div className="space-y-3">
            {cases.map((c, i) => {
              const config = CATEGORY_MAP[c.category];
              const colors = CAMP_COLORS[c.camp];
              const similarityPct = Math.round(c.similarity * 100);

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
                >
                  <Link
                    href={`/issues/${c.representative_issue_id}`}
                    className="group block rounded-xl bg-white/[0.02] p-4 transition-colors duration-300 hover:bg-white/[0.04]"
                  >
                    {/* 상단: 진영 + 카테고리 + 단계 */}
                    <div className="mb-2 flex items-center gap-2">
                      <div
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: colors.primary }}
                      />
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-medium uppercase"
                        style={{
                          backgroundColor: `${colors.primary}0d`,
                          color: `${colors.glow}99`,
                        }}
                      >
                        {config?.label}
                      </span>
                      {c.criminal_stage && (c.criminal_stage in CRIMINAL_STAGE_LABEL) && (
                        <span className="text-[9px] text-red-400/40">
                          {CRIMINAL_STAGE_LABEL[c.criminal_stage as CriminalStage]}
                        </span>
                      )}
                      {c.actor_name && (
                        <span className="ml-auto text-[10px] text-white/40">
                          {c.actor_name}
                        </span>
                      )}
                    </div>

                    {/* 요약 */}
                    <p className="mb-3 line-clamp-2 text-[13px] leading-snug text-white/60 transition-colors duration-300 group-hover:text-white/80">
                      {c.summary || config?.label}
                    </p>

                    {/* 유사도 바 */}
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-white/15 transition-all duration-500"
                          style={{ width: `${similarityPct}%` }}
                        />
                      </div>
                      <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/30">
                        {similarityPct}%
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* 면책 문구 */}
          <p className="mt-4 text-[11px] text-white/20">
            ※ 사건의 세부 맥락은 다를 수 있습니다
          </p>
        </div>
      </div>
    </motion.div>
  );
}
