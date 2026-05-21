// ── 진영 ──
export type Camp = "blue" | "red";
export type UserCamp = Camp | "none";

// ── 이슈 카테고리 v1.1 ──

// 점수 부여 카테고리 (공식 처분만)
export type ScoredCategory =
  | "criminal_conviction"  // 형사 유죄 (단계별)
  | "civil_judgment"       // 민사 패소
  | "ethics_violation"     // 윤리위·선관위 처분
  | "factcheck_false"      // IFCN false 판정
  | "self_admission"       // 본인 공식 시인·사과
  | "official_misconduct"; // 감사원·국정감사 적발

// Archive 카테고리 (점수 X, 기록만)
export type ArchiveCategory =
  | "controversial_statement" // 막말·논란 발언
  | "policy_record"           // 발의·표결 이력
  | "attendance_record"       // 출석률
  | "media_coverage"          // 보도 모음
  | "politician_sns";         // 본인 SNS

// 입법 기록 (점수 X, 사실 기록만)
export type BillCategory =
  | "bill_proposed"    // 법안 발의
  | "bill_committee"   // 위원회 통과
  | "bill_plenary"     // 본회의 가결
  | "bill_promulgated" // 법률 공포
  | "bill_enforced";   // 법률 시행

export type IssueCategory = ScoredCategory | ArchiveCategory | BillCategory;

// ── 형사 단계 ──
export type CriminalStage =
  | "investigation"          // 수사 착수
  | "indicted"               // 기소
  | "suspended_indictment"   // 기소유예
  | "guilty_1st"             // 1심 유죄
  | "guilty_2nd"             // 2심 유죄
  | "confirmed"              // 대법 확정
  | "pardoned"               // 사면
  | "not_guilty"             // 무죄
  | "no_charges"             // 혐의없음
  | "dismissed";             // 각하

// ── 신뢰도 등급 ──
export type TrustLevel = "high" | "medium" | "low" | "pending";

export type SourceTier = 1 | 2 | 3 | 4;

// ── 카테고리 설정 ──
export interface CategoryConfig {
  key: IssueCategory;
  label: string;
  description: string;
  isScored: boolean;
  isArchive: boolean;
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
  position_weight: number;
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
  source_tier: SourceTier;
  source_url: string;
  source_name: string;
  weighted_score: number;
  ai_analysis: AiAnalysis | null;
  published_at: string;
  created_at: string;
  verified: boolean;
  verification_note: string | null;
  trust_level: TrustLevel;
  criminal_stage: CriminalStage | null;
  coverage_count: number;
  headline_days: number;
  is_archive: boolean;
  position_weight: number;
  actor_name: string | null;
  actor_party: string | null;
  cross_verified_sources: CrossSource[];
  politician?: Politician;
}

export interface CrossSource {
  name: string;
  lean: string;
}

export interface AiAnalysis {
  confidence: number;
  reasoning: string;
  category_rationale: string;
  camp_reasoning: string;
  evidence_sentence: string;
  criminal_stage_reasoning: string | null;
}

export interface ScoreSnapshot {
  id: string;
  date: string;
  blue_score: number;
  red_score: number;
  blue_pct: number;
  red_pct: number;
  blue_count: number;
  red_count: number;
  created_at: string;
}

// ── 점수 계산 ──
export interface ScoreResult {
  bluePct: number;
  redPct: number;
  blueScore: number;
  redScore: number;
  blueCount: number;
  redCount: number;
  bluePerCapita: number;
  redPerCapita: number;
}
