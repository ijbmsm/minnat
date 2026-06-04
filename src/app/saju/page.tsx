import Link from "next/link";
import { Nav } from "@/components/nav";
import { SajuHistory } from "@/components/saju-history";

export const metadata = {
  title: "사주 · 술자리",
  description: "나는 왜 이런가. 사주에 다 있어.",
};

const CARDS = [
  {
    href: "/saju/full",
    title: "종합 사주",
    lines: ["성격, 연애, 직업,", "올해 운세까지 전부."],
  },
  {
    href: "/saju/today",
    title: "오늘의 사주",
    lines: ["오늘 일진으로 보는", "하루 에너지 흐름."],
  },
  {
    href: "/saju/love",
    title: "연애운",
    lines: ["내 연애 패턴과", "잘 맞는 상대 유형."],
  },
  {
    href: "/saju/career",
    title: "직업·재물운",
    lines: ["어울리는 일의 방향과", "재물 성향."],
  },
];

export default function SajuLandingPage() {
  return (
    <>
      <Nav />
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 pb-16">

        {/* 헤더 */}
        <div className="mb-12 text-center">
          <h1
            className="text-5xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Shilla Culture', serif", WebkitTextStroke: "0.5px currentColor" }}
          >
            사주팔자
          </h1>
          <p className="mt-3 text-sm text-white/30">나는 왜 이런가.</p>
        </div>

        {/* 카드 */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-[420px]">
          {CARDS.map(({ href, title, lines }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] p-5 min-h-[180px] transition-all duration-300 hover:border-white/[0.16]"
              style={{ background: "rgba(255,255,255,0.018)" }}
            >
              {/* 상단 광택 */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              {/* hover 내부 밝기 */}
              <div className="pointer-events-none absolute inset-0 bg-white/[0.015] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* 타이틀 */}
              <div className="relative flex flex-1 items-center">
                <p className="text-lg font-bold tracking-tight text-white leading-tight">{title}</p>
              </div>

              {/* 설명 */}
              <div className="relative">
                {lines.map((line, i) => (
                  <p
                    key={i}
                    className="text-[13px] leading-snug text-white/40 group-hover:text-white/55 transition-colors duration-300"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* 최근 열람 히스토리 */}
        <SajuHistory />

      </main>
    </>
  );
}
