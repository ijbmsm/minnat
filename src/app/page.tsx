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
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 pb-20">

        {/* 로고 */}
        <div className="mb-2 text-center">
          <h1
            className="text-6xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Shilla Culture', serif", WebkitTextStroke: "0.5px currentColor" }}
          >
            술자리
          </h1>
          <p className="mt-3 text-sm text-white/35">나눌 거리가 넘치는 두 가지 주제</p>
        </div>

        {/* 섹션 카드 */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">

          {/* 정치 */}
          <Link
            href="/politics"
            className="group relative flex flex-col justify-between rounded-3xl border border-white/8 bg-white/[0.02] p-7 min-h-[200px] hover:border-white/18 hover:bg-white/[0.05] transition-all duration-200"
          >
            <div>
              <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase mb-4">정치</p>
              <p className="text-2xl font-bold text-white leading-tight">
                팩트로 보는<br />대한민국 정치
              </p>
            </div>
            <div className="mt-6">
              <p className="text-xs text-white/35 leading-relaxed">
                스코어보드 · 이슈 타임라인 · 정치인 기록
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-white/40 group-hover:text-white/70 transition-colors">
                <span>입장하기</span>
                <span className="translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          {/* 사주 */}
          <Link
            href="/saju"
            className="group relative flex flex-col justify-between rounded-3xl border border-white/8 bg-white/[0.02] p-7 min-h-[200px] hover:border-white/18 hover:bg-white/[0.05] transition-all duration-200"
          >
            <div>
              <p className="text-[10px] tracking-[0.25em] text-white/30 uppercase mb-4">사주</p>
              <p className="text-2xl font-bold text-white leading-tight">
                AI로 보는<br />내 사주팔자
              </p>
            </div>
            <div className="mt-6">
              <p className="text-xs text-white/35 leading-relaxed">
                종합 · 연애운 · 직업·재물운
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-white/40 group-hover:text-white/70 transition-colors">
                <span>입장하기</span>
                <span className="translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>

      </main>
    </>
  );
}
