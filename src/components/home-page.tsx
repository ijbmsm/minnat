"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SplitScreen } from "./split-screen";
import { Nav } from "./nav";
import { calculateEventScores } from "@/lib/score";
import type { ScoreView } from "@/lib/score";
import { CATEGORY_MAP, CAMP_COLORS, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import type { IssueEvent, CriminalStage, DisplayCamp } from "@/types";
import { createClient } from "@/lib/supabase/client";

const EASE = [0.32, 0.72, 0, 1] as const;

interface HomePageProps {
  events: IssueEvent[];
}

function getRefDate(e: IssueEvent): string {
  return e.last_reported_at || e.created_at;
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// ── 피드 아이템 (메인 리스트) ──

function FeedCard({ event, index }: { event: IssueEvent; index: number }) {
  const colors = CAMP_COLORS[event.camp];
  const config = CATEGORY_MAP[event.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.03, ease: EASE }}
    >
      <Link
        href={`/issues/${event.representative_issue_id}`}
        className="group relative block"
      >
        <div className="flex gap-5 border-b border-white/[0.04] py-6 transition-colors duration-300 group-hover:bg-white/[0.01]">
          {/* 좌측: 진영 인디케이터 */}
          <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors.primary }}
            />
            <div
              className="h-8 w-px"
              style={{ background: `linear-gradient(to bottom, ${colors.primary}30, transparent)` }}
            />
          </div>

          {/* 우측: 콘텐츠 */}
          <div className="min-w-0 flex-1">
            {/* 메타 라인 */}
            <div className="mb-2 flex flex-wrap items-center gap-2.5 text-[11px]">
              <span style={{ color: `${colors.glow}cc` }} className="font-medium">
                {CAMP_COLORS[event.camp].label}
              </span>
              <span className="text-white/75">&middot;</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px]"
                style={{ backgroundColor: `${colors.primary}0d`, color: `${colors.glow}99` }}
              >
                {config?.label}
              </span>
              {event.criminal_stage && (event.criminal_stage in CRIMINAL_STAGE_LABEL) && (
                <>
                  <span className="text-white/75">&middot;</span>
                  <span className="text-red-400/50">
                    {CRIMINAL_STAGE_LABEL[event.criminal_stage as CriminalStage]}
                  </span>
                </>
              )}
              <span className="ml-auto text-white/75">{formatRelative(getRefDate(event))}</span>
            </div>

            {/* 행위자 */}
            {event.actor_name && (
              <p className="mb-1 text-xs font-semibold text-white/75">{event.actor_name}</p>
            )}

            {/* 요약 */}
            <p className="line-clamp-2 text-[15px] leading-relaxed text-white/75 transition-colors duration-300 group-hover:text-white">
              {event.summary || config?.label}
            </p>

            {/* 하단 메트릭 */}
            {(event.coverage_count > 1 || event.headline_days > 1) && (
              <div className="mt-2.5 flex items-center gap-4 text-[10px] text-white/75">
                {event.coverage_count > 1 && <span>{event.coverage_count}개 매체</span>}
                {event.headline_days > 1 && <span>{event.headline_days}일째</span>}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── 사이드 피드 (진영별 요약) ──

function SideFeed({ camp, events }: { camp: "blue" | "red"; events: IssueEvent[] }) {
  const colors = CAMP_COLORS[camp];

  return (
    <div>
      <div className="mb-5 flex items-center gap-2.5">
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: colors.primary }}
        />
        <span className="text-sm font-semibold text-white/75">{colors.label}</span>
        <div
          className="h-px flex-1"
          style={{ background: `linear-gradient(to right, ${colors.primary}20, transparent)` }}
        />
      </div>

      <div className="space-y-0.5">
        {events.map((event, i) => {
          const config = CATEGORY_MAP[event.category];
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.03, ease: EASE }}
            >
              <Link
                href={`/issues/${event.representative_issue_id}`}
                className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors duration-200 hover:bg-white/[0.03]"
              >
                <span className="mt-1 text-[11px] font-bold tabular-nums text-white/75">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] leading-snug text-white/75 transition-colors duration-200 group-hover:text-white">
                    {event.actor_name && (
                      <span className="font-medium text-white/75">{event.actor_name} </span>
                    )}
                    {event.summary || config?.label}
                  </p>
                  <span className="mt-1 block text-[10px] text-white/75">{formatRelative(getRefDate(event))}</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {events.length === 0 && (
        <p className="py-8 text-center text-[11px] text-white/75">수집된 이슈 없음</p>
      )}
    </div>
  );
}

// ── 메인 ──

const CAMP_OPTIONS: { value: DisplayCamp; label: string; desc: string; color: string }[] = [
  { value: "red",  label: "국민의힘",     desc: "보수",        color: CAMP_COLORS.red.primary },
  { value: "blue", label: "민주당",       desc: "진보",        color: CAMP_COLORS.blue.primary },
  { value: "free", label: "무관",         desc: "중립 / 기타", color: "rgba(255,255,255,0.5)" },
];

