"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/",            label: "스코어보드" },
  { href: "/issues",      label: "이슈" },
  { href: "/explore",     label: "탐색" },
  { href: "/politicians", label: "정치인" },
  { href: "/report",      label: "제보" },
] as const;

const POLITICS_PREFIXES = ["/issues", "/explore", "/politicians", "/report"];

function isPoliticsPath(p: string) {
  if (p === "/") return true;
  return POLITICS_PREFIXES.some(prefix => p.startsWith(prefix));
}

export function PoliticsSubNav() {
  const pathname = usePathname();
  if (!isPoliticsPath(pathname)) return null;

  return (
    <div className="fixed top-14 z-40 w-full border-b border-white/[0.04] bg-[#0a0a0c]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-10 max-w-6xl items-center gap-0.5 px-4 overflow-x-auto scrollbar-none">
        {ITEMS.map(({ href, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`shrink-0 rounded-md px-3 py-1 text-[12px] transition-colors ${
                isActive
                  ? "bg-white/8 text-white font-medium"
                  : "text-white/40 hover:text-white/75"
              }`}>
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
