import type { Issue, ScoreResult, Camp, IssueCategory } from "@/types";
import { CATEGORY_MAP, SEVERITY_MULTIPLIER, IMPACT_MULTIPLIER, timeDecay } from "./constants";

/**
 * 개별 이슈의 가중 점수를 계산한다.
 * Tier4는 점수 미반영, Tier3는 교차검증 후 반영 (verified 플래그 기준).
 * 논란 정책(controversial)은 점수에 반영하지 않는다.
 */
export function calculateIssueScore(issue: Issue): number {
  const config = CATEGORY_MAP[issue.category];
  if (!config || !config.isScored) return 0;

  // 소스 임계값 검증
  if (issue.source_tier === 4) return 0;
  if (issue.source_tier === 3 && !issue.verified) return 0;

  const now = Date.now();
  const published = new Date(issue.published_at).getTime();
  const daysSince = Math.max(0, (now - published) / (1000 * 60 * 60 * 24));

  const score =
    config.baseWeight *
    timeDecay(daysSince) *
    SEVERITY_MULTIPLIER[issue.severity] *
    IMPACT_MULTIPLIER[issue.impact_scope];

  return Math.round(score * 100) / 100;
}

/**
 * 이슈 배열로부터 진영별 종합 점수와 퍼센티지를 계산한다.
 */
export function calculateScores(issues: Issue[]): ScoreResult {
  let blueNegative = 0;
  let bluePositive = 0;
  let redNegative = 0;
  let redPositive = 0;

  for (const issue of issues) {
    const score = calculateIssueScore(issue);
    if (score === 0) continue;

    const config = CATEGORY_MAP[issue.category];
    if (!config) continue;

    if (issue.camp === "blue") {
      if (config.isPositive) bluePositive += score;
      else blueNegative += score;
    } else {
      if (config.isPositive) redPositive += score;
      else redNegative += score;
    }
  }

  const blueNet = blueNegative - bluePositive;
  const redNet = redNegative - redPositive;
  const total = blueNet + redNet;

  const bluePct = total > 0 ? Math.round((blueNet / total) * 100) : 50;
  const redPct = total > 0 ? 100 - bluePct : 50;

  return {
    bluePct,
    redPct,
    blueNet: Math.round(blueNet * 100) / 100,
    redNet: Math.round(redNet * 100) / 100,
    blueNegative: Math.round(blueNegative * 100) / 100,
    bluePositive: Math.round(bluePositive * 100) / 100,
    redNegative: Math.round(redNegative * 100) / 100,
    redPositive: Math.round(redPositive * 100) / 100,
  };
}

/**
 * 카테고리별 건수와 점수를 집계한다.
 */
export function getCategoryBreakdown(issues: Issue[], camp: Camp) {
  const result: Record<string, { count: number; score: number }> = {};

  for (const issue of issues) {
    if (issue.camp !== camp) continue;
    const score = calculateIssueScore(issue);
    const cat = issue.category;
    if (!result[cat]) result[cat] = { count: 0, score: 0 };
    result[cat].count += 1;
    result[cat].score += score;
  }

  return result as Record<IssueCategory, { count: number; score: number }>;
}
