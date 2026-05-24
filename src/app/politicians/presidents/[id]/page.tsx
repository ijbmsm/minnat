import { Nav } from "@/components/nav";
import { getPresidentById } from "@/lib/data";
import { CAMP_COLORS, CATEGORY_MAP, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import { calculateEventScore } from "@/lib/score";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { PresidentFull, PromiseStatus } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const pres = await getPresidentById(id);
  if (!pres) return { title: "대통령을 찾을 수 없습니다 — 민낯" };
  const pol = (pres as any).politician;
  return {
    title: `${pol?.name} — 역대 대통령 — 민낯`,
    description: `${pres.term_number}대 대통령 ${pol?.name}의 형사 처분, 측근 비리, 사면, 경제 성적표`,
  };
}

const TERM_END_LABEL: Record<string, string> = {
  normal: "임기 만료",
  impeachment: "탄핵",
  resignation: "하야",
  assassination: "시해",
  coup: "쿠데타",
  ongoing: "재임 중",
};

const PROMISE_LABEL: Record<PromiseStatus, { label: string; color: string }> = {
  fulfilled: { label: "이행", color: "bg-green-500/15 text-green-400/70" },
  partial: { label: "부분이행", color: "bg-yellow-500/15 text-yellow-400/70" },
  broken: { label: "미이행", color: "bg-red-500/15 text-red-400/70" },
  ongoing: { label: "진행중", color: "bg-blue-500/15 text-blue-400/70" },
  not_started: { label: "미착수", color: "bg-white/5 text-white/30" },
  impossible: { label: "이행불가", color: "bg-white/5 text-white/30" },
};

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="rounded-[1.5rem] bg-white/[0.02] p-[1px] ring-1 ring-white/5">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#0c0c10] p-6 md:p-8">
          <span className="mb-5 inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/35 uppercase">
            {title}
          </span>
          {children}
        </div>
      </div>
    </section>
  );
}

