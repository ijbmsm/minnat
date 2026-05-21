"use client";

import { Nav } from "@/components/nav";
import Link from "next/link";

export default function WritePage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pt-24 pb-20">
        <Link
          href="/board"
          className="mb-6 inline-block text-sm text-white/40 transition-colors hover:text-white/60"
        >
          &larr; 게시판
        </Link>

        <h1 className="mb-8 text-2xl font-bold">글 작성</h1>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-white/50">제목</label>
            <input
              type="text"
              placeholder="제목을 입력하세요"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/80 outline-none placeholder:text-white/20 focus:border-white/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-white/50">내용</label>
            <textarea
              placeholder="내용을 입력하세요"
              rows={12}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-white/80 outline-none placeholder:text-white/20 focus:border-white/20"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Link
              href="/board"
              className="rounded-lg border border-white/10 px-5 py-2 text-sm text-white/40"
            >
              취소
            </Link>
            <button
              onClick={() => alert("로그인 후 이용 가능합니다.")}
              className="rounded-lg bg-white/10 px-5 py-2 text-sm text-white/70 transition-colors hover:bg-white/15"
            >
              등록
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
