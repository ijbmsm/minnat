"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Nav } from "./nav";
import { CreditSection } from "./credit-section";
import { NetScoreToggle } from "./net-score-toggle";
import type { Issue, IssueEvent, CreditEvent, Camp } from "@/types";
import { CATEGORY_MAP, CAMP_COLORS, SOURCE_TIER_LABEL, CRIMINAL_STAGE_LABEL, CRIMINAL_STAGE_WEIGHT } from "@/lib/constants";
import { calculateIssueScore, calculateNetEventScore } from "@/lib/score";
import { splitParagraphs } from "@/lib/paragraphs";

interface IssueDetailPageProps {
  issue: Issue;
  event?: IssueEvent | null;
  credits?: CreditEvent[];
  similarCasesSlot?: ReactNode;
}

/**
 * 진영 토큰 — 스코어보드용 CAMP_COLORS 는 채도가 높아 본문 위 텍스트에 쓰면 눈이 아프다.
 * 상세 페이지는 읽는 화면이라 점/텍스트/배경/테두리를 따로 둔다.
 */
const CAMP_TOKENS: Record<Camp, { dot: string; text: string; bg: string; border: string }> = {
  blue: { dot: "#3b82f6", text: "#7aa7ff", bg: "rgba(59,130,246,.12)", border: "rgba(59,130,246,.28)" },
  red:  { dot: "#ef4444", text: "#ff8a8a", bg: "rgba(239,68,68,.12)",  border: "rgba(239,68,68,.28)"  },
};

// ── 공통 조각 ──

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="mb-5 text-[11px] font-bold tracking-[0.14em] text-[#6f6f6f]">{children}</p>;
}

function Chip({ children, color, bg, border }: { children: ReactNode; color: string; bg: string; border: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-[11px] py-[5px] text-xs font-semibold"
      style={{ color, backgroundColor: bg, border: `1px solid ${border}` }}
    >
      {children}
    </span>
  );
}

function Metric({ value, unit, label, color }: { value: string; unit?: string; label: string; color?: string }) {
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className="text-[26px] font-bold tracking-[-0.02em] tabular-nums" style={{ color: color ?? "#ffffff" }}>
          {value}
        </span>
        {unit && <span className="text-[13px] font-medium text-[#8a8a8a]">{unit}</span>}
      </div>
      <p className="mt-[5px] text-xs text-[#6f6f6f]">{label}</p>
    </div>
  );
}

const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * 이슈 라인 타임라인.
 * 기사 한 건의 요약만으로는 "이 사건이 어떤 흐름의 일부인지" 가 안 보인다.
 * 같은 사건으로 묶인 보도(member_issues)를 시간순 노드로 세워 흐름을 만든다.
 */
