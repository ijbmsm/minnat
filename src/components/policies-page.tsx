"use client";

import { Nav } from "./nav";
import { IssueCard } from "./issue-card";
import { MOCK_ISSUES } from "@/lib/mock-data";

export function PoliciesPage() {
  const controversial = MOCK_ISSUES.filter((i) => i.category === "controversial");

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-4 pt-24 pb-20">
        <h1 className="mb-2 text-3xl font-bold">논란 정책</h1>
        <p className="mb-8 max-w-xl text-sm leading-relaxed text-white/40">
          가치 판단이 갈리는 정책입니다. 스코어보드 점수에 반영되지 않으며,
          정책 내용과 객관적 수치만 제공합니다.
        </p>

        <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-400/70">
            성매매 피해자 지원금, 민생지원금, 여성 취업 지원금 등 — 사람마다 긍정/부정 평가가
            갈리는 정책은 AI나 관리자가 점수를 매기지 않습니다. 정책 결과가 측정 가능해지면
            정책 성공/실패로 재분류됩니다.
          </p>
        </div>

        {controversial.length === 0 ? (
          <div className="rounded-xl border border-white/5 py-16 text-center text-white/30">
            현재 논란 정책 이슈가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {controversial.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
