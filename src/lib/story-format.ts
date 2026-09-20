import type { Camp, EvidenceGrade, StorylineSummary } from "@/types";

/**
 * 서버 접속이 필요 없는 순수 계산.
 *
 * stories.ts 는 supabase/server(쿠키)를 쓰므로 클라이언트 컴포넌트가 import 하면
 * 서버 코드가 브라우저 번들로 딸려 들어간다. 화면에서 쓰는 계산은 여기 둔다.
 */

/** 확정으로 볼 수 있는 형사 단계 — 법원이 판단을 내린 것 */
const SETTLED = new Set([
  "guilty_1st", "guilty_2nd", "confirmed", "not_guilty", "no_charges", "dismissed", "pardoned",
]);
const ALLEGED = new Set(["investigation", "indicted", "suspended_indictment"]);
const SCORED = new Set([
  "criminal_conviction", "civil_judgment", "ethics_violation",
  "factcheck_false", "self_admission", "official_misconduct",
]);

/**
 * 기사 하나의 근거 등급. **LLM 이 아니라 기록에서 도출한다.**
 * 확정/혐의/주장이 섞여 나오는 게 이 제품이 메우려는 빈틈인데, 우리가 다시 섞으면
 * 존재 이유가 없다. 크롤러(storyline_shape.event_grade)와 같은 규칙이다.
 */
export function deriveGrade(issue: {
  criminal_stage: string | null;
  category: string | null;
  source_tier: number | null;
  verified: boolean | null;
}): EvidenceGrade {
  const stage = issue.criminal_stage ?? "";
  if (SETTLED.has(stage)) return "confirmed";
  if (ALLEGED.has(stage)) return "alleged";
  const category = issue.category ?? "";
  if ((category === "self_admission" || category === "official_misconduct") && issue.verified) return "confirmed";
  if (issue.source_tier === 1 && issue.verified) return "confirmed";
  if (SCORED.has(category)) return "alleged";
  return "claim";
}

/**
 * 사안이 이어진 기간.
 *
 * 진행중이면 첫 보도부터 오늘까지 "N일째" — 이건 정확하다.
 * 종결이면 **연도 범위**만 쓴다. 우리가 가진 종료일은 마지막 사건의 *보도일*이지
 * 실제 종결일이 아니라서 일 단위로 말하면 틀린 숫자가 된다 —
 * 국정농단은 2016~2021 사안인데 보도일 기준으로는 "175일간"이 나왔다.
 */
export function storyDuration(
  s: Pick<StorylineSummary, "started_at" | "ended_at" | "status">,
  now: Date = new Date(),
): { days: number; label: string } {
  const start = new Date(s.started_at);
  if (Number.isNaN(start.getTime())) return { days: 0, label: "" };

  if (s.status === "closed") {
    const end = s.ended_at ? new Date(s.ended_at) : null;
    if (!end || Number.isNaN(end.getTime())) return { days: 0, label: `${start.getFullYear()}` };
    const days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
    const label =
      start.getFullYear() === end.getFullYear()
        ? `${start.getFullYear()}`
        : `${start.getFullYear()} – ${end.getFullYear()}`;
    return { days, label };
  }

  const days = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
  return { days, label: `${days.toLocaleString()}일째` };
}

/**
 * 진영 균형. 한쪽 진영 사안만 쌓이면 그 자체가 편향으로 읽힌다.
 * 목록에서 건수를 그대로 드러내 무엇이 덜 정리됐는지 숨기지 않는다.
 */
export function campBalance(list: StorylineSummary[]): Record<Camp | "both", number> {
  const out: Record<Camp | "both", number> = { blue: 0, red: 0, both: 0 };
  for (const s of list) out[s.camp] += 1;
  return out;
}