function IssueLine({ event, currentId }: { event: IssueEvent; currentId: string }) {
  const nodes = [...(event.member_issues ?? [])].sort(
    (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime(),
  );
  if (nodes.length < 2) return null;

  const currentIndex = nodes.findIndex((n) => n.id === currentId);

  return (
    <section className="pt-16">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <SectionLabel>이슈 라인</SectionLabel>
          <h2 className="m-0 text-[22px] font-bold tracking-[-0.01em] text-white">
            {event.actor_name ? `${event.actor_name} · ` : ""}
            {CATEGORY_MAP[event.category]?.label ?? "관련 보도"}
          </h2>
        </div>
        <span className="text-[13px] text-[#7d7d7d]">
          전체 {nodes.length}건
          {currentIndex >= 0 && ` · 이 기사는 ${currentIndex + 1}번째`}
        </span>
      </div>

      <ol className="relative mt-8 list-none pl-[34px]">
        <span aria-hidden className="absolute left-[6px] top-[14px] bottom-[24px] w-[2px] bg-[#232323]" />
        {nodes.map((n) => {
          const isCurrent = n.id === currentId;
          const camp = CAMP_TOKENS[n.camp];
          const body = (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-semibold tabular-nums text-[#8a8a8a]">{shortDate(n.published_at)}</span>
                <span aria-hidden className="h-[3px] w-[3px] rounded-full bg-[#3a3a3a]" />
                <span className="text-xs font-semibold" style={{ color: camp.text }}>
                  {n.source_name}
                </span>
                {isCurrent && (
                  <span className="rounded-full bg-[#e8e8e8] px-[9px] py-[3px] text-[11px] font-bold text-[#0a0a0a]">
                    지금 보는 기사
                  </span>
                )}
              </div>
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p
                    className={
                      isCurrent
                        ? "m-0 text-xl font-bold leading-[1.45] tracking-[-0.01em] text-white"
                        : "m-0 text-base font-semibold leading-[1.45] tracking-[-0.01em] text-[#d4d4d4]"
                    }
                  >
                    {n.title}
                  </p>
                  {n.summary && (
                    <p className="mt-[7px] line-clamp-2 max-w-[58ch] text-sm leading-[1.65] text-[#8a8a8a]">
                      {n.summary}
                    </p>
                  )}
                </div>
                {!isCurrent && (
                  <span aria-hidden className="flex-none pt-0.5 text-[15px] text-[#5a5a5a]">
                    →
                  </span>
                )}
              </div>
            </>
          );

          return (
            <li key={n.id} className="relative pb-3">
              <span
                aria-hidden
                className="absolute left-[-34px] h-[14px] w-[14px] rounded-full border-[3px] border-[#0a0a0a]"
                style={{
                  top: isCurrent ? 24 : 22,
                  backgroundColor: camp.dot,
                  boxShadow: isCurrent ? "0 0 0 5px rgba(232,232,232,.12)" : undefined,
                }}
              />
              {isCurrent ? (
                <div className="block rounded-xl border border-[#3a3a44] bg-[#15151a] px-5 py-4">{body}</div>
              ) : (
                <Link
                  href={`/issues/${n.id}`}
                  className="block rounded-xl border border-[#1c1c1f] bg-[#0e0e10] px-5 py-4 transition-[background-color,border-color,transform] duration-150 hover:translate-x-[3px] hover:border-[#31313a] hover:bg-[#16161a]"
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** AI 분석 — 기본 접힘. 신뢰 정보(출처·교차검증)는 헤더로 빼고 여기엔 판단 과정만 둔다. */
function AiAnalysisBlock({ issue, crossNames }: { issue: Issue; crossNames: string[] }) {
  const [open, setOpen] = useState(false);
  const ai = issue.ai_analysis;
  if (!ai) return null;
  const pct = Math.round(ai.confidence * 100);

  return (
    <section className="pt-11">
      <div className="overflow-hidden rounded-[14px] border border-[#1e1e1e] bg-[#0e0e0e]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="ai-analysis-body"
          className="flex w-full items-center gap-3 px-[22px] py-[18px] text-left transition-colors hover:bg-[#131313]"
        >
          <span className="text-xs font-bold text-[#a8a8a8]">AI 분석</span>
          <span className="text-xs text-[#6f6f6f]">
            분류 신뢰도 {pct}% · 판단 근거{crossNames.length > 0 ? " · 교차검증" : ""}
          </span>
          <span className="ml-auto shrink-0 text-xs text-[#6f6f6f]">{open ? "접기 —" : "펼치기 +"}</span>
        </button>

        {open && (
          <div id="ai-analysis-body" className="border-t border-[#1a1a1a] px-[22px] pt-1 pb-6">
            <div className="my-[22px] flex items-center gap-3.5">
              <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-[#1c1c1c]">
                <span className="block h-full rounded-full bg-[#4ade80]" style={{ width: `${pct}%` }} />
              </span>
              <span className="text-[13px] tabular-nums text-[#b9b9b9]">{pct}%</span>
            </div>

            <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
              <div>
                <p className="mb-[7px] text-xs text-[#6f6f6f]">판단 근거</p>
                <p className="m-0 text-sm leading-[1.7] text-[#c4c4c4]">{ai.reasoning}</p>
              </div>
              <div>
                <p className="mb-[7px] text-xs text-[#6f6f6f]">진영 판단</p>
                <p className="m-0 text-sm leading-[1.7] text-[#c4c4c4]">{ai.camp_reasoning}</p>
              </div>
            </div>

            {ai.evidence_sentence && (
              <p className="mt-[22px] border-l-2 border-[#2a2a2a] pl-4 text-sm italic leading-[1.75] text-[#9a9a9a]">
                &ldquo;{ai.evidence_sentence}&rdquo;
              </p>
            )}

            <p className="mt-[22px] text-[13px] leading-[1.7] text-[#6f6f6f]">
              {crossNames.length > 0 && <>교차검증 매체: {crossNames.join(" · ")}. </>}
              분류와 진영 판단은 자동 분석 결과입니다.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ── 페이지 ──

export function IssueDetailPage({ issue, event, credits = [], similarCasesSlot }: IssueDetailPageProps) {
  const [scoreMode, setScoreMode] = useState<"gross" | "net">("net");

  const config = CATEGORY_MAP[issue.category];
  const camp = CAMP_TOKENS[issue.camp];
  const isArchive = config?.isArchive ?? false;
  const isScored = config?.isScored ?? false;

  const netScoreData = event
    ? calculateNetEventScore(event, credits)
    : { grossScore: calculateIssueScore(issue), creditRatio: 0, netScore: calculateIssueScore(issue) };
  const score = scoreMode === "net" ? netScoreData.netScore : netScoreData.grossScore;
  const hasCredits = credits.length > 0;

  const coverageCount = event?.coverage_count ?? issue.coverage_count;
  const headlineDays = event?.headline_days ?? issue.headline_days;
  const posWeight = event?.position_weight ?? issue.position_weight;
  const criminalStage = event?.criminal_stage ?? issue.criminal_stage;
  const crossSources = event?.cross_verified_sources ?? issue.cross_verified_sources;
  const crossNames = crossSources.map((s) => s.name);

  const publishedDate = new Date(issue.published_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const leadParagraphs = splitParagraphs(issue.summary);

  const scoreRows: [string, string][] = [
    ["보도 매체", `${coverageCount}개`],
    ...(criminalStage
      ? ([["형사 단계", `${CRIMINAL_STAGE_LABEL[criminalStage]} (${CRIMINAL_STAGE_WEIGHT[criminalStage]}/10)`]] as [string, string][])
      : []),
    ["지속일수", `${headlineDays}일`],
    ["직책 가중치", `×${posWeight}`],
  ];

  return (
    <>
      <Nav />

      <main className="min-h-screen bg-[#0a0a0a] px-6 pb-[120px] text-[#e8e8e8]">
        <div className="mx-auto w-full max-w-[1040px]">

          {/* 뒤로 */}
          <div className="pt-28">
            <Link href="/issues" className="text-[13px] text-[#8a8a8a] transition-colors hover:text-white">
              ← 타임라인
            </Link>
          </div>

          {/* 헤더 */}
          <header className="border-b border-[#1e1e1e] pt-14 pb-11">
            <div className="mb-[22px] flex flex-wrap gap-2">
              <Chip color={camp.text} bg={camp.bg} border={camp.border}>
                <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: camp.dot }} />
                {CAMP_COLORS[issue.camp].label}
              </Chip>
              <Chip color="#a8a8a8" bg="#151515" border="#242424">
                {config?.label}
              </Chip>
              {isArchive && (
                <Chip color="#d3a24a" bg="rgba(211,162,74,.1)" border="rgba(211,162,74,.26)">
                  점수 없음 · 기록
                </Chip>
              )}
              {criminalStage && (
                <Chip color="#ff8a8a" bg="rgba(239,68,68,.12)" border="rgba(239,68,68,.28)">
                  {CRIMINAL_STAGE_LABEL[criminalStage]}
                </Chip>
              )}
            </div>

            <h1
              className="m-0 max-w-[20ch] font-extrabold leading-[1.22] tracking-[-0.02em] text-white"
              style={{ fontSize: "clamp(30px, 4.4vw, 50px)", textWrap: "pretty" }}
            >
              {issue.title}
            </h1>

            {/* 출처·교차검증은 접힌 블록에 숨기지 않는다 — 신뢰 정보라 제목 바로 아래 둔다 */}
            <div className="mt-[26px] flex flex-wrap items-center gap-[18px] text-[13px] text-[#7d7d7d]">
              {issue.actor_name && <span className="font-semibold text-[#b9b9b9]">{issue.actor_name}</span>}
              <span>{publishedDate}</span>
              <span>
                {issue.source_name} <span className="text-[#5f5f5f]">({SOURCE_TIER_LABEL[issue.source_tier]})</span>
                {crossNames.length > 0 && ` · 교차검증 ${crossNames.length}곳`}
              </span>
              <a
                href={issue.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#7aa7ff] transition-opacity hover:opacity-80"
              >
                원문 보기 ↗
              </a>
            </div>

            {/* 지표 */}
            <div className="mt-[34px] flex flex-wrap gap-9">
              <Metric value={String(coverageCount)} unit="개 매체" label="이 기사를 보도" />
              <Metric value={String(headlineDays)} unit="일" label="이슈 라인 지속" />
              {event && event.issue_count > 1 && (
                <Metric value={String(event.issue_count)} unit="건" label="묶인 보도" />
              )}
              {isScored && score > 0 && (
                <div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-[26px] font-bold tracking-[-0.02em] tabular-nums"
                      style={{ color: CAMP_COLORS[issue.camp].glow }}
                    >
                      {score.toFixed(1)}
                    </span>
                    <span className="text-[13px] font-medium text-[#8a8a8a]">/100</span>
                    {hasCredits && scoreMode === "net" && (
                      <span className="text-[13px] font-medium text-emerald-400/60">
                        ↓{Math.round(netScoreData.creditRatio * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="mt-[5px] text-xs text-[#6f6f6f]">
                    {hasCredits && scoreMode === "net" ? "감경 후 점수" : "가중 점수"}
                  </p>
                </div>
              )}
            </div>

            {isScored && hasCredits && (
              <div className="mt-4">
                <NetScoreToggle mode={scoreMode} onChange={setScoreMode} />
              </div>
            )}
          </header>

          {/* 무슨 일이 있었나 */}
          {leadParagraphs.length > 0 && (
            <section style={{ paddingTop: 52, paddingBottom: 8 }}>
              <SectionLabel>무슨 일이 있었나</SectionLabel>
              <div className="max-w-[62ch] space-y-5">
                {leadParagraphs.map((p, i) => (
                  <p
                    key={i}
                    className="m-0 leading-[1.75] text-[#dcdcdc]"
                    style={{ fontSize: "clamp(18px, 2.1vw, 23px)", textWrap: "pretty" }}
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* 이슈 라인 */}
          {event && <IssueLine event={event} currentId={issue.id} />}

          {/* 점수 근거 */}
          {isScored && (
            <section style={{ paddingTop: 52 }}>
              <SectionLabel>점수 근거</SectionLabel>
              <div className="rounded-[14px] border border-[#1e1e1e] bg-[#0e0e0e] px-[22px] py-5">
                <p className="mb-5 text-[13px] leading-[1.7] text-[#6f6f6f]">
                  base = 보도량(×0.40) + 공식처리(×0.35) + 지속일수(×0.25) → ×다양도 ×직책 ×시간감쇠
                  {event && event.issue_count > 1 && ` · ${event.issue_count}개 보도를 묶은 사건 단위로 산출`}
                </p>
                <dl className="grid gap-x-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))]">
                  {scoreRows.map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-[#18181b] py-3">
                      <dt className="text-[13px] text-[#8a8a8a]">{k}</dt>
                      <dd className="m-0 text-[13px] tabular-nums text-[#d4d4d4]">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {hasCredits && (
                <div className="mt-3">
                  <CreditSection credits={credits} netScore={netScoreData} campColor={CAMP_COLORS[issue.camp].glow} />
                </div>
              )}
            </section>
          )}

          {/* 기록 안내 — 점수를 매기지 않는 카테고리의 편집 원칙 */}
          {isArchive && (
            <section style={{ paddingTop: 52 }}>
              <p className="m-0 max-w-[62ch] border-l-2 border-[rgba(211,162,74,.4)] pl-4 text-[15px] leading-[1.75] text-[#9a9a9a]">
                공식 처분이 아닌 기록입니다. 점수를 매기지 않고 원문과 맥락만 보존하며, 판단은 읽는 사람의 몫입니다.
              </p>
            </section>
          )}

          {/* AI 분석 */}
          <AiAnalysisBlock issue={issue} crossNames={crossNames} />

          {/* 같은 카테고리 사건 */}
          {similarCasesSlot && <section style={{ paddingTop: 52 }}>{similarCasesSlot}</section>}
        </div>
      </main>
    </>
  );
}
