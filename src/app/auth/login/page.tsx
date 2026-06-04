"use client";

import { Nav } from "@/components/nav";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const hasError = searchParams.get("error") === "true";

  const subtitle =
    next.startsWith("/saju")  ? "사주팔자를 보려면 로그인이 필요합니다" :
    next.startsWith("/board") ? "게시판에 참여하려면 로그인이 필요합니다" :
    "술자리에 참여하려면 로그인이 필요합니다";
  const [loading, setLoading] = useState(false);

  async function handleKakaoLogin() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        scopes: "account_email",
      },
    });
    if (error) {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-2 text-center text-2xl font-bold">로그인</h1>
      <p className="mb-8 text-center text-sm text-white/75">
        {subtitle}
      </p>

      {hasError && (
        <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-center text-sm text-red-400/70">
          로그인에 실패했습니다. 다시 시도해주세요.
        </div>
      )}

      <button
        onClick={handleKakaoLogin}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191919] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "로그인 중..." : "카카오로 시작하기"}
      </button>

      <p className="mt-6 text-center text-xs text-white/75">
        카카오 계정으로 간편하게 로그인할 수 있습니다
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Nav />
      <main className="flex min-h-[80dvh] flex-col items-center justify-center px-4 pt-14">
        <Suspense fallback={<div className="text-sm text-white/75">로딩...</div>}>
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}
