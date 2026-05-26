import { Nav } from "@/components/nav";
import { getPresidentById } from "@/lib/data";
import { CAMP_COLORS, CATEGORY_MAP, CRIMINAL_STAGE_LABEL } from "@/lib/constants";
import { calculateEventScore } from "@/lib/score";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { CriminalStage, PresidentFull, PromiseStatus, TermEndReason } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const pres = await getPresidentById(id);
  if (!pres) return { title: "대통령을 찾을 수 없습니다 — 민낯" };
  const pol = pres.politician;
  return {
    title: `${pol?.name} — 역대 대통령 — 민낯`,
    description: `${pres.term_number}대 대통령 ${pol?.name}의 사법 기록, 관련인물 기록, 사면, 경제 성적표`,
  };
}

const TERM_END_LABEL: Record<TermEndReason, string> = {
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
  not_started: { label: "미착수", color: "bg-white/5 text-white/75" },
  impossible: { label: "이행불가", color: "bg-white/5 text-white/75" },
};

function SectionShell({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <div className="rounded-[1.5rem] bg-white/[0.02] p-[1px] ring-1 ring-white/5">
        <div className="rounded-[calc(1.5rem-1px)] bg-[#0c0c10] p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="inline-block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/75 uppercase">
              {title}
            </span>
            {count !== undefined && count > 0 && (
              <span className="text-[11px] tabular-nums text-white/75">{count}건</span>
            )}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}

function GdpBar({ value }: { value: number }) {
  const maxWidth = 60;
  const absVal = Math.min(Math.abs(value), 15);
  const width = (absVal / 15) * maxWidth;
  const isNeg = value < 0;

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-3 flex items-center" style={{ width: `${maxWidth}px` }}>
        {isNeg ? (
          <div
            className="absolute right-1/2 h-full rounded-l-sm bg-red-500/40"
            style={{ width: `${width}px` }}
          />
        ) : (
          <div
            className="absolute left-1/2 h-full rounded-r-sm bg-green-500/40"
            style={{ width: `${width}px` }}
          />
        )}
        <div className="absolute left-1/2 h-full w-px bg-white/10" />
      </div>
    </div>
  );
}

function isCriminalStage(value: string): value is CriminalStage {
  return value in CRIMINAL_STAGE_LABEL;
}

