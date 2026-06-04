"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { DisplayCamp } from "@/types";

const CAMP_COLOR: Record<DisplayCamp, string> = {
  red:  "#ef4444",
  blue: "#3b82f6",
  free: "#71717a",
};

const isSajuPath     = (p: string) => p.startsWith("/saju");
const isPoliticsPath = (p: string) => p.startsWith("/politics") || p.startsWith("/issues") || p.startsWith("/explore") || p.startsWith("/politicians") || p.startsWith("/report");

export function Nav() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; camp: DisplayCamp } | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) { setUser(null); return; }
      supabase.from("user_profiles").select("display_camp").eq("id", authUser.id).single()
        .then(({ data }) => setUser({ id: authUser.id, camp: (data?.display_camp as DisplayCamp) ?? "free" }));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) { setUser(null); return; }
      supabase.from("user_profiles").select("display_camp").eq("id", session.user.id).single()
        .then(({ data }) => setUser({ id: session.user.id, camp: (data?.display_camp as DisplayCamp) ?? "free" }));
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await createClient().auth.signOut();
    setUser(null);
    router.refresh();
  }

  const onPolitics = isPoliticsPath(pathname);
  const onSaju     = isSajuPath(pathname);

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">

          {/* 로고 + 섹션 버튼 (좌측 그룹) */}
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl font-bold tracking-tight text-white hover:opacity-80 transition-opacity"
              style={{ fontFamily: "'Shilla Culture', serif", WebkitTextStroke: "0.5px currentColor" }}>
              술자리
            </Link>

            {/* 데스크탑: 정치 / 사주 */}
            <div className="hidden md:flex items-center gap-0.5 ml-1">
              <div className="h-3.5 w-px bg-white/15 mr-2" />
              <Link href="/politics"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  onPolitics ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                }`}>
                정치
              </Link>
              <Link href="/saju"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  onSaju ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                }`}>
                사주
              </Link>
            </div>
          </div>

          {/* 로그인 / 유저 */}
          <div className="hidden md:flex items-center gap-2">
            {user === undefined ? (
              <div className="h-7 w-16 rounded-lg bg-white/5 animate-pulse" />
            ) : user ? (
              <>
                <div className="h-2 w-2 rounded-full ring-2 ring-white/10" style={{ backgroundColor: CAMP_COLOR[user.camp] }} />
                <button onClick={handleLogout} className="rounded-lg px-3 py-1.5 text-sm text-white/45 hover:text-white transition-colors">
                  로그아웃
                </button>
              </>
            ) : (
              <Link href="/auth/login"
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all">
                로그인
              </Link>
            )}
          </div>

          {/* 모바일 햄버거 */}
          <button onClick={() => setOpen(!open)} className="relative flex h-8 w-8 items-center justify-center md:hidden" aria-label="메뉴">
            <span className={`absolute h-px w-4 bg-white/60 transition-all duration-300 ${open ? "rotate-45" : "-translate-y-1.5"}`} />
            <span className={`absolute h-px w-4 bg-white/60 transition-all duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`absolute h-px w-4 bg-white/60 transition-all duration-300 ${open ? "-rotate-45" : "translate-y-1.5"}`} />
          </button>
        </div>
      </nav>

      {/* 모바일 메뉴 */}
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-[#0a0a0c]/96 backdrop-blur-2xl pt-14 md:hidden">
            <div className="flex flex-col px-6 pt-8 pb-8 gap-2 h-full">

              {/* 정치 섹션 */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Link href="/politics" onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 text-lg font-medium transition-colors ${
                    onPolitics ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
                  }`}>
                  <span>정치</span>
                  <span className="text-sm text-white/30">스코어보드 · 이슈 · 정치인</span>
                </Link>
              </motion.div>

              {/* 사주 섹션 */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Link href="/saju" onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 text-lg font-medium transition-colors ${
                    onSaju ? "bg-white/10 text-white" : "text-white/70 hover:text-white"
                  }`}>
                  <span>사주</span>
                  <span className="text-sm text-white/30">종합 · 연애운 · 직업운</span>
                </Link>
              </motion.div>

              {/* 로그인 / 로그아웃 */}
              <div className="mt-auto">
                <div className="h-px bg-white/8 mb-4" />
                {user === undefined ? null : user ? (
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CAMP_COLOR[user.camp] }} />
                      <span className="text-sm text-white/40">로그인됨</span>
                    </div>
                    <button onClick={() => { handleLogout(); setOpen(false); }}
                      className="rounded-lg px-4 py-2 text-sm text-white/50 hover:text-white transition-colors">
                      로그아웃
                    </button>
                  </div>
                ) : (
                  <Link href="/auth/login" onClick={() => setOpen(false)}
                    className="block rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-center text-base text-white/70 hover:bg-white/10 hover:text-white transition-all">
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
