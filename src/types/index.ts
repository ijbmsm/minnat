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
  event_id: string | null;
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

// ── 사건 (Event = issue_clusters) ──
export interface IssueEvent {
  id: string;
  representative_issue_id: string;
  representative_issue?: Issue;
  actor_name: string | null;
  category: IssueCategory;
  camp: Camp;
  issue_count: number;
  coverage_count: number;
  headline_days: number;
  media_diversity_score: number;
  trust_level: TrustLevel;
  verified: boolean;
  weighted_score: number;
  cross_verified_sources: CrossSource[];
  first_reported_at: string;
  last_reported_at: string;
  criminal_stage: CriminalStage | null;
  position_weight: number;
  source_tier: SourceTier;
  summary: string | null;
  is_active: boolean;
  member_issues?: Issue[];
  created_at: string;
}

// ── 전 대통령 ──
export type TermEndReason = "normal" | "impeachment" | "resignation" | "assassination" | "coup" | "ongoing";

export interface PresidentProfile {
  id: string;
  politician_id: string;
  term_start: string;
  term_end: string | null;
  term_number: number;
  term_ended_by: TermEndReason;
  party_at_time: string;
  created_at: string;
  politician?: Politician & { party?: Party };
}

export interface PresidentAssociate {
  id: string;
  president_id: string;
  name: string;
  relation: string;
  category: string;
  criminal_stage: string | null;
  description: string;
  sentence: string | null;
  date: string | null;
  source_url: string | null;
}

export interface PresidentPardon {
  id: string;
  president_id: string;
  direction: "granted" | "received";
  target_name: string;
  target_role: string | null;
  original_charge: string | null;
  original_sentence: string | null;
  pardon_date: string;
  pardoned_by: string | null;
}

export interface PresidentEconomy {
  id: string;
  president_id: string;
  year: number;
  gdp_growth: number | null;
  unemployment: number | null;
  inflation: number | null;
  household_debt_gdp: number | null;
  gini_coefficient: number | null;
}

export type PromiseStatus = "fulfilled" | "partial" | "broken" | "ongoing" | "not_started" | "impossible";

export interface PresidentPromise {
  id: string;
  president_id: string;
  promise: string;
  category: string | null;
  status: PromiseStatus;
  detail: string | null;
}

export interface PresidentAppointment {
  id: string;
  president_id: string;
  appointee_name: string;
  position_appointed: string;
  issue: string;
  result: string | null;
  date: string | null;
}

export interface PresidentFull extends PresidentProfile {
  associates: PresidentAssociate[];
  pardons: PresidentPardon[];
  economy: PresidentEconomy[];
  promises: PresidentPromise[];
  appointments: PresidentAppointment[];
  events: IssueEvent[];
}

// ── 제보 ──
export type ReportStatus = "pending" | "reviewing" | "accepted" | "rejected";

export interface Report {
  id: string;
  reporter_name: string;
  actor_name: string;
  category: string;
  description: string;
  source_url: string;
  status: ReportStatus;
  admin_note: string | null;
  created_at: string;
}

// ── 유저 ──
export type DisplayCamp = "blue" | "red" | "free";

export interface UserProfile {
  id: string;
  kakao_nickname: string | null;
  profile_image: string | null;
  display_camp: DisplayCamp;
  created_at: string;
}

// ── 게시판 ──
export interface BoardPost {
  id: string;
  user_id: string;
  camp: DisplayCamp;
  title: string;
  content: string;
  like_count: number;
  view_count: number;
  created_at: string;
}

export interface BoardLike {
  user_id: string;
  post_id: string;
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
