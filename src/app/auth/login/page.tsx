"use client";

import { Nav } from "@/components/nav";
import Link from "next/link";

export default function LoginPage() {
  async function handleKakaoLogin() {
    // Phase 3: Supabase Auth + Kakao OAuth 연동
    alert("카카오 로그인은 준비 중입니다.");
  }

  return (
    <>
      <Nav />
      <main className="flex min-h-[80dvh] flex-col items-center justify-center px-4 pt-14">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-center text-2xl font-bold">로그인</h1>
          <p className="mb-8 text-center text-sm text-white/40">
            민낯 게시판에 참여하려면 로그인이 필요합니다
          </p>

          <button
            onClick={handleKakaoLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191919] transition-opacity hover:opacity-90"
          >
            카카오로 시작하기
          </button>

          <p className="mt-6 text-center text-xs text-white/25">
            계정이 없으신가요?{" "}
            <Link href="/auth/signup" className="text-white/50 hover:text-white/70">
              회원가입
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
