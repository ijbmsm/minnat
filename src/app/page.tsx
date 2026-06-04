import Link from "next/link";
import { Nav } from "@/components/nav";

export const metadata = {
  title: "술자리",
  description: "술자리에서 나누는 두 가지 주제 — 정치 팩트체크와 사주팔자",
};

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main className="flex min-h-dvh flex-col items-center justify-center px-4 pb-16">

        <div className="mb-14 text-center">
          <h1
            className="text-6xl font-bold text-white tracking-tight"
            style={{ fontFamily: "'Shilla Culture', serif", WebkitTextStroke: "0.5px currentColor" }}
          >
            술자리
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-[400px]">
          {[
            { href: "/politics", label: "정치" },
            { href: "/saju",     label: "사주" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] min-h-[160px] transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.045]"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative text-2xl font-semibold text-white/80 group-hover:text-white tracking-tight transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>

      </main>
    </>
  );
}
