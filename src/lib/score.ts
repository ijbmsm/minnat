import type { Issue, IssueEvent, ScoreResult, Camp, IssueCategory } from "@/types";
import { CATEGORY_MAP, CRIMINAL_STAGE_WEIGHT } from "./constants";

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
  const days = (Date.now() - new Date(issue.published_at).getTime()) / 86400000;
  switch (view) {
    case "hot": return days <= 30;
    case "recent": return days <= 365;
    case "midterm": return days <= 1825;
    case "alltime": return true;
  }
}

/**
 * v1.1 점수 공식
 *
 * base_score = coverage_count_norm × 0.40
 *            + official_stage × 0.35
 *            + headline_days_norm × 0.25
 *
 * final = base_score × media_diversity × position_weight × time_decay
 *
 * 점수 카테고리(공식 처분)만 점수 부여. archive/입법은 0.
 */
export function calculateIssueScore(issue: Issue, view: ScoreView = "recent"): number {
  const config = CATEGORY_MAP[issue.category];
  if (!config || !config.isScored) return 0;

  // Tier 4 차단
  if (issue.source_tier === 4) return 0;
  // Tier 3 미검증 차단
  if (issue.source_tier === 3 && !issue.verified) return 0;

  // 보도량 정규화 (1~20+ → 0~1)
  const coverageNorm = Math.min(issue.coverage_count / 15, 1);

  // 공식 처리 단계 (형사 = 단계별 가중치, 나머지 = 기본 5)
  let officialStage = 5;
  if (issue.category === "criminal_conviction" && issue.criminal_stage) {
    officialStage = CRIMINAL_STAGE_WEIGHT[issue.criminal_stage] ?? 0;
    if (officialStage === 0) return 0; // 혐의없음/무죄/각하 = 점수 0
  }
  const stageNorm = Math.min(officialStage / 10, 1);

  // 헤드라인 지속일수 (1~30+ → 0~1)
  const headlineNorm = Math.min(issue.headline_days / 20, 1);

  // base_score
  const baseScore = coverageNorm * 0.40 + stageNorm * 0.35 + headlineNorm * 0.25;

  // 진영 다양도 (cross_verified_sources에서 계산)
  const leans = new Set(issue.cross_verified_sources?.map((s) => s.lean) ?? []);
  let diversityMultiplier = 0.7; // 단독
  if (leans.size >= 3) diversityMultiplier = 1.3; // 좌+중+우
  else if (leans.size >= 2) diversityMultiplier = 1.0; // 두 진영

  // 직책 가중치
  const posWeight = issue.position_weight || 0.8;

  // 시간 감쇠
  const daysSince = Math.max(0, (Date.now() - new Date(issue.published_at).getTime()) / 86400000);
  const decay = viewDecay(daysSince, view);

  // 최종 점수 (0~100 스케일)
  const raw = baseScore * diversityMultiplier * posWeight * decay;
  const score = Math.min(raw * 100, 100);

  return Math.round(score * 100) / 100;
}

/**
 * 진영별 점수 합산
 */
export function calculateScores(issues: Issue[], view: ScoreView = "recent"): ScoreResult {
  let blueScore = 0;
  let redScore = 0;
  let blueCount = 0;
  let redCount = 0;

  for (const issue of issues) {
    if (!filterByView(issue, view)) continue;
    const score = calculateIssueScore(issue, view);
    if (score === 0) continue;

    if (issue.camp === "blue") {
      blueScore += score;
      blueCount++;
    } else {
      redScore += score;
      redCount++;
    }
  }

  const total = blueScore + redScore;
  const bluePct = total > 0 ? Math.round((blueScore / total) * 100) : 50;
  const redPct = total > 0 ? 100 - bluePct : 50;

  return {
    bluePct,
    redPct,
    blueScore: Math.round(blueScore * 100) / 100,
    redScore: Math.round(redScore * 100) / 100,
    blueCount,
    redCount,
    bluePerCapita: blueCount > 0 ? Math.round((blueScore / blueCount) * 100) / 100 : 0,
    redPerCapita: redCount > 0 ? Math.round((redScore / redCount) * 100) / 100 : 0,
  };
}

/**
 * Event 레벨 점수 계산 — issue 대신 event의 집계 메트릭 사용
 */
export function calculateEventScore(event: IssueEvent, view: ScoreView = "recent"): number {
  const config = CATEGORY_MAP[event.category];
  if (!config || !config.isScored) return 0;

  if (event.source_tier === 4) return 0;
  if (event.source_tier === 3 && !event.verified) return 0;

  const coverageNorm = Math.min(event.coverage_count / 15, 1);

  let officialStage = 5;
  if (event.category === "criminal_conviction" && event.criminal_stage) {
    officialStage = CRIMINAL_STAGE_WEIGHT[event.criminal_stage] ?? 0;
    if (officialStage === 0) return 0;
  }
  const stageNorm = Math.min(officialStage / 10, 1);

  const headlineNorm = Math.min(event.headline_days / 20, 1);
  const baseScore = coverageNorm * 0.40 + stageNorm * 0.35 + headlineNorm * 0.25;

  const leans = new Set(event.cross_verified_sources?.map((s) => s.lean) ?? []);
  let diversityMultiplier = 0.7;
  if (leans.size >= 3) diversityMultiplier = 1.3;
  else if (leans.size >= 2) diversityMultiplier = 1.0;

  const posWeight = event.position_weight || 0.8;

  const refDate = event.last_reported_at || event.first_reported_at || event.created_at;
  const daysSince = Math.max(0, (Date.now() - new Date(refDate).getTime()) / 86400000);
  const decay = viewDecay(daysSince, view);

  const raw = baseScore * diversityMultiplier * posWeight * decay;
  return Math.round(Math.min(raw * 100, 100) * 100) / 100;
}

function filterEventByView(event: IssueEvent, view: ScoreView): boolean {
  const refDate = event.last_reported_at || event.created_at;
  const days = (Date.now() - new Date(refDate).getTime()) / 86400000;
  switch (view) {
    case "hot": return days <= 30;
    case "recent": return days <= 365;
    case "midterm": return days <= 1825;
    case "alltime": return true;
  }
}

/**
 * Event 기반 진영별 점수 합산
 */
export function calculateEventScores(events: IssueEvent[], view: ScoreView = "recent"): ScoreResult {
  let blueScore = 0;
  let redScore = 0;
  let blueCount = 0;
  let redCount = 0;

  for (const event of events) {
    if (!filterEventByView(event, view)) continue;
    const score = calculateEventScore(event, view);
    if (score === 0) continue;

    if (event.camp === "blue") {
      blueScore += score;
      blueCount++;
    } else {
      redScore += score;
      redCount++;
    }
  }

  const total = blueScore + redScore;
  const bluePct = total > 0 ? Math.round((blueScore / total) * 100) : 50;
  const redPct = total > 0 ? 100 - bluePct : 50;

  return {
    bluePct,
    redPct,
    blueScore: Math.round(blueScore * 100) / 100,
    redScore: Math.round(redScore * 100) / 100,
    blueCount,
    redCount,
    bluePerCapita: blueCount > 0 ? Math.round((blueScore / blueCount) * 100) / 100 : 0,
    redPerCapita: redCount > 0 ? Math.round((redScore / redCount) * 100) / 100 : 0,
  };
}

/**
 * 카테고리별 집계
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
