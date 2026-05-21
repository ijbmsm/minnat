"use client";

import { useState } from "react";
import { Nav } from "@/components/nav";
import type { UserCamp } from "@/types";

const CAMP_OPTIONS: { value: UserCamp; label: string; color: string }[] = [
  { value: "blue", label: "청 (진보)", color: "#2563eb" },
  { value: "red", label: "홍 (보수)", color: "#dc2626" },
  { value: "none", label: "없음 (무소속)", color: "#71717a" },
];

export default function SignupPage() {
  const [selectedCamp, setSelectedCamp] = useState<UserCamp>("none");

  async function handleSignup() {
    // Phase 3: Supabase Auth + 유저 프로필 생성
    alert("회원가입은 준비 중입니다.");
  }

  return (
    <>
      <Nav />
      <main className="flex min-h-[80dvh] flex-col items-center justify-center px-4 pt-14">
        <div className="w-full max-w-sm">
          <h1 className="mb-2 text-center text-2xl font-bold">회원가입</h1>
          <p className="mb-8 text-center text-sm text-white/40">
            진영을 선택하면 게시판에서 표시됩니다
          </p>

          {/* 진영 선택 */}
          <div className="mb-6">
            <p className="mb-3 text-sm text-white/50">나의 진영</p>
            <div className="flex gap-2">
              {CAMP_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedCamp(opt.value)}
                  className={`flex-1 rounded-xl border px-3 py-3 text-sm transition-colors ${
                    selectedCamp === opt.value
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/5 text-white/40 hover:border-white/10"
                  }`}
                >
                  <div
                    className="mx-auto mb-1.5 h-3 w-3 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSignup}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-3 text-sm font-semibold text-[#191919] transition-opacity hover:opacity-90"
          >
            카카오로 가입하기
          </button>
        </div>
      </main>
    </>
  );
}
