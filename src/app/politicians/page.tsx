import { Nav } from "@/components/nav";
import { getPoliticians, getPresidents } from "@/lib/data";
import { CAMP_COLORS } from "@/lib/constants";
import Link from "next/link";

export const metadata = {
  title: "정치인 스코어카드 — 민낯",
  description: "정치인별 이슈 점수와 의정 활동 요약",
};

export const revalidate = 300;

const TERM_END_LABEL: Record<string, string> = {
  normal: "임기 만료",
  impeachment: "탄핵",
  resignation: "하야",
  assassination: "시해",
  coup: "쿠데타",
  ongoing: "재임 중",
};

export default async function PoliticiansPage() {
  const [politicians, presidents] = await Promise.all([
    getPoliticians(),
    getPresidents(),
  ]);

  // 현직 정치인에서 전 대통령 제외
  const presidentNames = new Set(presidents.map((p) => (p as any).politician?.name));
  const currentPols = politicians.filter((p) => !presidentNames.has(p.name));

  const blueList = currentPols.filter((p) => p.party?.camp === "blue");
  const redList = currentPols.filter((p) => p.party?.camp === "red");

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-20 md:px-8">
        <h1 className="mb-2 text-3xl font-bold">정치인 스코어카드</h1>
        <p className="mb-10 text-sm text-white/40">
          각 정치인의 이슈 기반 점수와 활동 요약
        </p>

        {/* ── 역대 대통령 ── */}
        <section className="mb-14">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/30 uppercase">
                역대 대통령
              </span>
              <span className="text-xs text-white/20">{presidents.length}명</span>
            </div>
            <Link
              href="/politicians/presidents"
              className="text-xs text-white/25 transition-colors hover:text-white/45"
            >
              상세 보기 &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {presidents.map((pres) => {
              const pol = (pres as any).politician;
              const camp = pol?.party?.camp as "blue" | "red" | undefined;
              const colors = camp ? CAMP_COLORS[camp] : CAMP_COLORS.blue;
              const startYear = new Date(pres.term_start).getFullYear();
              const endYear = pres.term_end ? new Date(pres.term_end).getFullYear() : "현재";
              const endLabel = TERM_END_LABEL[pres.term_ended_by] || "";
              const isSpecial = endLabel !== "임기 만료" && endLabel !== "재임 중";

              return (
                <Link
                  key={pres.id}
                  href={`/politicians/presidents/${pres.id}`}
                  className="group rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: colors.glow }}
                    >
                      {pres.term_number}대
                    </span>
                    {isSpecial && (
                      <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] text-red-400/50">
                        {endLabel}
                      </span>
                    )}
                    {endLabel === "재임 중" && (
                      <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[9px] text-green-400/50">
                        재임 중
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-white/75 transition-colors group-hover:text-white">
                    {pol?.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/25">
                    {startYear}–{endYear}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── 현직 정치인 ── */}
        <section>
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/30 uppercase">
              현직 정치인
            </span>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {/* 파랑 */}
            <div>
              <h2
                className="mb-4 text-sm font-semibold tracking-wide"
                style={{ color: CAMP_COLORS.blue.glow }}
              >
                {CAMP_COLORS.blue.label} ({blueList.length}명)
              </h2>
              <div className="space-y-1">
                {blueList.map((p) => (
                  <Link
                    key={p.id}
                    href={`/politicians/${p.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                  >
                    <span className="text-white/70">{p.name}</span>
                    <span className="text-xs text-white/30">{p.position}</span>
                  </Link>
                ))}
                {blueList.length === 0 && (
                  <p className="py-4 text-center text-xs text-white/20">데이터 없음</p>
                )}
              </div>
            </div>

            {/* 빨강 */}
            <div>
              <h2
                className="mb-4 text-sm font-semibold tracking-wide"
                style={{ color: CAMP_COLORS.red.glow }}
              >
                {CAMP_COLORS.red.label} ({redList.length}명)
              </h2>
              <div className="space-y-1">
                {redList.map((p) => (
                  <Link
                    key={p.id}
                    href={`/politicians/${p.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
                  >
                    <span className="text-white/70">{p.name}</span>
                    <span className="text-xs text-white/30">{p.position}</span>
                  </Link>
                ))}
                {redList.length === 0 && (
                  <p className="py-4 text-center text-xs text-white/20">데이터 없음</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
