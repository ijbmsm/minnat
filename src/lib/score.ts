import type { Issue, ScoreResult, Camp, IssueCategory } from "@/types";
import { CATEGORY_MAP, SEVERITY_MULTIPLIER, IMPACT_MULTIPLIER } from "./constants";

// ── 시간 감쇠 뷰 ──
export type ScoreView = "hot" | "recent" | "midterm" | "alltime";

export const SCORE_VIEW_LABELS: Record<ScoreView, string> = {
  hot: "최근 30일",
  recent: "1년",
  midterm: "5년",
  alltime: "역대",
};

function viewDecay(daysSince: number, view: ScoreView): number {
  switch (view) {
    case "hot":
      return 1 / Math.pow(daysSince * 24 + 2, 1.8);
    case "recent":
      return Math.exp(-0.005 * daysSince);
    case "midterm":
      return Math.max(0.3, Math.exp(-0.002 * daysSince));
    case "alltime":
      return 1;
  }
}

function filterByView(issue: Issue, view: ScoreView): boolean {
  const days = Math.max(0, (Date.now() - new Date(issue.published_at).getTime()) / 86400000);
  switch (view) {
    case "hot": return days <= 30;
    case "recent": return days <= 365;
    case "midterm": return days <= 1825;
    case "alltime": return true;
  }
}

// ── Step 9: 가중 합 점수 공식 ──

function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min);
}

/**
 * 개별 이슈의 가중 점수를 계산한다 (가중 합 + 시그모이드).
 */
export function calculateIssueScore(issue: Issue, view: ScoreView = "recent"): number {
  const config = CATEGORY_MAP[issue.category];
  if (!config || !config.isScored) return 0;

  if (issue.source_tier === 4) return 0;
  if (issue.source_tier === 3 && !issue.verified) return 0;

  const daysSince = Math.max(0, (Date.now() - new Date(issue.published_at).getTime()) / 86400000);

  // 정규화
  const normCategory = normalize(config.baseWeight, 1, 10);
  const normSeverity = normalize(SEVERITY_MULTIPLIER[issue.severity], 1, 3);
  const normScope = normalize(IMPACT_MULTIPLIER[issue.impact_scope], 0.5, 1.2);
  const decay = viewDecay(daysSince, view);

  // 가중 합
  const raw = 0.4 * normCategory + 0.3 * normSeverity + 0.2 * normScope + 0.1 * decay;

  // 0~100 시그모이드 squashing
  const score = 100 / (1 + Math.exp(-10 * (raw - 0.3)));

  return Math.round(score * 100) / 100;
}

/**
 * 이슈 배열로부터 진영별 종합 점수와 퍼센티지를 계산한다.
 */
export function calculateScores(issues: Issue[], view: ScoreView = "recent"): ScoreResult {
  let blueNegative = 0;
  let bluePositive = 0;
  let redNegative = 0;
  let redPositive = 0;
  let blueCount = 0;
  let redCount = 0;

  for (const issue of issues) {
    if (!filterByView(issue, view)) continue;

    const score = calculateIssueScore(issue, view);
    if (score === 0) continue;

    const config = CATEGORY_MAP[issue.category];
    if (!config) continue;

    if (issue.camp === "blue") {
      blueCount++;
      if (config.isPositive) bluePositive += score;
      else blueNegative += score;
    } else {
      redCount++;
      if (config.isPositive) redPositive += score;
      else redNegative += score;
    }
  }

  const blueNet = blueNegative - bluePositive;
  const redNet = redNegative - redPositive;
  const total = blueNet + redNet;

  const bluePct = total > 0 ? Math.round((blueNet / total) * 100) : 50;
  const redPct = total > 0 ? 100 - bluePct : 50;

  // Step 10: 1인당 평균 (의석수 보정)
  const bluePerCapita = blueCount > 0 ? Math.round((blueNet / blueCount) * 100) / 100 : 0;
  const redPerCapita = redCount > 0 ? Math.round((redNet / redCount) * 100) / 100 : 0;

  return {
    bluePct,
    redPct,
    blueNet: Math.round(blueNet * 100) / 100,
    redNet: Math.round(redNet * 100) / 100,
    blueNegative: Math.round(blueNegative * 100) / 100,
    bluePositive: Math.round(bluePositive * 100) / 100,
    redNegative: Math.round(redNegative * 100) / 100,
    redPositive: Math.round(redPositive * 100) / 100,
    bluePerCapita,
    redPerCapita,
    blueCount,
    redCount,
  };
}

/**
 * 카테고리별 건수와 점수를 집계한다.
 */
export function getCategoryBreakdown(issues: Issue[], camp: Camp, view: ScoreView = "recent") {
  const result: Record<string, { count: number; score: number }> = {};

  for (const issue of issues) {
    if (issue.camp !== camp) continue;
    if (!filterByView(issue, view)) continue;
    const score = calculateIssueScore(issue, view);
    const cat = issue.category;
    if (!result[cat]) result[cat] = { count: 0, score: 0 };
    result[cat].count += 1;
    result[cat].score += score;
  }

  return result as Record<IssueCategory, { count: number; score: number }>;
}
