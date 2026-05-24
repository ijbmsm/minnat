import Link from "next/link";
import { Nav } from "@/components/nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="flex min-h-[80dvh] flex-col items-center justify-center px-4">
        <h1 className="mb-2 text-6xl font-bold tabular-nums text-white/20">404</h1>
        <p className="mb-6 text-sm text-white/40">페이지를 찾을 수 없습니다.</p>
        <Link
          href="/"
          className="rounded-lg border border-white/10 px-5 py-2 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white/80"
        >
          스코어보드로 돌아가기
        </Link>
      </main>
    </>
  );
}
