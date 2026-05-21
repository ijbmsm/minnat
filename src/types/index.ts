// ── 진영 ──
export type Camp = "blue" | "red";
export type UserCamp = Camp | "none";

// ── 이슈 카테고리 ──
export type IssueCategory =
  | "crime"            // 범죄/사법
  | "corruption"       // 부정부패/비리
  | "hypocrisy"        // 위선/이중잣대
  | "slander"          // 막말/폭언
  | "division"         // 논란/갈등 조장
  | "policy_fail"      // 정책 실패
  | "policy_win"       // 정책 성공 (레거시, 하위호환)
  | "bill_proposed"    // 법안 발의
  | "bill_committee"   // 위원회 통과
  | "bill_plenary"     // 본회의 가결
  | "bill_promulgated" // 법률 공포
  | "bill_enforced"    // 법률 시행
  | "promise_kept"     // 공약 이행
  | "promise_broke"    // 공약 불이행
  | "charity"          // 선행/봉사
  | "controversial";   // 논란 정책 (점수 미반영)

export type Severity = "mild" | "normal" | "severe" | "extreme";
export type ImpactScope = "individual" | "regional" | "national" | "international";
export type SourceTier = 1 | 2 | 3 | 4;

// ── 카테고리 설정 ──
export interface CategoryConfig {
  key: IssueCategory;
  label: string;
  description: string;
  baseWeight: number;
  isPositive: boolean;
  isScored: boolean; // controversial = false
}

// ── DB 모델 ──
export interface Party {
  id: string;
  name: string;
  color: string;
  camp: Camp;
  created_at: string;
}

export interface Politician {
  id: string;
  name: string;
  party_id: string;
  position: string | null;
  region: string | null;
  profile_image: string | null;
  active: boolean;
  created_at: string;
  party?: Party;
}

export interface Issue {
  id: string;
  title: string;
  summary: string;
  category: IssueCategory;
  camp: Camp;
  politician_id: string | null;
  severity: Severity;
  impact_scope: ImpactScope;
  source_tier: SourceTier;
  source_url: string;
  source_name: string;
  raw_score: number;
  weighted_score: number;
  ai_analysis: AiAnalysis | null;
  published_at: string;
  created_at: string;
  verified: boolean;
  verification_note: string | null;
  politician?: Politician;
}

export interface AiAnalysis {
  confidence: number;
  reasoning: string;
  category_rationale: string;
  severity_rationale: string;
}

export interface ScoreSnapshot {
  id: string;
  date: string;
  blue_negative: number;
  blue_positive: number;
  red_negative: number;
  red_positive: number;
  blue_net: number;
  red_net: number;
  blue_pct: number;
  red_pct: number;
  breakdown: CategoryBreakdown | null;
  created_at: string;
}

export interface CategoryBreakdown {
  blue: Record<IssueCategory, { count: number; score: number }>;
  red: Record<IssueCategory, { count: number; score: number }>;
}

// ── 점수 계산 ──
export interface ScoreResult {
  bluePct: number;
  redPct: number;
  blueNet: number;
  redNet: number;
  blueNegative: number;
  bluePositive: number;
  redNegative: number;
  redPositive: number;
  bluePerCapita: number;
  redPerCapita: number;
  blueCount: number;
  redCount: number;
}
