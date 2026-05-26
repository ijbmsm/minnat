"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { CAMP_COLORS } from "@/lib/constants";
import type { BoardPost, DisplayCamp } from "@/types";

const TABS: { value: string; label: string; color?: string }[] = [
  { value: "all", label: "전체" },
  { value: "red", label: "국민의힘", color: CAMP_COLORS.red.primary },
  { value: "blue", label: "더불어민주당", color: CAMP_COLORS.blue.primary },
  { value: "free", label: "자유" },
  { value: "popular", label: "인기" },
];

const CAMP_BAR_COLOR: Record<DisplayCamp, string> = {
  red: CAMP_COLORS.red.primary,
  blue: CAMP_COLORS.blue.primary,
  free: "#555",
};

const CAMP_LABEL: Record<DisplayCamp, string> = {
  red: "국민의힘", blue: "더불어민주당", free: "자유",
};

function formatDate(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function BoardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("camp") ?? searchParams.get("tab") ?? "all";

  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams();
    if (tab === "popular") params.set("popular", "true");
    else if (tab !== "all") params.set("camp", tab);
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/board?${params}`);
    return res.json();
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    fetchPosts().then((data) => {
      setPosts(data.posts ?? []);
      setNextCursor(data.nextCursor ?? null);
      setLoading(false);
    });
  }, [fetchPosts]);

  async function loadMore() {
    if (!nextCursor) return;
    const data = await fetchPosts(nextCursor);
    setPosts((prev) => [...prev, ...(data.posts ?? [])]);
    setNextCursor(data.nextCursor ?? null);
  }

  function setTab(value: string) {
    if (value === "all") router.push("/board");
    else if (value === "popular") router.push("/board?tab=popular");
    else router.push(`/board?camp=${value}`);
  }

  return (
    <>
      {/* 탭 — pill 스타일 */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-white/[0.12] text-white shadow-[0_0_12px_rgba(255,255,255,0.04)]"
                  : "text-white/40 hover:text-white/65 hover:bg-white/[0.04]"
              }`}
            >
              {t.color && active && (
                <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full" style={{ backgroundColor: t.color }} />
              )}
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 글 목록 */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.02]" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/[0.02] py-20 ring-1 ring-white/5">
          <div className="mb-3 text-3xl opacity-20">&#9998;</div>
          <p className="text-sm text-white/35">아직 게시글이 없습니다</p>
          <Link
            href="/board/write"
            className="mt-4 rounded-full bg-white/[0.08] px-5 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.12]"
          >
            첫 번째 글 작성하기
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const barColor = CAMP_BAR_COLOR[post.camp];
            return (
              <Link
                key={post.id}
                href={`/board/${post.id}`}
                className="group relative block overflow-hidden rounded-2xl bg-white/[0.02] transition-all duration-200 hover:bg-white/[0.05] hover:shadow-[0_2px_20px_rgba(0,0,0,0.3)]"
              >
                {/* 진영 컬러 바 (좌측) */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                  style={{ backgroundColor: barColor }}
                />

                <div className="flex items-center gap-4 py-4 pl-5 pr-4">
                  {/* 메인 콘텐츠 */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-white/75 transition-colors group-hover:text-white/90">
                      {post.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2.5 text-[11px] text-white/30">
                      <span style={{ color: `${barColor}99` }}>{CAMP_LABEL[post.camp]}</span>
                      <span className="text-white/10">&middot;</span>
                      <span>익명</span>
                      <span className="text-white/10">&middot;</span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>

                  {/* 우측 메타 */}
                  <div className="flex shrink-0 items-center gap-4">
                    {post.like_count > 0 && (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold tabular-nums text-red-400/60">{post.like_count}</span>
                        <span className="text-[9px] text-white/15">추천</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center">
                      <span className="text-xs tabular-nums text-white/25">{post.view_count}</span>
                      <span className="text-[9px] text-white/15">조회</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {nextCursor && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            className="rounded-full bg-white/[0.05] px-8 py-2.5 text-sm text-white/45 transition-all hover:bg-white/[0.08] hover:text-white/65"
          >
            더 보기
          </button>
        </div>
      )}
    </>
  );
}

export default function BoardPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pt-24 pb-20 md:px-8">
        {/* 헤더 */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="mb-2 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/30 uppercase">
              커뮤니티
            </span>
            <h1 className="text-3xl font-bold tracking-tight">게시판</h1>
          </div>
          <Link
            href="/board/write"
            className="rounded-full bg-white/[0.08] px-5 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/[0.12] hover:text-white/90 hover:shadow-[0_0_16px_rgba(255,255,255,0.03)]"
          >
            글쓰기
          </Link>
        </div>

        <Suspense fallback={
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/[0.02]" />
            ))}
          </div>
        }>
          <BoardContent />
        </Suspense>
      </main>
    </>
  );
}
