"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase/client";
import { CAMP_COLORS } from "@/lib/constants";
import type { DisplayCamp } from "@/types";
import Link from "next/link";

const CAMP_OPTIONS: { value: DisplayCamp; label: string; color: string }[] = [
  { value: "red", label: "국민의힘", color: CAMP_COLORS.red.primary },
  { value: "blue", label: "더불어민주당", color: CAMP_COLORS.blue.primary },
  { value: "free", label: "자유", color: "#666" },
];

export default function BoardWritePage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [camp, setCamp] = useState<DisplayCamp | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [renderTs] = useState(Date.now);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthed(!!user);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!camp) { setError("게시판을 선택해주세요"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/board", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ camp, title, content, website: "", _ts: renderTs }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "글 등록에 실패했습니다");
      setLoading(false);
      return;
    }

    router.push(`/board/${data.id}`);
  }

  if (authed === null) {
    return (
      <>
        <Nav />
        <main className="flex min-h-[80dvh] items-center justify-center pt-14">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-white/40" />
        </main>
      </>
    );
  }

  if (!authed) {
    return (
      <>
        <Nav />
        <main className="flex min-h-[80dvh] flex-col items-center justify-center px-4 pt-14">
          <div className="rounded-3xl bg-white/[0.02] px-10 py-12 text-center ring-1 ring-white/5">
            <div className="mb-4 text-3xl opacity-20">&#128274;</div>
            <p className="mb-2 text-sm text-white/50">글을 작성하려면 로그인이 필요합니다</p>
            <p className="mb-6 text-xs text-white/25">카카오 계정으로 간편하게 시작하세요</p>
            <Link
              href="/auth/login?next=/board/write"
              className="inline-block rounded-full bg-[#FEE500] px-8 py-3 text-sm font-semibold text-[#191919] transition-opacity hover:opacity-90"
            >
              카카오로 로그인
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-2xl px-6 pt-24 pb-20 md:px-8">
        <Link href="/board" className="mb-8 inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/60">
          <span>&larr;</span><span>게시판</span>
        </Link>

        <div className="mb-10">
          <span className="mb-2 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/30 uppercase">
            새 글
          </span>
          <h1 className="text-3xl font-bold tracking-tight">글쓰기</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 게시판 선택 */}
          <div className="mb-8">
            <label className="mb-3 block text-sm font-medium text-white/50">게시판 선택</label>
            <div className="grid grid-cols-3 gap-3">
              {CAMP_OPTIONS.map((opt) => {
                const selected = camp === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCamp(opt.value)}
                    className={`relative overflow-hidden rounded-2xl py-4 text-center transition-all duration-200 ${
                      selected
                        ? "bg-white/[0.08] border border-white/15"
                        : "bg-white/[0.02] border border-white/5 hover:bg-white/[0.05]"
                    }`}
                  >
                    {/* 상단 컬러 바 */}
                    {selected && (
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: opt.color }} />
                    )}
                    <p
                      className="text-sm font-semibold"
                      style={{ color: selected ? opt.color : "rgba(255,255,255,0.5)" }}
                    >
                      {opt.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 제목 */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-white/50">제목</label>
            <input
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="w-full rounded-2xl bg-white/[0.03] px-5 py-4 text-[15px] text-white/85 border border-white/5 placeholder:text-white/20 focus:outline-none focus:border-white/15 transition-colors"
            />
            <p className="mt-1.5 text-right text-[11px] text-white/20">{title.length}/100</p>
          </div>

          {/* 내용 */}
          <div className="mb-8">
            <label className="mb-2 block text-sm font-medium text-white/50">내용</label>
            <textarea
              required
              rows={12}
              maxLength={5000}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요 (최소 10자)"
              className="w-full resize-none rounded-2xl bg-white/[0.03] px-5 py-4 text-[15px] leading-[1.8] text-white/85 border border-white/5 placeholder:text-white/20 focus:outline-none focus:border-white/15 transition-colors"
            />
            <p className="mt-1.5 text-right text-[11px] text-white/20">{content.length}/5000</p>
          </div>

          {/* Honeypot */}
          <input name="website" type="text" tabIndex={-1} autoComplete="off" className="hidden" />

          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400/80">
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <Link
              href="/board"
              className="flex-1 rounded-2xl border border-white/8 py-3.5 text-center text-sm text-white/45 transition-colors hover:border-white/15 hover:text-white/60"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading || !camp}
              className="flex-1 rounded-2xl bg-white/[0.1] py-3.5 text-sm font-semibold text-white/80 transition-all hover:bg-white/[0.15] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