export default async function PresidentDetailPage({ params }: Props) {
  const { id } = await params;
  const pres = await getPresidentById(id);
  if (!pres) notFound();

  const pol = (pres as any).politician;
  const camp = pol?.party?.camp as "blue" | "red";
  const colors = CAMP_COLORS[camp] ?? CAMP_COLORS.blue;
  const startYear = new Date(pres.term_start).getFullYear();
  const endYear = pres.term_end ? new Date(pres.term_end).getFullYear() : "현재";
  const endLabel = TERM_END_LABEL[pres.term_ended_by] || "";

  const scoredEvents = pres.events.filter((e) => CATEGORY_MAP[e.category]?.isScored);
  const receivedPardons = pres.pardons.filter((p) => p.direction === "received");
  const grantedPardons = pres.pardons.filter((p) => p.direction === "granted");

  // 공약 통계
  const promiseCounts: Record<PromiseStatus, number> = {
    fulfilled: 0, partial: 0, broken: 0, ongoing: 0, not_started: 0, impossible: 0,
  };
  for (const p of pres.promises) {
    promiseCounts[p.status]++;
  }
  const totalPromises = pres.promises.length;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 pt-24 pb-20 md:px-8">
        {/* 뒤로가기 */}
        <Link
          href="/politicians/presidents"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/30 transition-colors hover:text-white/50"
        >
          <span>&larr;</span>
          <span>역대 대통령</span>
        </Link>

        {/* ── [1] 프로필 헤더 ── */}
        <header
          className="mb-12 rounded-[1.5rem] p-8 md:p-10"
          style={{
            background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${colors.primary}10, transparent 70%), rgba(255,255,255,0.02)`,
          }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold"
              style={{ backgroundColor: `${colors.primary}20`, color: colors.glow }}
            >
              {pres.term_number}대
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{pol?.name}</h1>
              <p className="mt-1 text-sm text-white/40">
                {pres.party_at_time} · {startYear}–{endYear}
                {endLabel && endLabel !== "임기 만료" && (
                  <span className="ml-2 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400/50">
                    {endLabel}
                  </span>
                )}
                {endLabel === "재임 중" && (
                  <span className="ml-2 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] text-green-400/50">
                    재임 중
                  </span>
                )}
              </p>
            </div>
          </div>
        </header>

        {/* ── [2] 형사 처분 (본인) ── */}
        <SectionShell title="형사 처분">
          {scoredEvents.length === 0 ? (
            <p className="text-sm text-white/25">관련 형사 처분 없음</p>
          ) : (
            <div className="space-y-3">
              {scoredEvents.map((event) => {
                const score = calculateEventScore(event);
                return (
                  <Link
                    key={event.id}
                    href={`/issues/${event.representative_issue_id}`}
                    className="group flex items-start justify-between gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {event.criminal_stage && (
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400/50">
                            {CRIMINAL_STAGE_LABEL[event.criminal_stage]}
                          </span>
                        )}
                        <span className="text-[11px] text-white/20">
                          {event.coverage_count}개 매체
                        </span>
                      </div>
                      <p className="text-sm text-white/60 transition-colors group-hover:text-white/80">
                        {event.summary}
                      </p>
                    </div>
                    {score > 0 && (
                      <span className="shrink-0 font-mono text-sm font-bold tabular-nums" style={{ color: colors.glow }}>
                        {score.toFixed(1)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </SectionShell>

        {/* ── [3] 가족·측근 비리 ── */}
        <SectionShell title="가족·측근 비리">
          {pres.associates.length === 0 ? (
            <p className="text-sm text-white/25">관련 기록 없음</p>
          ) : (
            <div className="space-y-3">
              {pres.associates.map((a) => (
                <div key={a.id} className="rounded-xl bg-white/[0.02] px-4 py-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-sm font-medium text-white/70">{a.name}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/30">{a.relation}</span>
                    {a.criminal_stage && (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400/50">
                        {CRIMINAL_STAGE_LABEL[a.criminal_stage as keyof typeof CRIMINAL_STAGE_LABEL] ?? a.criminal_stage}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed text-white/45">{a.description}</p>
                  {a.sentence && (
                    <p className="mt-1 text-xs text-white/25">형량: {a.sentence}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionShell>

        {/* ── [4] 사면 기록 ── */}
        <SectionShell title="사면 기록">
          {pres.pardons.length === 0 ? (
            <p className="text-sm text-white/25">관련 사면 기록 없음</p>
          ) : (
            <div className="space-y-6">
              {receivedPardons.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-medium text-white/30">받은 사면</h3>
                  <div className="space-y-2">
                    {receivedPardons.map((p) => (
                      <div key={p.id} className="rounded-xl bg-white/[0.02] px-4 py-3">
                        <p className="text-sm text-white/60">
                          {p.pardoned_by} 대통령으로부터 특별사면
                        </p>
                        <p className="mt-1 text-xs text-white/25">
                          원래 혐의: {p.original_charge} · 형량: {p.original_sentence} · {p.pardon_date}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {grantedPardons.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-medium text-white/30">부여한 사면</h3>
                  <div className="space-y-2">
                    {grantedPardons.map((p) => (
                      <div key={p.id} className="rounded-xl bg-white/[0.02] px-4 py-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm text-white/60">{p.target_name}</span>
                          {p.target_role && (
                            <span className="text-[11px] text-white/25">{p.target_role}</span>
                          )}
                        </div>
                        <p className="text-xs text-white/25">
                          원래 혐의: {p.original_charge} · 형량: {p.original_sentence} · {p.pardon_date}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SectionShell>

        {/* ── [5] 경제 성적표 ── */}
        <SectionShell title="경제 성적표">
          {pres.economy.length === 0 ? (
            <p className="text-sm text-white/25">경제 지표 데이터 없음</p>
          ) : (
            <>
              {/* 차트 — 심플 바 */}
              <div className="mb-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] text-white/30">
                      <th className="pb-3 text-left font-medium">연도</th>
                      <th className="pb-3 text-right font-medium">GDP 성장률</th>
                      <th className="pb-3 text-right font-medium">실업률</th>
                      <th className="pb-3 text-right font-medium">물가상승률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pres.economy.map((e) => (
                      <tr key={e.year} className="border-t border-white/5">
                        <td className="py-2.5 font-mono text-white/50">{e.year}</td>
                        <td className="py-2.5 text-right font-mono tabular-nums">
                          <span className={e.gdp_growth !== null && e.gdp_growth < 0 ? "text-red-400/60" : "text-green-400/60"}>
                            {e.gdp_growth !== null ? `${e.gdp_growth > 0 ? "+" : ""}${e.gdp_growth}%` : "—"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-white/40">
                          {e.unemployment !== null ? `${e.unemployment}%` : "—"}
                        </td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-white/40">
                          {e.inflation !== null ? `${e.inflation}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-white/15">출처: 한국은행 ECOS, 통계청 KOSIS</p>
            </>
          )}
        </SectionShell>

        {/* ── [6] 공약 이행률 ── */}
        <SectionShell title="공약 이행률">
          {pres.promises.length === 0 ? (
            <p className="text-sm text-white/25">공약 데이터 없음 (수집 예정)</p>
          ) : (
            <>
              {/* 비율 바 */}
              <div className="mb-6">
                <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-white/5">
                  {totalPromises > 0 && (["fulfilled", "partial", "broken", "ongoing"] as const).map((status) => {
                    const pct = (promiseCounts[status] / totalPromises) * 100;
                    if (pct === 0) return null;
                    const colorMap = { fulfilled: "bg-green-500/60", partial: "bg-yellow-500/60", broken: "bg-red-500/60", ongoing: "bg-blue-500/40" };
                    return <div key={status} className={`${colorMap[status]}`} style={{ width: `${pct}%` }} />;
                  })}
                </div>
                <div className="flex flex-wrap gap-3 text-[11px]">
                  {(Object.entries(promiseCounts) as [PromiseStatus, number][]).map(([status, count]) => {
                    if (count === 0) return null;
                    const info = PROMISE_LABEL[status];
                    return (
                      <span key={status} className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 ${info.color}`}>{info.label}</span>
                        <span className="text-white/25">{count}건</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 개별 공약 */}
              <div className="space-y-2">
                {pres.promises.map((p) => {
                  const info = PROMISE_LABEL[p.status];
                  return (
                    <div key={p.id} className="flex items-start gap-3 rounded-lg px-3 py-2">
                      <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] ${info.color}`}>
                        {info.label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] text-white/55">{p.promise}</p>
                        {p.detail && <p className="mt-0.5 text-[11px] text-white/20">{p.detail}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </SectionShell>

        {/* ── [7] 낙하산 인사 ── */}
        <SectionShell title="논란 인사">
          {pres.appointments.length === 0 ? (
            <p className="text-sm text-white/25">논란 인사 데이터 없음 (수집 예정)</p>
          ) : (
            <div className="space-y-2">
              {pres.appointments.map((a) => (
                <div key={a.id} className="rounded-xl bg-white/[0.02] px-4 py-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-white/60">{a.appointee_name}</span>
                    <span className="text-[11px] text-white/25">{a.position_appointed}</span>
                    {a.result && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                        a.result === "낙마" || a.result === "임명철회" || a.result === "자진사퇴"
                          ? "bg-red-500/10 text-red-400/50"
                          : "bg-amber-500/10 text-amber-400/50"
                      }`}>
                        {a.result}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-white/35">{a.issue}</p>
                </div>
              ))}
            </div>
          )}
        </SectionShell>
      </main>
    </>
  );
}
