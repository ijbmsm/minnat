"use client";

import Link from "next/link";
import type { SimilarCase, CriminalStage } from "@/types";
import { CATEGORY_MAP, CAMP_COLORS, CRIMINAL_STAGE_LABEL } from "@/lib/constants";

// 상세 페이지와 같은 토큰. 중첩 카드를 걷어내고 구분선 리스트로 둔다.
const CAMP_DOT: Record<string, string> = { blue: "#3b82f6", red: "#ef4444" };
const CAMP_TEXT: Record<string, string> = { blue: "#7aa7ff", red: "#ff8a8a" };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 text-[11px] font-bold tracking-[0.14em] text-[#6f6f6f]">{children}</p>;
}

// ── Skeleton ──

export function SimilarCasesSkeleton() {
  return (
    <div>
      <SectionLabel>같은 카테고리 사건</SectionLabel>
      <div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse border-b border-[#18181b] py-4">
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#242424]" />
              <span className="h-3 w-16 rounded bg-[#1c1c1f]" />
            </div>
            <span className="block h-4 w-3/4 rounded bg-[#1c1c1f]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Content ──

export function SimilarCasesContent({ cases }: { cases: SimilarCase[] }) {
  if (cases.length === 0) return null;

  return (
    <div>
      <SectionLabel>같은 카테고리 사건</SectionLabel>

      <div>
        {cases.map((c) => {
          const config = CATEGORY_MAP[c.category];
          // 임베딩이 비어 있으면 RPC 가 similarity 로 NaN 을 돌려준다 (Postgres 는 NaN 을
          // 최대값으로 취급해 threshold 도 통과한다). 숫자가 아니면 아예 표시하지 않는다.
          const sim = Number(c.similarity);
          const similarityPct = Number.isFinite(sim) ? Math.round(sim * 100) : null;
          const dot = CAMP_DOT[c.camp] ?? "#4a4a4a";
          const text = CAMP_TEXT[c.camp] ?? "#a8a8a8";

          return (
            <Link
              key={c.id}
              href={`/issues/${c.representative_issue_id}`}
              className="group block border-b border-[#18181b] py-4 transition-opacity hover:opacity-75"
            >
              <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: dot }} />
                <span className="text-xs font-semibold" style={{ color: text }}>
                  {CAMP_COLORS[c.camp as "blue" | "red"]?.label ?? "무관"}
                </span>
                <span aria-hidden className="h-[3px] w-[3px] rounded-full bg-[#3a3a3a]" />
                <span className="text-xs text-[#8a8a8a]">{config?.label}</span>
                {c.criminal_stage && c.criminal_stage in CRIMINAL_STAGE_LABEL && (
                  <span className="text-xs text-[#ff8a8a]">
                    {CRIMINAL_STAGE_LABEL[c.criminal_stage as CriminalStage]}
                  </span>
                )}
                {c.actor_name && <span className="text-xs text-[#6f6f6f]">{c.actor_name}</span>}
                {similarityPct !== null && (
                  <span className="ml-auto shrink-0 text-xs tabular-nums text-[#5f5f5f]">유사도 {similarityPct}%</span>
                )}
              </div>

              <p className="m-0 line-clamp-2 max-w-[62ch] text-[15px] leading-[1.6] text-[#d4d4d4]">
                {c.summary || config?.label}
              </p>
            </Link>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-[#5f5f5f]">※ 사건의 세부 맥락은 다를 수 있습니다</p>
    </div>
  );
}
