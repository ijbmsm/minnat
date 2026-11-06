import Link from "next/link";
import { CampChip } from "@/components/camp-chip";
import { storyDuration } from "@/lib/story-format";
import type { StorylineSummary } from "@/types";

/** 사안 목록 카드 — 서버(첫 화면)와 클라이언트("더 보기") 양쪽에서 같은 모양으로 쓴다 */
export function StoryCard({ s }: { s: StorylineSummary }) {
  return (
    <Link
      href={`/stories/${s.slug}`}
      className="group rounded-2xl border border-[#1c1c1f] bg-[#0e0e10] px-5 py-5 transition-colors hover:border-[#2c2c31] hover:bg-[#131316]"
    >
      <div className="flex flex-wrap items-center gap-2.5 text-[12.5px]">
        <span className="inline-flex items-center gap-1.5 text-[#c8c8c8]">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: s.status === "ongoing" ? "#d3a24a" : "#6f6f6f" }}
          />
          {s.status === "ongoing" ? "진행중" : "종결"}
        </span>
        <span className="text-[#5f5f5f]">·</span>
        <span className="tabular-nums text-[#8a8a8a]">{storyDuration(s).label}</span>
        <span className="text-[#5f5f5f]">·</span>
        <span className="text-[#8a8a8a]">{s.status_label}</span>
        <span className="ml-auto"><CampChip camp={s.camp} /></span>
      </div>

      <h2 className="m-0 mt-3 text-[22px] font-bold tracking-[-0.02em] text-white transition-colors group-hover:text-white">
        {s.title}
      </h2>
      <p className="m-0 mt-2.5 text-[15px] leading-[1.75] text-[#8f8f8f] [text-wrap:pretty]">
        {s.blurb}
      </p>
      <p className="m-0 mt-3.5 text-[12.5px] text-[#5f5f5f]">
        {s.chapter_count}개 국면 · 근거 기사 {s.article_count}건
      </p>
    </Link>
  );
}
