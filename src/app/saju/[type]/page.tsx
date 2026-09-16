import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { SajuPage } from "@/components/saju-page";
import type { ReadingType } from "@/components/saju-page";
import { createClient } from "@/lib/supabase/server";

// title 에 "술자리" 를 넣지 않는다 — 루트 layout 의 template 이 "%s — 술자리" 로 붙인다.
const TYPE_META: Record<ReadingType, { title: string; description: string; keywords: string[] }> = {
  full: {
    title: "무료 사주팔자 종합 풀이",
    description: "생년월일시만 넣으면 사주 여덟 글자·오행·대운이 바로. 성격부터 올해 세운까지 전통 명리학 기반 AI 종합 풀이.",
    keywords: ["무료 사주", "사주팔자", "사주 풀이", "종합 사주", "만세력", "AI 사주"],
  },
  today: {
    title: "오늘의 사주 · 오늘 운세",
    description: "오늘 일진과 내 사주가 만나는 지점. 오늘 집중할 것과 조심할 것을 하루 한 장으로.",
    keywords: ["오늘의 운세", "오늘 사주", "일진", "오늘 운세 무료", "데일리 운세"],
  },
  love: {
    title: "연애운 사주 · 내 인연 시기",
    description: "배우자궁·도화·식상으로 보는 내 연애 패턴, 잘 맞는 상대 유형, 인연이 들어오는 시기.",
    keywords: ["연애운", "연애운 사주", "인연 시기", "결혼운", "궁합 사주", "배우자운"],
  },
  career: {
    title: "직업운·재물운 사주",
    description: "격국과 용신으로 보는 어울리는 직업군, 직장인과 사업가 적합도, 재물이 들어오는 시기.",
    keywords: ["직업운", "재물운", "적성 사주", "이직 운", "창업 운", "사주 직업"],
  },
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const meta = TYPE_META[type as ReadingType];
  if (!meta) return {};
  const url = `https://drinkplace.kr/saju/${type}`;
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: url },
    openGraph: { title: meta.title, description: meta.description, url, type: "website" as const },
  };
}

/**
 * 비로그인도 폼과 원국 미리보기까지 본다 (플랜 P1-1). AI 풀이부터 로그인.
 * 로그인 여부는 서버에서 한 번 읽어 내려보내 클라이언트 깜빡임을 없앤다.
 */
export default async function SajuTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!["full", "today", "love", "career"].includes(type)) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <Nav />
      {/* SajuPage 가 useSearchParams 로 결과 상태(?r=1)를 읽으므로 Suspense 경계가 필요하다 */}
      <Suspense fallback={null}>
        <SajuPage fixedType={type as ReadingType} loggedIn={!!user} />
      </Suspense>
    </>
  );
}