function CampSetupModal({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [selected, setSelected] = useState<DisplayCamp | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!selected) return;
    setLoading(true);
    await createClient().from("user_profiles").update({ display_camp: selected }).eq("id", userId);
    localStorage.setItem(`campSetupDone_${userId}`, "1");
    onDone();
  }

  function dismiss() {
    localStorage.setItem(`campSetupDone_${userId}`, "1");
    onDone();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm pb-safe"
      onClick={dismiss}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border-t border-white/8 bg-[#0e0e12] px-6 pt-6 pb-10"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />
        <p className="mb-1 text-lg font-bold text-white">정치 성향을 알려주세요</p>
        <p className="mb-6 text-sm text-white/40">진영별 스코어 색상에 반영됩니다. 언제든 바꿀 수 있어요.</p>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {CAMP_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setSelected(opt.value)}
              className={`rounded-2xl border py-4 text-center transition-all ${
                selected === opt.value
                  ? "border-white/20 bg-white/[0.08]"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/12"
              }`}>
              <p className="text-sm font-semibold" style={{ color: opt.color }}>{opt.label}</p>
              <p className="mt-0.5 text-[11px] text-white/35">{opt.desc}</p>
            </button>
          ))}
        </div>

        <button onClick={save} disabled={!selected || loading}
          className="w-full rounded-xl bg-white/[0.08] border border-white/[0.10] py-3 text-sm font-semibold text-white hover:bg-white/12 transition-all disabled:opacity-30">
          {loading ? "저장 중..." : "선택 완료"}
        </button>
        <button onClick={dismiss} className="mt-3 w-full py-2 text-xs text-white/30 hover:text-white/60 transition-colors">
          나중에 선택하기
        </button>
      </motion.div>
    </motion.div>
  );
}

export function HomePage({ events }: HomePageProps) {
  const [view, setView] = useState<ScoreView>("recent");
  const [campModal, setCampModal] = useState<{ userId: string } | null>(null);
  const score = calculateEventScores(events, view);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      if (localStorage.getItem(`campSetupDone_${user.id}`)) return;
      const { data: profile } = await supabase
        .from("user_profiles").select("display_camp").eq("id", user.id).single();
      // 프로필 없거나 camp 미선택(free 기본값) 상태면 모달
      if (!profile || profile.display_camp === "free") {
        setCampModal({ userId: user.id });
      } else {
        localStorage.setItem(`campSetupDone_${user.id}`, "1");
      }
    });
  }, []);

  const sorted = [...events].sort(
    (a, b) => new Date(getRefDate(b)).getTime() - new Date(getRefDate(a)).getTime()
  );

  // 메인 피드: 최신 10건
  const mainFeed = sorted.slice(0, 10);
  // 사이드: 진영별 최신 6건
  const blueSide = sorted.filter((e) => e.camp === "blue").slice(0, 6);
  const redSide = sorted.filter((e) => e.camp === "red").slice(0, 6);

  return (
    <>
      <Nav />
      <AnimatePresence>
        {campModal && (
          <CampSetupModal
            userId={campModal.userId}
            onDone={() => setCampModal(null)}
          />
        )}
      </AnimatePresence>
      <main>
        <SplitScreen score={score} view={view} onViewChange={setView} />

        {/* ── 뉴스 피드 ── */}
        <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
          {/* 섹션 헤더 */}
          <motion.div
            className="mb-12 flex items-end justify-between"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <div>
              <span className="mb-2 inline-block rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/75 uppercase">
                이슈 피드
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white">최신 이슈</h2>
            </div>
            <Link
              href="/issues"
              className="text-sm text-white/75 transition-colors hover:text-white"
            >
              전체 보기 &rarr;
            </Link>
          </motion.div>

          {/* 2열: 메인 피드(좌) + 사이드(우) */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/* 메인 피드 — 8칸 */}
            <div className="lg:col-span-8">
              {mainFeed.map((event, i) => (
                <FeedCard key={event.id} event={event} index={i} />
              ))}

              {mainFeed.length === 0 && (
                <div className="py-20 text-center text-sm text-white/75">
                  수집된 이슈가 없습니다
                </div>
              )}
            </div>

            {/* 사이드바 — 4칸 */}
            <aside className="lg:col-span-4">
              <div className="sticky top-20 space-y-10">
                <SideFeed camp="blue" events={blueSide} />
                <SideFeed camp="red" events={redSide} />

                {/* 하단 링크 */}
                <div className="space-y-2 pt-4 border-t border-white/[0.04]">
                  <Link href="/board" className="block text-sm text-white/75 transition-colors hover:text-white">
                    게시판 &rarr;
                  </Link>
                  <Link href="/report" className="block text-sm text-white/75 transition-colors hover:text-white">
                    누락 기록 제보 &rarr;
                  </Link>
                  <Link href="/politicians" className="block text-sm text-white/75 transition-colors hover:text-white">
                    정치인 &rarr;
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <footer className="border-t border-white/[0.04] py-16 text-center">
          <p className="text-xs tracking-widest text-white/75">술자리 — 사회·제도의 반응을 측정합니다</p>
          <p className="mt-2 text-[11px] text-white/75">모든 점수의 근거는 투명하게 공개됩니다</p>
        </footer>
      </main>
    </>
  );
}
