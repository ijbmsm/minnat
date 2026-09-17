/**
 * 이슈 카드 헤드라인 조립.
 *
 * 헤드라인은 summary 의 첫 문장을 잘라 쓴다. 그래서 summary 가 한 문장이면
 * 헤드라인과 바로 아래 보조 요약이 글자 그대로 같아진다 — 같은 줄이 두 번 나온다.
 * buildSubline 이 남는 내용이 있을 때만 보조 요약을 돌려준다.
 */
import type { IssueEvent } from "@/types";
import { CATEGORY_MAP } from "@/lib/constants";

const HEADLINE_MAX = 60;

export function buildHeadline(event: IssueEvent): string {
  const summary = (event.summary || "").trim();
  const firstSentence = summary.split(/[.。!]\s*/)[0];
  if (firstSentence && firstSentence.length > 5) {
    return firstSentence.length > HEADLINE_MAX
      ? firstSentence.slice(0, HEADLINE_MAX) + "…"
      : firstSentence;
  }
  // fallback: actor + category
  const config = CATEGORY_MAP[event.category];
  const actor = event.actor_name || "";
  return actor ? `${actor}, ${config?.description || config?.label || ""}` : config?.label || "";
}

/** 헤드라인으로 이미 보여준 앞부분을 뺀 나머지. 남는 게 없으면 null. */
export function buildSubline(event: IssueEvent, headline: string): string | null {
  const summary = (event.summary || "").trim();
  if (!summary) return null;

  const head = headline.replace(/…$/, "").trim();
  if (!head) return summary;

  const rest = summary.startsWith(head) ? summary.slice(head.length) : summary;
  const cleaned = rest.replace(/^[\s.。!·,]+/, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}
