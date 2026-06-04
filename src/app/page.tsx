import Link from "next/link";
import { Nav } from "@/components/nav";

export const metadata = {
  title: "술자리",
  description: "술자리에서 나누는 두 가지 주제 — 정치 팩트체크와 사주팔자",
};

const CARDS = [
  {
    href:  "/politics",
    label: "정치",
    lines: ["진영 불문", "팩트로 얘기하자."],
    glow:  "radial-gradient(ellipse at 20% 0%, rgba(255,255,255,0.04) 0%, transparent 60%)",
  },
  {
    href:  "/saju",
    label: "사주",
    lines: ["나는 왜 이런가.", "사주에 다 있어."],
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
          <p className="mt-3 text-sm text-white/30">나눌 거리가 넘치는 두 가지 주제</p>
        </div>

        {/* 카드 */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-[440px]">
          {CARDS.map(({ href, label, lines, glow }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] p-7 min-h-[220px] transition-all duration-300 hover:border-white/[0.16]"
              style={{ background: `${glow}, rgba(255,255,255,0.018)` }}
            >
              {/* 상단 광택 */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              {/* hover 내부 밝기 */}
              <div className="pointer-events-none absolute inset-0 bg-white/[0.015] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* 섹션 레이블 */}
              <p className="relative text-xl font-semibold tracking-tight text-white/60">{label}</p>

              {/* 메인 카피 */}
              <div className="relative mt-auto">
                {lines.map((line, i) => (
                  <p
                    key={i}
                    className={`leading-tight font-semibold tracking-tight transition-colors duration-300 ${
                      i === 0
                        ? "text-[20px] text-white/50 group-hover:text-white/65"
                        : "text-[20px] text-white group-hover:text-white"
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </Link>
          ))}
        </div>

      </main>
    </>
  );
}
