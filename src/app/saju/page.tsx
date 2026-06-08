import { Nav } from "@/components/nav";
import { SajuHistory } from "@/components/saju-history";
import { SajuCards } from "@/components/saju-cards";
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
          <SajuCards />
        </div>

        {/* 최근 열람 히스토리 — 카드 아래, 스크롤 가능 */}
        <SajuHistory />

      </main>
    </>
  );
}
