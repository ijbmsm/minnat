"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { DisplayCamp } from "@/types";

const NAV_ITEMS = [
  { href: "/", label: "스코어보드" },
  { href: "/issues", label: "이슈" },
  { href: "/explore", label: "탐색" },
  { href: "/politicians", label: "정치인" },
  { href: "/report", label: "제보" },
] as const;

const CAMP_DOT_COLOR: Record<DisplayCamp, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  free: "#71717a",
};

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; camp: DisplayCamp } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) {
        setUser(null);
        return;
      }
      supabase
        .from("user_profiles")
        .select("display_camp")
        .eq("id", authUser.id)
        .single()
        .then(({ data }) => {
          setUser({
            id: authUser.id,
            camp: (data?.display_camp as DisplayCamp) ?? "free",
          });
        });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      supabase
        .from("user_profiles")
        .select("display_camp")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          setUser({
            id: session.user.id,
            camp: (data?.display_camp as DisplayCamp) ?? "free",
          });
        });
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  }

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-white transition-colors hover:text-white"
            style={{ fontFamily: "'Shilla Culture', serif", WebkitTextStroke: "0.5px currentColor" }}
          >
            민낯
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isActive ? "bg-white/10 text-white" : "text-white/75 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            {/* 로그인 상태 — 임시 비노출 */}
          </div>

          {/* 모바일 햄버거 */}
          <button
            onClick={() => setOpen(!open)}
            className="relative flex h-8 w-8 items-center justify-center md:hidden"
            aria-label="메뉴"
          >
            <span
              className={`absolute h-px w-4 bg-white/60 transition-all duration-300 ${
                open ? "rotate-45" : "-translate-y-1.5"
              }`}
            />
            <span
              className={`absolute h-px w-4 bg-white/60 transition-all duration-300 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute h-px w-4 bg-white/60 transition-all duration-300 ${
                open ? "-rotate-45" : "translate-y-1.5"
              }`}
            />
          </button>
        </div>
      </nav>

      {/* 모바일 메뉴 오버레이 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#0a0a0c]/95 backdrop-blur-2xl pt-14 md:hidden"
          >
            <div className="flex flex-col items-center gap-2 px-6 pt-10">
              {NAV_ITEMS.map(({ href, label }, i) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="w-full"
                  >
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-xl px-5 py-3.5 text-center text-lg transition-colors ${
                        isActive ? "bg-white/10 text-white" : "text-white/75 hover:text-white"
                      }`}
                    >
                      {label}
                    </Link>
                  </motion.div>
                );
              })}

              {/* 모바일 로그인/로그아웃 — 임시 비노출 */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
