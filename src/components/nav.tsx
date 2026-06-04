"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { DisplayCamp } from "@/types";

const POLITICS_ITEMS = [
  { href: "/", label: "스코어보드" },
  { href: "/issues", label: "이슈" },
  { href: "/explore", label: "탐색" },
  { href: "/politicians", label: "정치인" },
  { href: "/report", label: "제보" },
] as const;

const CAMP_COLOR: Record<DisplayCamp, string> = {
  red:  "#ef4444",
  blue: "#3b82f6",
  free: "#71717a",
};

export function Nav() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; camp: DisplayCamp } | null | undefined>(undefined);
  // undefined = loading, null = not logged in, object = logged in

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) { setUser(null); return; }
      supabase
        .from("user_profiles")
        .select("display_camp")
        .eq("id", authUser.id)
        .single()
        .then(({ data }) => {
          setUser({ id: authUser.id, camp: (data?.display_camp as DisplayCamp) ?? "free" });
        });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { setUser(null); return; }
      supabase
        .from("user_profiles")
        .select("display_camp")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          setUser({ id: session.user.id, camp: (data?.display_camp as DisplayCamp) ?? "free" });
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

  const isSaju = pathname === "/saju";

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">

          {/* 로고 */}
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-white transition-opacity hover:opacity-80"
            style={{ fontFamily: "'Shilla Culture', serif", WebkitTextStroke: "0.5px currentColor" }}
          >
            술자리
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden items-center md:flex">
            {/* 정치 섹션 */}
            <div className="flex items-center gap-0.5">
              <span className="mr-1 text-[10px] font-medium tracking-widest text-white/25 select-none">정치</span>
              {POLITICS_ITEMS.map(({ href, label }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                      isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* 구분선 */}
            <div className="mx-3 h-4 w-px bg-white/15" />

            {/* 사주 섹션 */}
            <div className="flex items-center gap-0.5">
              <span className="mr-1 text-[10px] font-medium tracking-widest text-white/25 select-none">사주</span>
              <Link
                href="/saju"
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isSaju ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                ✦ 사주보기
              </Link>
            </div>

            {/* 구분선 */}
            <div className="mx-3 h-4 w-px bg-white/15" />

            {/* 로그인 / 유저 */}
            {user === undefined ? (
              <div className="h-7 w-16 rounded-lg bg-white/5 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full ring-2 ring-white/10"
                  style={{ backgroundColor: CAMP_COLOR[user.camp] }}
                />
                <button
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-1.5 text-sm text-white/50 hover:text-white transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                로그인
              </Link>
            )}
          </div>

          {/* 모바일 햄버거 */}
          <button
            onClick={() => setOpen(!open)}
            className="relative flex h-8 w-8 items-center justify-center md:hidden"
            aria-label="메뉴"
          >
            <span className={`absolute h-px w-4 bg-white/60 transition-all duration-300 ${open ? "rotate-45" : "-translate-y-1.5"}`} />
            <span className={`absolute h-px w-4 bg-white/60 transition-all duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`absolute h-px w-4 bg-white/60 transition-all duration-300 ${open ? "-rotate-45" : "translate-y-1.5"}`} />
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
            <div className="flex flex-col px-6 pt-8 pb-8 gap-1 h-full">

              {/* 정치 섹션 */}
              <p className="text-[10px] tracking-widest text-white/30 mb-2 px-1">정치</p>
              {POLITICS_ITEMS.map(({ href, label }, i) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-xl px-5 py-3 text-base transition-colors ${
                        isActive ? "bg-white/10 text-white" : "text-white/65 hover:text-white"
                      }`}
                    >
                      {label}
                    </Link>
                  </motion.div>
                );
              })}

              {/* 구분 */}
              <div className="my-3 h-px bg-white/8" />

              {/* 사주 섹션 */}
              <p className="text-[10px] tracking-widest text-white/30 mb-2 px-1">사주</p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: POLITICS_ITEMS.length * 0.04, duration: 0.25 }}
              >
                <Link
                  href="/saju"
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl px-5 py-3 text-base transition-colors ${
                    isSaju ? "bg-white/10 text-white" : "text-white/65 hover:text-white"
                  }`}
                >
                  ✦ 사주보기
                </Link>
              </motion.div>

              {/* 로그인 / 로그아웃 — 하단 고정 */}
              <div className="mt-auto">
                <div className="h-px bg-white/8 mb-4" />
                {user === undefined ? null : user ? (
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CAMP_COLOR[user.camp] }} />
                      <span className="text-sm text-white/40">로그인됨</span>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setOpen(false); }}
                      className="rounded-lg px-4 py-2 text-sm text-white/50 hover:text-white transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={() => setOpen(false)}
                    className="block rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-center text-base text-white/70 hover:bg-white/10 hover:text-white transition-all"
                  >
                    카카오 로그인
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
