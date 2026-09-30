import type { Issue, IssueEvent, ScoreResult, Camp, IssueCategory, CreditEvent, NetScore } from "@/types";
import { CATEGORY_MAP, CRIMINAL_STAGE_WEIGHT, MEDIA_GROUPS } from "./constants";

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
      // 30일 뷰: 강한 감쇠 — 최근 이슈가 압도적으로 중요
      // 7일=0.70, 14일=0.50, 30일=0.22
      return Math.exp(-0.05 * daysSince);
    case "recent":
      // 1년 뷰: 완만한 감쇠 — 1년 전 이벤트도 48% 가중치 유지
      // 30일=0.94, 180일=0.70, 365일=0.48
      return Math.exp(-0.002 * daysSince);
    case "midterm":
      // 5년 뷰: 거의 균등 — 전 기간 고르게 반영
      // 1년=0.86, 3년=0.64, 5년=0.50
      return Math.max(0.4, Math.exp(-0.0003 * daysSince));
    case "alltime":
      // 역대: 로그 감쇠 — 10년 전 73%, 20년 전 58%, 30년 전 48%
      // 순수 누적 방지하되 역사 기록은 유지
      return 1 / (1 + 0.0001 * daysSince);
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

  // 출처 독립성 (2026-09-30: 진영 다양도에서 바뀌었다)
  const diversityMultiplier = independenceMultiplier(issue.cross_verified_sources);

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

    // 두 진영을 각각 본다. 어느 쪽도 아니면 세지 않는다 (M-02).
    // 예전에는 else 로 떨어뜨려 camp 이 무엇이든 빨강에 얹혔다 — 제3정당·무소속을
    // 담게 되는 순간 조용히 한쪽 몫이 된다. 합이 100% 로 맞춰지므로 화면에 안 보인다.
    if (issue.camp === "blue") {
      blueScore += score;
      blueCount++;
    } else if (issue.camp === "red") {
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

  // 출처 독립성 (2026-09-30: 진영 다양도에서 바뀌었다)
  const diversityMultiplier = independenceMultiplier(event.cross_verified_sources);

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
 * 독립된 출처가 몇 곳인가. 계열 매체는 한 곳으로 센다.
 *
 * 크롤러 `scorer.independent_sources` 와 **같은 규칙이어야 한다** —
 * 하네스 M-01 이 계단값을 대조한다.
 */
export function independentSources(sources?: { name: string }[] | null): number {
  const names = new Set((sources ?? []).map((s) => s.name).filter(Boolean));
  if (names.size === 0) return 0;
  const groups = new Set([...names].map((n) => MEDIA_GROUPS[n] ?? n));
  return groups.size;
}

/**
 * 출처 독립성 배수 0.7 / 1.0 / 1.3.
 *
 * ## 왜 진영이 아니라 이것인가 (2026-09-30 결정)
 *
 * 예전에는 진영 다양성(좌+중+우)으로 쟀다. 둘이 문제였다.
 *
 * **실제로 거의 작동하지 않았다.** 기사 765건 중 613건이 단독 보도라 다양성
 * 판정까지 가지도 못했고, 다양성으로 verified 된 건 16건뿐이었다.
 *
 * **그리고 우리가 정할 일이 아니었다.** "우리는 점수 매기지 않는다" 면서 매체의
 * 정치색을 우리가 정하는 건 모순이다. 진영은 매체명으로 보여주고 사용자가 판단한다.
 *
 * 계열은 공개된 소유 사실이라 확인하는 것이지 정하는 게 아니다.
 *
 * ⚠️ 아직 못 거르는 것: **통신사 받아쓰기.** 연합뉴스 기사를 그대로 옮긴 매체
 *    다섯 곳은 사실 한 곳이다. 원문 유사도로 잡아야 하고 크롤러 쪽에서 붙인다.
 *    그때까지 이 값은 낙관적이다.
 */
export function independenceMultiplier(sources?: { name: string }[] | null): number {
  const n = independentSources(sources);
  if (n >= 3) return 1.3;
  if (n >= 2) return 1.0;
  return 0.7;
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

    // 두 진영을 각각 본다 (M-02). 위 calculateScores 와 같은 이유다.
    if (event.camp === "blue") {
      blueScore += score;
      blueCount++;
    } else if (event.camp === "red") {
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

/**
 * 감경 점수 계산
 *
 * gross_score: 기존 부정 점수 (원본 보존)
 * credit_ratio: Σ credit_values (최대 0.7 = 70% 캡)
 * net_score: gross_score × max(0.3, 1 - credit_ratio)
 */
export function calculateNetEventScore(
  event: IssueEvent,
  credits: CreditEvent[],
  view: ScoreView = "recent",
): NetScore {
  const grossScore = calculateEventScore(event, view);

  if (grossScore === 0 || credits.length === 0) {
    return { grossScore, creditRatio: 0, netScore: grossScore };
  }

  const rawRatio = credits.reduce((sum, c) => sum + c.credit_value, 0);
  const creditRatio = Math.min(rawRatio, 0.7); // 70% 감경 캡
  const netScore = Math.round(grossScore * Math.max(0.3, 1 - creditRatio) * 100) / 100;

  return { grossScore, creditRatio, netScore };
}
