import Link from "next/link";
import { Nav } from "@/components/nav";
import { SajuHistory } from "@/components/saju-history";
import { WebApplicationJsonLd, FaqPageJsonLd } from "@/components/json-ld";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "무료 사주팔자 AI 풀이 — 술자리",
  description: "생년월일시 입력 → 전통 명리학 기반 AI 사주 분석. 종합·연애운·직업운·오늘운세 무료 제공.",
  keywords: ["무료 사주", "사주팔자", "AI 사주", "오늘 운세", "연애운 사주", "직업운", "사주 풀이"],
  alternates: { canonical: "https://drinkplace.kr/saju" },
  openGraph: {
    title: "무료 사주팔자 AI 풀이 — 술자리",
    description: "전통 명리학 기반 AI 사주 분석. 무료.",
    url: "https://drinkplace.kr/saju",
  },
};

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

export default function SajuLandingPage() {
  return (
    <>
      <WebApplicationJsonLd
        name="술자리 사주"
        description="전통 명리학 기반 AI 사주팔자 풀이. 종합·연애운·직업운·오늘운세 무료 제공."
        url="https://drinkplace.kr/saju"
      />
      <FaqPageJsonLd
        items={[
          { question: "사주팔자란 무엇인가요?", answer: "사주팔자(四柱八字)는 태어난 연·월·일·시의 네 기둥(四柱)과 여덟 글자(八字)로 운명을 분석하는 한국 전통 명리학입니다." },
          { question: "무료로 사주를 볼 수 있나요?", answer: "네. 술자리 사주는 생년월일시를 입력하면 종합·연애운·직업운·오늘운세를 모두 무료로 제공합니다." },
          { question: "AI 사주 풀이는 어떻게 작동하나요?", answer: "전통 명리학 계산 엔진이 사주 4주를 계산하고, 일간 특성·대운·세운 등 정형 데이터를 AI에게 전달해 풀이를 생성합니다." },
          { question: "일주(日柱)란 무엇인가요?", answer: "일주는 태어난 날의 천간과 지지를 합친 두 글자입니다. 사주 명리에서 본인 자체를 나타내는 핵심 기둥입니다." },
          { question: "시간을 모르면 사주를 볼 수 있나요?", answer: "네. 태어난 시간을 모르는 경우에도 연·월·일 3주 기반으로 풀이를 받을 수 있습니다." },
        ]}
      />
      <Nav />
      <main className="flex min-h-dvh flex-col items-center px-4 pt-14 pb-16">

        {/* 헤더 + 카드: 히스토리 없으면 세로 중앙, 있으면 위에서 자연스럽게 흐름 */}
        <div className="flex flex-col items-center justify-center flex-1 w-full py-12">
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
            {CARDS.map(({ href, title, lines, span }) => (
              <Link
                key={href}
                href={href}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] p-5 min-h-[180px] transition-all duration-300 hover:border-white/[0.16]"
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
              </Link>
            ))}
          </div>
        </div>

        {/* 최근 열람 히스토리 — 카드 아래, 스크롤 가능 */}
        <SajuHistory />

      </main>
    </>
  );
}
