"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase/client";
import { CAMP_COLORS } from "@/lib/constants";
import type { BoardPost, DisplayCamp } from "@/types";
import Link from "next/link";

const CAMP_BAR_COLOR: Record<DisplayCamp, string> = {
  red: CAMP_COLORS.red.primary,
  blue: CAMP_COLORS.blue.primary,
  free: "#555",
};

const CAMP_LABEL: Record<DisplayCamp, string> = {
  red: "국민의힘", blue: "더불어민주당", free: "자유",
};

export default function BoardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<BoardPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/board/${params.id}`).then(async (res) => {
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setPost(data.post);
      setLikeCount(data.post.like_count);
      setLoading(false);
    });

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase
        .from("board_likes")
        .select("user_id")
        .eq("user_id", user.id)
        .eq("post_id", params.id)
        .single()
        .then(({ data }) => { if (data) setLiked(true); });
    });
  }, [params.id]);

  useEffect(() => {
    if (post && userId) setIsOwner(post.user_id === userId);
  }, [post, userId]);

  async function handleLike() {
    if (!userId) {
      router.push(`/auth/login?next=/board/${params.id}`);
      return;
    }
    const res = await fetch(`/api/board/${params.id}/like`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setLiked(data.liked);
      setLikeCount((prev) => prev + (data.liked ? 1 : -1));
    }
  }

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/board/${params.id}`, { method: "DELETE" });
    if (res.ok) router.push("/board");
  }

  if (loading) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-3xl px-6 pt-24 pb-20">
          <div className="mb-6 h-5 w-20 animate-pulse rounded bg-white/[0.03]" />
          <div className="h-10 w-2/3 animate-pulse rounded-lg bg-white/[0.03]" />
          <div className="mt-6 h-72 animate-pulse rounded-2xl bg-white/[0.02]" />
        </main>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Nav />
        <main className="flex min-h-[80dvh] flex-col items-center justify-center pt-14">
          <div className="mb-3 text-3xl opacity-15">&#128683;</div>
          <p className="text-sm text-white/40">게시글을 찾을 수 없습니다</p>
          <Link href="/board" className="mt-4 rounded-full bg-white/[0.06] px-5 py-2 text-sm text-white/50 hover:bg-white/[0.1]">
            게시판으로 돌아가기
          </Link>
        </main>
      </>
    );
  }

  const barColor = CAMP_BAR_COLOR[post.camp];
  const dateStr = new Date(post.created_at).toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-6 pt-24 pb-20 md:px-8">
        <Link href="/board" className="mb-8 inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/60">
          <span>&larr;</span><span>게시판</span>
        </Link>

        {/* 카드 래퍼 */}
        <article className="relative overflow-hidden rounded-3xl bg-white/[0.02] ring-1 ring-white/5">
          {/* 상단 컬러 바 */}
          <div className="h-1" style={{ background: `linear-gradient(to right, ${barColor}, transparent)` }} />

          <div className="p-6 md:p-8">
            {/* 메타 */}
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-white/35">
              <span style={{ color: `${barColor}bb` }} className="font-medium">{CAMP_LABEL[post.camp]}</span>
              <span className="text-white/10">&middot;</span>
              <span>익명</span>
              <span className="text-white/10">&middot;</span>
              <span>{dateStr}</span>
              <span className="text-white/10">&middot;</span>
              <span>조회 {post.view_count}</span>
            </div>

            {/* 제목 */}
            <h1 className="mb-8 text-2xl font-bold tracking-tight text-white/90 leading-snug">
              {post.title}
            </h1>

            {/* 구분선 */}
            <div className="mb-8 h-px bg-gradient-to-r from-white/5 via-white/10 to-white/5" />

            {/* 본문 */}
            <div className="mb-8 min-h-[120px]">
              <p className="whitespace-pre-wrap text-[15px] leading-[1.8] text-white/65">
                {post.content}
              </p>
            </div>

            {/* 구분선 */}
            <div className="mb-6 h-px bg-gradient-to-r from-white/5 via-white/10 to-white/5" />

            {/* 하단 액션 */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleLike}
                className={`group flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-medium transition-all duration-200 ${
                  liked
                    ? "bg-red-500/15 text-red-400/80 shadow-[0_0_16px_rgba(239,68,68,0.08)]"
                    : "bg-white/[0.04] text-white/45 hover:bg-white/[0.08] hover:text-white/65"
                }`}
              >
                <span className={`text-base transition-transform duration-200 ${liked ? "scale-110" : "group-hover:scale-105"}`}>
                  {liked ? "&#9829;" : "&#9825;"}
                </span>
                추천
                <span className="tabular-nums">{likeCount}</span>
              </button>

              {isOwner && (
                <button
                  onClick={handleDelete}
                  className="rounded-lg px-4 py-2 text-xs text-white/25 transition-colors hover:text-red-400/60"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
