"use client";

import { useState } from "react";
import type { Camp, IssueCategory } from "@/types";
import { CATEGORIES, CAMP_COLORS } from "@/lib/constants";

interface IssueFilterProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  camp: Camp | "all";
  category: IssueCategory | "all";
  sort: "latest" | "score";
}

export function IssueFilter({ onFilterChange }: IssueFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    camp: "all",
    category: "all",
    sort: "latest",
  });

  function update(partial: Partial<FilterState>) {
    const next = { ...filters, ...partial };
    setFilters(next);
    onFilterChange(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 진영 필터 */}
      <div className="flex rounded-lg border border-white/10 p-0.5">
        {([
          { value: "all" as const, label: "전체" },
          { value: "blue" as const, label: "파랑" },
          { value: "red" as const, label: "빨강" },
        ] as const).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => update({ camp: value })}
            className={`rounded-md px-3 py-1 text-xs transition-colors ${
              filters.camp === value
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 카테고리 필터 */}
      <select
        value={filters.category}
        onChange={(e) => update({ category: e.target.value as IssueCategory | "all" })}
        className="rounded-lg border border-white/10 bg-transparent px-3 py-1.5 text-xs text-white/70 outline-none"
      >
        <option value="all" className="bg-[#0a0a0c]">전체 카테고리</option>
        {CATEGORIES.map((cat) => (
          <option key={cat.key} value={cat.key} className="bg-[#0a0a0c]">
            {cat.label}
          </option>
        ))}
      </select>

      {/* 정렬 */}
      <div className="flex rounded-lg border border-white/10 p-0.5">
        {([
          { value: "latest" as const, label: "최신순" },
          { value: "score" as const, label: "점수순" },
        ] as const).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => update({ sort: value })}
            className={`rounded-md px-3 py-1 text-xs transition-colors ${
              filters.sort === value
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
