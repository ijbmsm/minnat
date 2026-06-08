import { Nav } from "@/components/nav";
import { getPoliticians, getPresidents, getEvents } from "@/lib/data";
import { CAMP_COLORS } from "@/lib/constants";
import Link from "next/link";
import type { Metadata } from "next";
import type { Politician, TermEndReason } from "@/types";

export const metadata: Metadata = {
  title: "정치인 — 술자리",
  description: "현직·전직 정치인의 이슈 기록. 공식 처분 기반 팩트만.",
  alternates: { canonical: "https://drinkplace.kr/politicians" },
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

function PoliticianRow({ p, count }: { p: Politician; count: number }) {
  const camp = p.party?.camp;
  const colors = camp ? CAMP_COLORS[camp] : CAMP_COLORS.blue;

  return (
    <Link
      key={p.id}
      href={`/politicians/${p.id}`}
      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
    >
      <div className="flex items-center gap-2">
        <span className="text-white">{p.name}</span>
        {!p.active && (
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] text-white/50">전직</span>
        )}
        {count > 0 && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] tabular-nums"
            style={{ backgroundColor: `${colors.primary}15`, color: `${colors.glow}80` }}
          >
            {count}
          </span>
        )}
      </div>
      <span className="text-xs text-white/75">{p.position}</span>
    </Link>
  );
}

function CampSection({
  camp,
  active,
  former,
  eventCountByName,
}: {
  camp: "blue" | "red";
  active: Politician[];
  former: Politician[];
  eventCountByName: Map<string, number>;
}) {
  const colors = CAMP_COLORS[camp];

  return (
    <div>
      <h2
        className="mb-4 text-sm font-semibold tracking-wide"
        style={{ color: colors.glow }}
      >
        {colors.label}
      </h2>

      {/* 현직 */}
      {active.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 px-3 text-[10px] font-medium text-white/50 uppercase tracking-wider">
            현직 ({active.length})
          </p>
          <div className="space-y-0.5">
            {active.map((p) => (
              <PoliticianRow key={p.id} p={p} count={eventCountByName.get(p.name) ?? 0} />
            ))}
          </div>
        </div>
      )}

      {/* 전직 */}
      {former.length > 0 && (
        <div>
          <p className="mb-2 px-3 text-[10px] font-medium text-white/50 uppercase tracking-wider">
            전직 ({former.length})
          </p>
          <div className="space-y-0.5">
            {former.map((p) => (
              <PoliticianRow key={p.id} p={p} count={eventCountByName.get(p.name) ?? 0} />
            ))}
          </div>
        </div>
      )}

      {active.length === 0 && former.length === 0 && (
        <p className="py-4 text-center text-xs text-white/75">데이터 없음</p>
      )}
    </div>
  );
}

export default async function PoliticiansPage() {
  const [allPoliticians, presidents, events] = await Promise.all([
    getPoliticians(false),  // active + inactive 전부
    getPresidents(),
    getEvents({ limit: 500 }),
  ]);

  const eventCountByName = new Map<string, number>();
  for (const event of events) {
    if (event.actor_name) {
      eventCountByName.set(event.actor_name, (eventCountByName.get(event.actor_name) ?? 0) + 1);
    }
  }

  // 대통령은 별도 섹션이므로 제외
  const presidentNames = new Set(presidents.map((p) => p.politician?.name));
  const pols = allPoliticians.filter((p) => !presidentNames.has(p.name));

  const blueActive = pols.filter((p) => p.party?.camp === "blue" && p.active);
  const blueFormer = pols.filter((p) => p.party?.camp === "blue" && !p.active);
  const redActive = pols.filter((p) => p.party?.camp === "red" && p.active);
  const redFormer = pols.filter((p) => p.party?.camp === "red" && !p.active);

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-4 pt-24 pb-20 md:px-8">
        <h1 className="mb-2 text-3xl font-bold">정치인</h1>
        <p className="mb-10 text-sm text-white/75">
          현직·전직 정치인의 이슈 기록
        </p>

        {/* ── 역대 대통령 ── */}
        <section className="mb-14">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/75 uppercase">
                역대 대통령
              </span>
              <span className="text-xs text-white/75">{presidents.length}명</span>
            </div>
            <Link
              href="/politicians/presidents"
              className="text-xs text-white/75 transition-colors hover:text-white"
            >
              상세 보기 &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {presidents.map((pres) => {
              const pol = pres.politician;
              const camp = pol?.party?.camp;
              const colors = camp ? CAMP_COLORS[camp] : CAMP_COLORS.blue;
              const startYear = new Date(pres.term_start).getFullYear();
              const endYear = pres.term_end ? new Date(pres.term_end).getFullYear() : "현재";
              const endStyle = TERM_END_STYLE[pres.term_ended_by];
              const endLabel = TERM_END_LABEL[pres.term_ended_by];

              return (
                <Link
                  key={pres.id}
                  href={`/politicians/presidents/${pres.id}`}
                  className="group rounded-xl border border-white/5 bg-white/[0.02] p-3.5 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="text-xs font-bold tabular-nums" style={{ color: colors.glow }}>
                      {pres.term_number}대
                    </span>
                    {endStyle && (
                      <span className={`rounded px-1.5 py-0.5 text-[9px] ${endStyle}`}>
                        {endLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-white/75 transition-colors group-hover:text-white">
                    {pol?.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/75">
                    {startYear}–{endYear}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── 정치인 (현직 + 전직) ── */}
        <section>
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium tracking-[0.15em] text-white/75 uppercase">
              정치인
            </span>
            <span className="text-xs text-white/75">
              현직 {blueActive.length + redActive.length}명 · 전직 {blueFormer.length + redFormer.length}명
            </span>
          </div>

          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
            <CampSection camp="blue" active={blueActive} former={blueFormer} eventCountByName={eventCountByName} />
            <CampSection camp="red" active={redActive} former={redFormer} eventCountByName={eventCountByName} />
          </div>
        </section>
      </main>
    </>
  );
}
