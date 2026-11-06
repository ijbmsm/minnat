import type { Metadata } from "next";

// 게시글 페이지는 클라이언트 컴포넌트라 metadata 를 못 내보낸다 — 레이아웃에서 noindex 를 건다.
// 본문을 브라우저에서 불러와 봇에게는 빈 화면이고, 없는 글도 200 이라 소프트 404 로 잡혔다.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function BoardPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
