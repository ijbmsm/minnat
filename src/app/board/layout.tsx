import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "게시판",
  description: "술자리 게시판 — 정치 이슈에 대한 의견을 나누는 공간.",
  alternates: { canonical: "https://drinkplace.kr/board" },
};

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
