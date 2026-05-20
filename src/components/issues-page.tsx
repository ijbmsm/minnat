"use client";

import { useState } from "react";
import { Nav } from "./nav";
import { IssueCard } from "./issue-card";
import { IssueFilter, type FilterState } from "./issue-filter";
import { MOCK_ISSUES } from "@/lib/mock-data";
import { calculateIssueScore } from "@/lib/score";

export function IssuesPage() {
  const [filters, setFilters] = useState<FilterState>({
    camp: "all",
    category: "all",
    sort: "latest",
  });

  const filtered = MOCK_ISSUES
    .filter((issue) => {
      if (filters.camp !== "all" && issue.camp !== filters.camp) return false;
      if (filters.category !== "all" && issue.category !== filters.category) return false;
      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "score") {
        return calculateIssueScore(b) - calculateIssueScore(a);
      }
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-4 pt-24 pb-20">
        <h1 className="mb-2 text-3xl font-bold">이슈 목록</h1>
        <p className="mb-8 text-sm text-white/40">
          공신력 있는 출처에서 수집된 정치 이슈
        </p>

        <div className="mb-8">
          <IssueFilter onFilterChange={setFilters} />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-white/5 py-16 text-center text-white/30">
            해당 조건의 이슈가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
