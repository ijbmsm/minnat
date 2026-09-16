import { notFound } from "next/navigation";
import { Nav } from "@/components/nav";
import { SajuPage } from "@/components/saju-page";
import type { ReadingType } from "@/components/saju-page";
import { createClient } from "@/lib/supabase/server";

const TYPE_META: Record<ReadingType, { title: string; description: string }> = {
  full:   { title: "종합 풀이 · 술자리",   description: "성격부터 올해 세운까지. 사주팔자 종합 풀이." },
  today:  { title: "오늘의 사주 · 술자리", description: "오늘 일진으로 보는 하루 에너지 흐름." },
  love:   { title: "연애운 · 술자리",      description: "내 연애 패턴과 잘 맞는 상대 유형." },
  career: { title: "직업·재물운 · 술자리", description: "격국·용신으로 보는 어울리는 일과 재물 성향." },
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const meta = TYPE_META[type as ReadingType];
  if (!meta) return {};
  return { title: meta.title, description: meta.description };
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
      <SajuPage fixedType={type as ReadingType} loggedIn={!!user} />
    </>
  );
}
