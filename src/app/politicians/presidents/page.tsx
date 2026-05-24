import { Nav } from "@/components/nav";
import { getPresidents } from "@/lib/data";
import { CAMP_COLORS } from "@/lib/constants";
import Link from "next/link";

export const metadata = {
  title: "역대 대통령 — 민낯",
  description: "역대 대통령의 형사 처분, 측근 비리, 사면, 경제 성적표를 팩트 기반으로 비교합니다",
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

export default async function PresidentsPage() {
  const presidents = await getPresidents();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 pt-24 pb-20 md:px-8">
        <div className="mb-12">
          <Link
            href="/politicians"
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/30 transition-colors hover:text-white/50"
          >
            <span>&larr;</span>
            <span>정치인</span>
          </Link>
          <span className="mb-3 block rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-white/30 uppercase w-fit">
            역대 대통령
          </span>
          <h1 className="text-3xl font-bold tracking-tight">대한민국 역대 대통령</h1>
          <p className="mt-2 text-sm text-white/35">
            형사 처분 · 가족측근 비리 · 사면 · 경제 성적표를 팩트 기반으로 비교합니다
          </p>
        </div>

        <div className="space-y-4">
          {presidents.map((pres) => {
            const pol = (pres as any).politician;
            const camp = pol?.party?.camp as "blue" | "red" | undefined;
            const colors = camp ? CAMP_COLORS[camp] : CAMP_COLORS.blue;
            const startYear = new Date(pres.term_start).getFullYear();
            const endYear = pres.term_end ? new Date(pres.term_end).getFullYear() : "현재";
            const endLabel = TERM_END_LABEL[pres.term_ended_by] || "";

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
                      <div className="mb-1 flex items-center gap-2.5">
                        <h2 className="text-lg font-semibold text-white/90 transition-colors group-hover:text-white">
                          {pol?.name}
                        </h2>
                        <span className="text-sm text-white/30">
                          {startYear}–{endYear}
                        </span>
                        {endLabel && endLabel !== "임기 만료" && endLabel !== "재임 중" && (
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400/50">
                            {endLabel}
                          </span>
                        )}
                        {endLabel === "재임 중" && (
                          <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] text-green-400/50">
                            재임 중
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/30">
                        {pres.party_at_time}
                      </p>
                    </div>

                    {/* 화살표 */}
                    <span className="shrink-0 text-white/15 transition-colors group-hover:text-white/30">
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
