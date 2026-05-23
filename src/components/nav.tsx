"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "스코어보드" },
  { href: "/issues", label: "이슈" },
  { href: "/explore", label: "탐색" },
  { href: "/politicians", label: "정치인" },
  { href: "/board", label: "게시판" },
  { href: "/about", label: "방법론" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-white/90 transition-colors hover:text-white"
          style={{ fontFamily: "'Shilla Culture', serif", WebkitTextStroke: "0.5px currentColor" }}
        >
          민낯
        </Link>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
