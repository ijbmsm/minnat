import Link from "next/link";
import { Nav } from "@/components/nav";

export const metadata = {
  title: "술자리",
  description: "술자리에서 나누는 두 가지 주제 — 정치 팩트체크와 사주팔자",
};

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 pb-16">

        {/* 로고 */}
        <div className="mb-14 text-center">
          <h1
            className="text-6xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Shilla Culture', serif", WebkitTextStroke: "0.5px currentColor" }}
          >
            술자리
          </h1>
          <p className="mt-3 text-sm text-white/30 tracking-wide">나눌 거리가 넘치는 두 가지 주제</p>
        </div>

        {/* 섹션 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[480px]">

          {/* 정치 */}
          <Link
            href="/politics"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-8 min-h-[240px] transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
          >
            {/* 상단 글로우 */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            {/* 배경 그라디언트 */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative">
              <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-5">정치</p>
              <p className="text-[26px] font-semibold text-white tracking-tight">
                정치
              </p>
            </div>

            <div className="relative mt-8">
              <p className="text-[11px] text-white/30 leading-relaxed tracking-wide mb-5">
                스코어보드 · 이슈 타임라인 · 정치인 기록
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/35 group-hover:text-white/60 transition-colors tracking-wide">입장하기</span>
                <span className="text-[11px] text-white/25 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all">→</span>
              </div>
            </div>
          </Link>

          {/* 사주 */}
          <Link
            href="/saju"
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-8 min-h-[240px] transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
          >
            {/* 상단 글로우 */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            {/* 배경 그라디언트 */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative">
              <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-5">사주</p>
              <p className="text-[26px] font-semibold text-white tracking-tight">
                사주
              </p>
            </div>

            <div className="relative mt-8">
              <p className="text-[11px] text-white/30 leading-relaxed tracking-wide mb-5">
                종합 · 연애운 · 직업·재물운
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-white/35 group-hover:text-white/60 transition-colors tracking-wide">입장하기</span>
                <span className="text-[11px] text-white/25 group-hover:text-white/50 group-hover:translate-x-0.5 transition-all">→</span>
              </div>
            </div>
          </Link>

        </div>
      </main>
    </>
  );
}
