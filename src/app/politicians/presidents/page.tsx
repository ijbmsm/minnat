import { Nav } from "@/components/nav";
import { getPresidents } from "@/lib/data";
import { CAMP_COLORS } from "@/lib/constants";
import Link from "next/link";
import type { TermEndReason } from "@/types";

export const metadata = {
  title: "역대 대통령 — 술자리",
  description: "역대 대통령의 사법 기록, 관련인물 기록, 사면, 경제 성적표를 팩트 기반으로 정리합니다",
};

export const revalidate = 300;

const TERM_END_LABEL: Record<TermEndReason, string> = {
  normal: "임기 만료",
  impeachment: "탄핵",
  resignation: "하야",
  assassination: "시해",
  coup: "쿠데타",
  ongoing: "재임 중",
};

const TERM_END_STYLE: Partial<Record<TermEndReason, string>> = {
  impeachment: "bg-red-500/10 text-red-400/50",
  resignation: "bg-red-500/10 text-red-400/50",
  assassination: "bg-red-500/10 text-red-400/50",
  coup: "bg-amber-500/10 text-amber-400/50",
  ongoing: "bg-green-500/10 text-green-400/50",
};

export default async function PresidentsPage() {
  const presidents = await getPresidents();

  if (presidents.length === 0) {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-5xl px-6 pt-24 pb-20 md:px-8">
          <Link
            href="/politicians"
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-white"
          >
            <span>&larr;</span>
            <span>정치인</span>
          </Link>
          <h1 className="mb-4 text-3xl font-bold tracking-tight">대한민국 역대 대통령</h1>
          <div className="rounded-2xl bg-white/[0.02] p-12 text-center ring-1 ring-white/5">
            <p className="text-sm text-white/75">대통령 데이터가 아직 등록되지 않았습니다</p>
            <p className="mt-1 text-xs text-white/75">시드 데이터 실행 후 표시됩니다</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 pt-24 pb-20 md:px-8">
        <div className="mb-12">
          <Link
            href="/politicians"
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-white"
          >
            <span>&larr;</span>
            <span>정치인</span>
          </Link>
          <span className="mb-3 block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/75 uppercase w-fit">
            역대 대통령
          </span>
          <h1 className="text-3xl font-bold tracking-tight">대한민국 역대 대통령</h1>
          <p className="mt-2 text-sm text-white/75">
            사법 기록 · 관련인물 · 사면 · 경제 성적표를 팩트 기반으로 정리합니다
          </p>
        </div>

        {/* 통계 요약 */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "역대 대통령", value: `${presidents.length}명` },
            { label: "탄핵", value: `${presidents.filter(p => p.term_ended_by === "impeachment").length}명` },
            { label: "임기 만료", value: `${presidents.filter(p => p.term_ended_by === "normal").length}명` },
            { label: "비정상 종료", value: `${presidents.filter(p => ["coup", "resignation", "assassination"].includes(p.term_ended_by)).length}명` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/5">
              <p className="text-[10px] text-white/75 uppercase tracking-wider">{label}</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {presidents.map((pres) => {
            const pol = pres.politician;
            const camp = pol?.party?.camp;
            const colors = camp ? CAMP_COLORS[camp] : CAMP_COLORS.blue;
            const startYear = new Date(pres.term_start).getFullYear();
            const endYear = pres.term_end ? new Date(pres.term_end).getFullYear() : "현재";
            const endLabel = TERM_END_LABEL[pres.term_ended_by];
            const endStyle = TERM_END_STYLE[pres.term_ended_by];
            const termYears = pres.term_end
              ? Math.round((new Date(pres.term_end).getTime() - new Date(pres.term_start).getTime()) / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10
              : null;

            return (
              <Link
                key={pres.id}
                href={`/politicians/presidents/${pres.id}`}
                className="group block"
              >
                <div
                  className="rounded-[1.25rem] p-[1px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.005]"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}15, transparent 60%)` }}
                >
                  <div className="flex items-center gap-5 rounded-[calc(1.25rem-1px)] bg-white/[0.03] p-5 md:p-6">
                    {/* 대수 */}
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold"
                      style={{ backgroundColor: `${colors.primary}15`, color: colors.glow }}
                    >
                      {pres.term_number}대
                    </div>

                    {/* 정보 */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2.5">
                        <h2 className="text-lg font-semibold text-white transition-colors group-hover:text-white">
                          {pol?.name}
                        </h2>
                        <span className="text-sm text-white/75">
                          {startYear}–{endYear}
                        </span>
                        {endStyle && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${endStyle}`}>
                            {endLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm text-white/75">
                          {pres.party_at_time}
                        </p>
                        {termYears && (
                          <span className="text-[11px] text-white/75">
                            재임 {termYears}년
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 화살표 */}
                    <span className="shrink-0 text-white/75 transition-colors group-hover:text-white">
                      &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
