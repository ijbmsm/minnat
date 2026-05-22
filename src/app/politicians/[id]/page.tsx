import { Nav } from "@/components/nav";
import { IssueCard } from "@/components/issue-card";
import { getPoliticianById, getIssuesByPolitician, getEventsByPolitician } from "@/lib/data";
import { CAMP_COLORS, CATEGORY_MAP, SOURCE_TIER_LABEL } from "@/lib/constants";
import { calculateEventScore } from "@/lib/score";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { IssueEvent } from "@/types";

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

function EventCard({ event, colors }: { event: IssueEvent; colors: (typeof CAMP_COLORS)[keyof typeof CAMP_COLORS] }) {
  const config = CATEGORY_MAP[event.category];
  const score = calculateEventScore(event);
  const isScored = config?.isScored ?? false;

  const lastDate = new Date(event.last_reported_at || event.created_at).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });

  return (
    <Link
      href={`/issues/${event.representative_issue_id}`}
      className="group block rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.primary }} />
        <span className="text-xs font-medium text-white/50">{config?.label ?? event.category}</span>
        {event.issue_count > 1 && (
          <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400/50">
            {event.issue_count}개 보도
          </span>
        )}
        {event.verified && (
          <span className="rounded-md bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400/50">
            검증됨
          </span>
        )}
        <span className="ml-auto text-[11px] text-white/20">{lastDate}</span>
      </div>

      <h3 className="mb-2 text-[15px] font-medium leading-snug text-white/85 transition-colors group-hover:text-white">
        {event.summary || "사건 요약 없음"}
      </h3>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/25">{event.coverage_count}개 매체</span>
          {event.headline_days > 1 && (
            <span className="text-[10px] text-white/15">{event.headline_days}일간</span>
          )}
        </div>

        {isScored && score > 0 ? (
          <div className="flex items-center gap-1.5">
            <span
              className="font-mono text-sm font-semibold tabular-nums"
              style={{ color: colors.glow }}
            >
              {score.toFixed(1)}
            </span>
            <span className="text-[10px] text-white/15">/100</span>
          </div>
        ) : (
          <span className="text-[10px] text-white/20">점수 없음</span>
        )}
      </div>
    </Link>
  );
}

export default async function PoliticianPage({ params }: Props) {
  const { id } = await params;
  const politician = await getPoliticianById(id);
  if (!politician) notFound();

  // Event 기반 조회 + orphan issue fallback
  const events = await getEventsByPolitician(politician.name);
  const orphanIssues = await getIssuesByPolitician(politician.name);
  // orphan = event_id가 없는 issue만
  const orphans = orphanIssues.filter((i) => !i.event_id);

  const camp = politician.party?.camp ?? "blue";
  const colors = CAMP_COLORS[camp as keyof typeof CAMP_COLORS];

  const scoredEvents = events.filter((e) => CATEGORY_MAP[e.category]?.isScored);
  const archiveEvents = events.filter((e) => CATEGORY_MAP[e.category]?.isArchive);
  const scoredOrphans = orphans.filter((i) => CATEGORY_MAP[i.category]?.isScored);
  const archiveOrphans = orphans.filter((i) => CATEGORY_MAP[i.category]?.isArchive);

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

        {/* 공식 처분 (Events) */}
        <h2 className="mb-4 text-sm font-semibold text-white/50">
          공식 처분 ({scoredEvents.length + scoredOrphans.length}건의 사건)
        </h2>
        {scoredEvents.length === 0 && scoredOrphans.length === 0 ? (
          <div className="mb-8 rounded-xl border border-white/5 py-8 text-center text-white/25">
            관련 공식 처분 없음
          </div>
        ) : (
          <div className="mb-8 space-y-4">
            {scoredEvents.map((event) => (
              <EventCard key={event.id} event={event} colors={colors} />
            ))}
            {scoredOrphans.map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        )}

        {/* 행보 기록 (Events) */}
        <h2 className="mb-4 text-sm font-semibold text-white/50">
          행보 기록 ({archiveEvents.length + archiveOrphans.length}건)
          <span className="ml-2 text-xs font-normal text-white/20">점수 없음</span>
        </h2>
        {archiveEvents.length === 0 && archiveOrphans.length === 0 ? (
          <div className="rounded-xl border border-white/5 py-8 text-center text-white/25">
            관련 기록 없음
          </div>
        ) : (
          <div className="space-y-4">
            {archiveEvents.slice(0, 20).map((event) => (
              <EventCard key={event.id} event={event} colors={colors} />
            ))}
            {archiveOrphans.slice(0, 20).map((issue, i) => (
              <IssueCard key={issue.id} issue={issue} index={i} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
