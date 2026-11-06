"use client";

import { useState } from "react";
import { StoryCard } from "@/components/story-card";
import type { StorylineSummary } from "@/types";

const PAGE = 30;

/** 사안 목록 "더 보기" — 첫 화면 뒤의 사안을 /api/stories 에서 이어 받는다 */
export function StoryMore({ offset, total }: { offset: number; total: number }) {
  const [items, setItems] = useState<StorylineSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const shown = offset + items.length;

  async function more() {
    setLoading(true);
    try {
      const res = await fetch(`/api/stories?offset=${shown}&limit=${PAGE}`);
      if (res.ok) {
        const next = (await res.json()) as StorylineSummary[];
        setItems((prev) => [...prev, ...next]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {items.map((s) => <StoryCard key={s.slug} s={s} />)}
      {shown < total && (
        <button
          type="button"
          onClick={more}
          disabled={loading}
          className="mt-2 rounded-2xl border border-dashed border-[#2a2a2a] py-4 text-[14px] text-[#8a8a8a] transition-colors hover:border-[#3a3a44] hover:text-[#d4d4d4] disabled:opacity-60"
        >
          {loading ? "불러오는 중…" : `더 보기 (${total - shown}건 남음)`}
        </button>
      )}
    </>
  );
}
