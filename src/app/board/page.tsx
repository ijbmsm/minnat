import { Nav } from "@/components/nav";
import Link from "next/link";

export const metadata = {
  title: "자유게시판 — 민낯",
  description: "정치에 대해 자유롭게 토론하는 공간",
};

export default function BoardPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-4 pt-24 pb-20">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">자유게시판</h1>
            <p className="mt-1 text-sm text-white/40">
              정치에 대해 자유롭게 토론하는 공간
            </p>
          </div>
          <Link
            href="/board/write"
            className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            글 작성
          </Link>
        </div>

        {/* 게시글 목록 — Phase 3에서 Supabase 연동 */}
        <div className="rounded-xl border border-white/5 py-16 text-center text-white/30">
          <p className="mb-2">게시판은 준비 중입니다.</p>
          <p className="text-xs text-white/20">
            카카오 로그인 후 글을 작성할 수 있습니다.
          </p>
          <Link
            href="/auth/login"
            className="mt-4 inline-block rounded-lg border border-white/10 px-4 py-2 text-xs text-white/40 transition-colors hover:border-white/20 hover:text-white/60"
          >
            로그인
          </Link>
        </div>
      </main>
    </>
  );
}
