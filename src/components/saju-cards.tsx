"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CARDS = [
  {
    href: "/saju/full",
    title: "종합 사주",
    lines: ["성격, 연애, 직업,", "올해 운세까지 전부."],
    span: false,
  },
  {
    href: "/saju/today",
    title: "오늘의 사주",
    lines: ["오늘 일진으로 보는", "하루 에너지 흐름."],
    span: false,
  },
  {
    href: "/saju/love",
    title: "연애운",
    lines: ["내 연애 패턴과", "잘 맞는 상대 유형."],
    span: false,
  },
  {
    href: "/saju/career",
    title: "직업·재물운",
    lines: ["어울리는 일의 방향과", "재물 성향."],
    span: false,
  },
  {
    href: "/saju/compat",
    title: "궁합",
    lines: ["두 사주로 보는 케미.", "끌리는 이유, 부딪히는 이유."],
    span: true,
  },
];

export function SajuCards() {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const handleClick = useCallback(
    async (href: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push(href);
      } else {
        setPendingHref(href);
      }
    },
    [router],
  );

  return (
    <>
      {/* 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-[420px]">
        {CARDS.map(({ href, title, lines, span }) => (
          <button
            key={href}
            onClick={() => handleClick(href)}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] p-5 min-h-[180px] text-left transition-all duration-300 hover:border-white/[0.16]"
            style={{ background: "rgba(255,255,255,0.018)", gridColumn: span ? "span 2" : undefined }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-white/[0.015] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex flex-1 items-center">
              <p className="text-lg font-bold tracking-tight text-white leading-tight">{title}</p>
            </div>
            <div className="relative">
              {lines.map((line, i) => (
                <p key={i} className="text-[13px] leading-snug text-white/40 group-hover:text-white/55 transition-colors duration-300">
                  {line}
                </p>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* 카드 하단 안내 */}
      <p className="mt-4 text-[11px] text-white/25 text-center">
        로그인 후 하루 4회 무료
      </p>

      {/* 로그인 유도 모달 */}
      {pendingHref && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4"
          onClick={() => setPendingHref(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-[420px] rounded-2xl border border-white/[0.08] p-6"
            style={{ background: "rgba(18,18,22,0.97)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <p className="text-base font-semibold text-white mb-1">로그인이 필요해요</p>
            <p className="text-[13px] text-white/45 mb-5">
              로그인하면 하루 4회 무료로 사주를 볼 수 있어요.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPendingHref(null)}
                className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-[13px] text-white/50 transition-colors hover:text-white/70"
              >
                취소
              </button>
              <button
                onClick={() => router.push(`/auth/login?next=${encodeURIComponent(pendingHref)}`)}
                className="flex-1 rounded-xl bg-white py-2.5 text-[13px] font-semibold text-black transition-opacity hover:opacity-90"
              >
                로그인하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