export default async function PresidentDetailPage({ params }: Props) {
  const { id } = await params;
  const pres = await getPresidentById(id);
  if (!pres) notFound();

  const pol = pres.politician;
  const camp = pol?.party?.camp;
  const colors = camp ? CAMP_COLORS[camp] : CAMP_COLORS.blue;
  const startYear = new Date(pres.term_start).getFullYear();
  const endYear = pres.term_end ? new Date(pres.term_end).getFullYear() : "현재";
  const endLabel = TERM_END_LABEL[pres.term_ended_by];

  const scoredEvents = pres.events.filter((e) => CATEGORY_MAP[e.category]?.isScored);
  const receivedPardons = pres.pardons.filter((p) => p.direction === "received");
  const grantedPardons = pres.pardons.filter((p) => p.direction === "granted");

  // 측근 분류
  const criminalAssociates = pres.associates.filter((a) => a.category === "criminal_conviction");
  const investigationAssociates = pres.associates.filter((a) => a.category === "investigation" || a.category === "ethics_violation");
  const controversyAssociates = pres.associates.filter((a) => a.category === "controversy" || a.category === "policy_failure" || a.category === "media_coverage");

  // 공약 통계
  const promiseCounts: Record<PromiseStatus, number> = {
    fulfilled: 0, partial: 0, broken: 0, ongoing: 0, not_started: 0, impossible: 0,
  };
  for (const p of pres.promises) {
    promiseCounts[p.status]++;
  }
  const totalPromises = pres.promises.length;
  const fulfillRate = totalPromises > 0
    ? Math.round(((promiseCounts.fulfilled + promiseCounts.partial * 0.5) / totalPromises) * 100)
    : null;

  // 경제 평균
  const avgGdp = pres.economy.length > 0
    ? pres.economy.reduce((sum, e) => sum + (e.gdp_growth ?? 0), 0) / pres.economy.filter(e => e.gdp_growth !== null).length
    : null;

  // 데이터 존재 여부로 섹션 표시 제어
  const hasAssociates = criminalAssociates.length > 0 || investigationAssociates.length > 0 || controversyAssociates.length > 0;

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: pol?.name,
    jobTitle: `대한민국 ${pres.term_number}대 대통령`,
    affiliation: {
      "@type": "Organization",
      name: pres.party_at_time,
    },
    description: `${pres.term_number}대 대통령 ${pol?.name} (${startYear}–${endYear}), ${pres.party_at_time}`,
  };

  return (
    <>
      <Nav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-5xl px-6 pt-24 pb-20 md:px-8">
        {/* 뒤로가기 */}
        <Link
          href="/politicians/presidents"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-white"
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
          <div className="flex items-start gap-4 md:items-center">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold"
              style={{ backgroundColor: `${colors.primary}20`, color: colors.glow }}
            >
              {pres.term_number}대
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight">{pol?.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/75">
                <span>{pres.party_at_time}</span>
                <span className="text-white/75">&middot;</span>
                <span>{startYear}–{endYear}</span>
                {endLabel !== "임기 만료" && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                    endLabel === "재임 중" ? "bg-green-500/10 text-green-400/50" : "bg-red-500/10 text-red-400/50"
                  }`}>
                    {endLabel}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* 요약 통계 카드 */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
              <p className="text-[10px] text-white/75">사법 기록</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums" style={{ color: scoredEvents.length > 0 ? colors.glow : "rgba(255,255,255,0.3)" }}>
                {scoredEvents.length}건
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
              <p className="text-[10px] text-white/75">관련인물 기록</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-white/75">
                {pres.associates.length}건
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
              <p className="text-[10px] text-white/75">평균 GDP 성장률</p>
              <p className={`mt-0.5 text-lg font-bold tabular-nums ${avgGdp !== null && avgGdp < 0 ? "text-red-400/70" : "text-green-400/70"}`}>
                {avgGdp !== null ? `${avgGdp > 0 ? "+" : ""}${avgGdp.toFixed(1)}%` : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
              <p className="text-[10px] text-white/75">공약 이행률</p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-white/75">
                {fulfillRate !== null ? `${fulfillRate}%` : "—"}
              </p>
            </div>
          </div>
        </header>

        {/* ── [2] 사법 기록 (본인) ── */}
        <SectionShell title="사법 기록" count={scoredEvents.length}>
          {scoredEvents.length === 0 ? (
            <p className="text-sm text-white/75">관련 사법 기록 없음</p>
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
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {event.criminal_stage && (
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400/50">
                            {CRIMINAL_STAGE_LABEL[event.criminal_stage]}
                          </span>
                        )}
                        <span className="text-[11px] text-white/75">
                          {event.coverage_count}개 매체
                        </span>
                      </div>
                      <p className="text-sm text-white/75 transition-colors group-hover:text-white">
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

        {/* ── [3] 가족·측근 (데이터 있는 섹션만 표시) ── */}
        {hasAssociates ? (
          <>
            {criminalAssociates.length > 0 && (
              <SectionShell title="가족·측근 사법 기록" count={criminalAssociates.length}>
                <div className="space-y-3">
                  {criminalAssociates.map((a) => (
                    <div key={a.id} className="rounded-xl bg-white/[0.02] px-4 py-3">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-white">{a.name}</span>
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/75">{a.relation}</span>
                        {a.criminal_stage && isCriminalStage(a.criminal_stage) && (
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400/50">
                            {CRIMINAL_STAGE_LABEL[a.criminal_stage]}
                          </span>
                        )}
                        {a.date && (
                          <span className="text-[10px] text-white/75">{a.date}</span>
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed text-white/75">{a.description}</p>
                      {a.sentence && (
                        <p className="mt-1 text-xs text-white/75">결과: {a.sentence}</p>
                      )}
                    </div>
                  ))}
                </div>
              </SectionShell>
            )}
            {investigationAssociates.length > 0 && (
              <SectionShell title="수사·감사 결과" count={investigationAssociates.length}>
                <div className="space-y-3">
                  {investigationAssociates.map((a) => (
                    <div key={a.id} className="rounded-xl bg-white/[0.02] px-4 py-3">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-white">{a.name}</span>
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/75">{a.relation}</span>
                        {a.criminal_stage && isCriminalStage(a.criminal_stage) && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400/50">
                            {CRIMINAL_STAGE_LABEL[a.criminal_stage]}
                          </span>
                        )}
                        {a.date && (
                          <span className="text-[10px] text-white/75">{a.date}</span>
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed text-white/75">{a.description}</p>
                      {a.sentence && (
                        <p className="mt-1 text-xs text-white/75">결과: {a.sentence}</p>
                      )}
                    </div>
                  ))}
                </div>
              </SectionShell>
            )}
            {controversyAssociates.length > 0 && (
              <SectionShell title="주요 이슈" count={controversyAssociates.length}>
                <div className="space-y-3">
                  {controversyAssociates.map((a) => (
                    <div key={a.id} className="rounded-xl bg-white/[0.02] px-4 py-3">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-white">{a.name}</span>
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/75">{a.relation}</span>
                        {a.date && (
                          <span className="text-[10px] text-white/75">{a.date}</span>
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed text-white/75">{a.description}</p>
                    </div>
                  ))}
                </div>
              </SectionShell>
            )}
          </>
        ) : (
          <SectionShell title="가족·측근">
            <p className="text-sm text-white/75">관련 기록 없음</p>
          </SectionShell>
        )}

        {/* ── [4] 사면 기록 (데이터 있을 때만) ── */}
        {pres.pardons.length > 0 && (
          <SectionShell title="사면 기록" count={pres.pardons.length}>
            <div className="space-y-6">
              {receivedPardons.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-medium text-white/75">받은 사면</h3>
                  <div className="space-y-2">
                    {receivedPardons.map((p) => (
                      <div key={p.id} className="rounded-xl bg-white/[0.02] px-4 py-3">
                        <p className="text-sm text-white/75">
                          {p.pardoned_by} 대통령으로부터 특별사면
                        </p>
                        <p className="mt-1 text-xs text-white/75">
                          원래 혐의: {p.original_charge} · 형량: {p.original_sentence} · {p.pardon_date}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {grantedPardons.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-medium text-white/75">부여한 사면</h3>
                  <div className="space-y-2">
                    {grantedPardons.map((p) => (
                      <div key={p.id} className="rounded-xl bg-white/[0.02] px-4 py-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm text-white/75">{p.target_name}</span>
                          {p.target_role && (
                            <span className="text-[11px] text-white/75">{p.target_role}</span>
                          )}
                        </div>
                        <p className="text-xs text-white/75">
                          원래 혐의: {p.original_charge} · 형량: {p.original_sentence} · {p.pardon_date}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionShell>
        )}

        {/* ── [5] 경제 성적표 ── */}
        {pres.economy.length > 0 && (
          <SectionShell title="경제 성적표">
            {/* GDP 미니 바 차트 */}
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-medium text-white/75">GDP 성장률 추이</h3>
              <div className="space-y-1">
                {pres.economy.map((e) => (
                  <div key={e.year} className="flex items-center gap-3">
                    <span className="w-10 shrink-0 text-right font-mono text-[11px] text-white/75">{e.year}</span>
                    {e.gdp_growth !== null ? (
                      <>
                        <GdpBar value={e.gdp_growth} />
                        <span className={`font-mono text-[11px] tabular-nums ${e.gdp_growth < 0 ? "text-red-400/60" : "text-green-400/60"}`}>
                          {e.gdp_growth > 0 ? "+" : ""}{e.gdp_growth}%
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-white/75">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 테이블 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-white/75">
                    <th className="pb-3 text-left font-medium">연도</th>
                    <th className="pb-3 text-right font-medium">GDP 성장률</th>
                    <th className="pb-3 text-right font-medium">실업률</th>
                    <th className="pb-3 text-right font-medium">물가상승률</th>
                  </tr>
                </thead>
                <tbody>
                  {pres.economy.map((e) => (
                    <tr key={e.year} className="border-t border-white/5">
                      <td className="py-2.5 font-mono text-white/75">{e.year}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums">
                        <span className={e.gdp_growth !== null && e.gdp_growth < 0 ? "text-red-400/60" : "text-green-400/60"}>
                          {e.gdp_growth !== null ? `${e.gdp_growth > 0 ? "+" : ""}${e.gdp_growth}%` : "—"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-white/75">
                        {e.unemployment !== null ? `${e.unemployment}%` : "—"}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-white/75">
                        {e.inflation !== null ? `${e.inflation}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[10px] text-white/75">출처: 한국은행 ECOS, 통계청 KOSIS</p>
          </SectionShell>
        )}

        {/* ── [6] 공약 이행률 ── */}
        {pres.promises.length > 0 && (
          <SectionShell title="공약 이행률" count={totalPromises}>
            {/* 이행률 헤드라인 */}
            <div className="mb-5 flex items-end gap-3">
              {fulfillRate !== null && (
                <span className="text-3xl font-bold tabular-nums text-white">{fulfillRate}%</span>
              )}
              <span className="mb-1 text-xs text-white/75">
                이행 {promiseCounts.fulfilled} · 부분이행 {promiseCounts.partial} · 미이행 {promiseCounts.broken}
              </span>
            </div>

            {/* 비율 바 */}
            <div className="mb-6">
              <div className="mb-2 flex h-3 overflow-hidden rounded-full bg-white/5">
                {totalPromises > 0 && (["fulfilled", "partial", "broken", "ongoing", "not_started", "impossible"] as const).map((status) => {
                  const pct = (promiseCounts[status] / totalPromises) * 100;
                  if (pct === 0) return null;
                  const colorMap: Record<PromiseStatus, string> = {
                    fulfilled: "bg-green-500/60",
                    partial: "bg-yellow-500/60",
                    broken: "bg-red-500/60",
                    ongoing: "bg-blue-500/40",
                    not_started: "bg-white/10",
                    impossible: "bg-white/5",
                  };
                  return <div key={status} className={colorMap[status]} style={{ width: `${pct}%` }} />;
                })}
              </div>
              <div className="flex flex-wrap gap-3 text-[11px]">
                {(Object.entries(promiseCounts) as [PromiseStatus, number][]).map(([status, count]) => {
                  if (count === 0) return null;
                  const info = PROMISE_LABEL[status];
                  return (
                    <span key={status} className="flex items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 ${info.color}`}>{info.label}</span>
                      <span className="text-white/75">{count}건</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 카테고리별 그룹핑 */}
            {(() => {
              const byCategory = new Map<string, typeof pres.promises>();
              for (const p of pres.promises) {
                const cat = p.category ?? "기타";
                const existing = byCategory.get(cat);
                if (existing) {
                  existing.push(p);
                } else {
                  byCategory.set(cat, [p]);
                }
              }
              return Array.from(byCategory.entries()).map(([cat, promises]) => (
                <div key={cat} className="mb-4">
                  <h4 className="mb-2 text-[11px] font-medium text-white/75">{cat}</h4>
                  <div className="space-y-1.5">
                    {promises.map((p) => {
                      const info = PROMISE_LABEL[p.status];
                      return (
                        <div key={p.id} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.02]">
                          <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] ${info.color}`}>
                            {info.label}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] text-white/75">{p.promise}</p>
                            {p.detail && <p className="mt-0.5 text-[11px] text-white/75">{p.detail}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </SectionShell>
        )}

        {/* ── [7] 인사 기록 ── */}
        {pres.appointments.length > 0 && (
          <SectionShell title="인사 기록" count={pres.appointments.length}>
            <div className="space-y-2">
              {pres.appointments.map((a) => (
                <div key={a.id} className="rounded-xl bg-white/[0.02] px-4 py-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-white/75">{a.appointee_name}</span>
                    <span className="text-[11px] text-white/75">{a.position_appointed}</span>
                    {a.result && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                        a.result === "낙마" || a.result === "임명철회" || a.result === "자진사퇴"
                          ? "bg-red-500/10 text-red-400/50"
                          : "bg-amber-500/10 text-amber-400/50"
                      }`}>
                        {a.result}
                      </span>
                    )}
                    {a.date && (
                      <span className="text-[10px] text-white/75">{a.date}</span>
                    )}
                  </div>
                  <p className="text-[13px] text-white/75">{a.issue}</p>
                </div>
              ))}
            </div>
          </SectionShell>
        )}
      </main>
    </>
  );
}
