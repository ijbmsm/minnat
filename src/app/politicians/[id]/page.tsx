import { Nav } from "@/components/nav";
import { IssueCard } from "@/components/issue-card";
import { getPoliticianById, getIssuesByPolitician } from "@/lib/data";
import { calculateIssueScore } from "@/lib/score";
import { CAMP_COLORS, CATEGORY_MAP } from "@/lib/constants";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const politician = await getPoliticianById(id);
  if (!politician) return { title: "정치인을 찾을 수 없습니다 — 민낯" };
  return {
    title: `${politician.name} 스코어카드 — 민낯`,
    description: `${politician.name}의 정치 이슈 기반 점수와 활동 요약`,
  };
}

export default async function PoliticianPage({ params }: Props) {
  const { id } = await params;
  const politician = await getPoliticianById(id);
  if (!politician) notFound();

  const issues = await getIssuesByPolitician(politician.name);
  const camp = politician.party?.camp ?? "blue";
  const colors = CAMP_COLORS[camp as keyof typeof CAMP_COLORS];

  // 카테고리별 집계
  const breakdown: Record<string, { count: number; totalScore: number }> = {};
  let totalNegative = 0;
  let totalPositive = 0;

  for (const issue of issues) {
    const config = CATEGORY_MAP[issue.category];
    if (!config) continue;
    const score = calculateIssueScore(issue);

    if (!breakdown[issue.category]) {
      breakdown[issue.category] = { count: 0, totalScore: 0 };
    }
    breakdown[issue.category].count += 1;
    breakdown[issue.category].totalScore += score;

    if (config.isPositive) totalPositive += score;
    else totalNegative += score;
  }

  const netScore = Math.round((totalNegative - totalPositive) * 100) / 100;

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-3xl px-4 pt-24 pb-20">
        <Link
          href="/politicians"
          className="mb-6 inline-block text-sm text-white/40 transition-colors hover:text-white/60"
        >
          &larr; 정치인 목록
        </Link>

        {/* 프로필 헤더 */}
        <div className="mb-8 flex items-center gap-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ backgroundColor: colors.primary }}
          >
            {politician.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{politician.name}</h1>
            <p className="text-sm text-white/40">
              {politician.party?.name} · {politician.position}
              {politician.region ? ` · ${politician.region}` : ""}
            </p>
          </div>
        </div>

        {/* 점수 요약 */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
            <p className="text-xs text-white/30">감점 합계</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-red-400/80">
              {totalNegative.toFixed(1)}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
            <p className="text-xs text-white/30">가점 합계</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-green-400/80">
              +{totalPositive.toFixed(1)}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
            <p className="text-xs text-white/30">순점수</p>
            <p
              className="mt-1 text-xl font-bold tabular-nums"
              style={{ color: netScore > 0 ? "#f87171" : "#4ade80" }}
            >
              {netScore > 0 ? "+" : ""}{netScore}
            </p>
          </div>
        </div>

        {/* 카테고리 breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <div className="mb-8 rounded-xl border border-white/5 bg-white/[0.02] p-5">
            <h2 className="mb-4 text-sm font-semibold text-white/50">카테고리별 분석</h2>
            <div className="space-y-2">
              {Object.entries(breakdown)
                .sort(([, a], [, b]) => b.totalScore - a.totalScore)
                .map(([cat, data]) => {
                  const config = CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP];
                  return (
                    <div key={cat} className="flex items-center justify-between text-sm">
                      <span className="text-white/60">{config?.label ?? cat}</span>
                      <div className="flex items-center gap-3">
                        <span className="tabular-nums text-white/30">{data.count}건</span>
                        <span
                          className="min-w-[3rem] text-right font-mono text-xs tabular-nums"
                          style={{ color: config?.isPositive ? "#22c55e" : "#f87171" }}
                        >
                          {config?.isPositive ? "+" : ""}{data.totalScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* 관련 이슈 */}
        <h2 className="mb-4 text-sm font-semibold text-white/50">
          관련 이슈 ({issues.length}건)
        </h2>
        {issues.length === 0 ? (
          <div className="rounded-xl border border-white/5 py-12 text-center text-white/30">
            이 정치인과 관련된 수집 이슈가 없습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {issues.slice(0, 20).map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
