import Link from "next/link";
import { Nav } from "@/components/nav";

export const metadata = {
  // 루트 page 에는 layout 의 title.template 이 적용되지 않는다 — 여기서 완성된 제목을 준다
  title: "술자리 — 정치 팩트체크 · 무료 사주팔자",
  description: "술자리에서 나누는 두 가지 주제 — 정치 팩트체크와 사주팔자",
  alternates: { canonical: "https://drinkplace.kr" },
};

const CARDS = [
  {
    href:  "/politics",
    label: "정치",
    glow:  "radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.04) 0%, transparent 60%)",
  },
  {
    href:  "/saju",
    label: "사주",
    glow:  "radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.04) 0%, transparent 60%)",
  },
];

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 pb-16">

        {/* 로고 */}
        <div className="mb-16 text-center">
          <h1
            className="text-6xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Shilla Culture', serif", WebkitTextStroke: "0.5px currentColor" }}
          >
            술자리
          </h1>
        </div>

        {/* 카드 */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-[440px]">
          {CARDS.map(({ href, label, glow }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] p-7 min-h-[220px] transition-all duration-300 hover:border-white/[0.16]"
              style={{ background: `${glow}, rgba(255,255,255,0.018)` }}
            >
              {/* 상단 광택 */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              {/* hover 내부 밝기 */}
              <div className="pointer-events-none absolute inset-0 bg-white/[0.015] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* 타이틀 — 카드 중앙 */}
              <div className="relative flex flex-1 items-center justify-center">
                <p
                  className="text-5xl font-bold tracking-tight text-white"
                  style={{ fontFamily: "'Shilla Culture', serif", WebkitTextStroke: "0.5px currentColor" }}
                >
                  {label}
                </p>
              </div>

            </Link>
          ))}
        </div>

      </main>
    </>
  );
}
