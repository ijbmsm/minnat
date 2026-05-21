import { Nav } from "@/components/nav";
import { IssueCard } from "@/components/issue-card";
import { getPoliticianById, getIssuesByPolitician } from "@/lib/data";
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
    title: `${politician.name} 행보 — 민낯`,
    description: `${politician.name}의 관련 이슈 기록`,
  };
}

export default async function PoliticianPage({ params }: Props) {
  const { id } = await params;
  const politician = await getPoliticianById(id);
  if (!politician) notFound();

  const issues = await getIssuesByPolitician(politician.name);
  const camp = politician.party?.camp ?? "blue";
  const colors = CAMP_COLORS[camp as keyof typeof CAMP_COLORS];

  const scoredIssues = issues.filter((i) => CATEGORY_MAP[i.category]?.isScored);
  const archiveIssues = issues.filter((i) => CATEGORY_MAP[i.category]?.isArchive);

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

        {/* 본인 입장 */}
        <div className="mb-8 rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs text-white/30">
            본인 입장 확인되지 않음 — 공식 SNS·보도자료에서 자동 수집 예정
          </p>
        </div>

        {/* 공식 처분 이슈 */}
        <h2 className="mb-4 text-sm font-semibold text-white/50">
          공식 처분 ({scoredIssues.length}건)
        </h2>
        {scoredIssues.length === 0 ? (
          <div className="mb-8 rounded-xl border border-white/5 py-8 text-center text-white/25">
            관련 공식 처분 없음
          </div>
        ) : (
          <div className="mb-8 space-y-4">
            {scoredIssues.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        )}

        {/* 행보 기록 */}
        <h2 className="mb-4 text-sm font-semibold text-white/50">
          행보 기록 ({archiveIssues.length}건)
          <span className="ml-2 text-xs font-normal text-white/20">점수 없음</span>
        </h2>
        {archiveIssues.length === 0 ? (
          <div className="rounded-xl border border-white/5 py-8 text-center text-white/25">
            관련 기록 없음
          </div>
        ) : (
          <div className="space-y-4">
            {archiveIssues.slice(0, 20).map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
