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
  | "politician_sns"          // 본인 SNS
  | "social_controversy";     // 사회 이슈 (정치권 확산)

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
  /** 확정된 예정 일정 1건 (021). 크롤러가 채운다 — 없으면 null */
  next_branch?: { date: string; title: string; description?: string; source_url?: string } | null;
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

// ── 감경 시스템 (양형기준 2단계 인자 체계) ──

export type CreditType = "special" | "general";

export type SpecialCreditCategory =
  | "damage_recovery"          // 피해 회복
  | "voluntary_surrender"      // 자진 출석/신고
  | "whistleblowing"           // 내부 고발
  | "legislative_achievement"; // 입법 성과

export type GeneralCreditCategory =
  | "full_attendance"    // 전체 출석
  | "asset_disclosure"   // 재산 공개
  | "ethics_clean"       // 윤리 무결
  | "oversight_active"   // 감사 활동
  | "donation_legal";    // 합법 후원

export type CreditCategory = SpecialCreditCategory | GeneralCreditCategory;

export interface CreditEvent {
  id: string;
  event_id: string | null;
  actor_name: string;
  camp: Camp;
  credit_type: CreditType;
  credit_category: CreditCategory;
  description: string | null;
  source_url: string | null;
  source_name: string | null;
  verified: boolean;
  credit_value: number;
  effective_date: string | null;
  created_at: string;
}

// ── 유사 사례 비교 ──

export interface SimilarCase {
  id: string;
  representative_issue_id: string;
  actor_name: string | null;
  category: IssueCategory;
  camp: Camp;
  summary: string | null;
  weighted_score: number;
  criminal_stage: CriminalStage | null;
  first_reported_at: string;
  similarity: number;
}

// ── 감경 반영 점수 ──

export interface NetScore {
  grossScore: number;
  creditRatio: number;
  netScore: number;
}

// ── 사안(Storyline) — 사건(event) 위의 층 ──
//
// event(issue_clusters)는 7일 윈도우로 묶인 "뉴스 사이클"이라, 몇 년에 걸친 하나의
// 사안은 여러 event 로 흩어진다. Storyline 은 그 event 들을 사람이 읽을 수 있는
// 줄거리로 엮는 층이다. 요지·장 제목·인과 한 줄은 클러스터링에서 나오지 않는다 —
// 사람이 쓰고 승인한 것만 올린다.

/**
 * 근거 등급. 이 제품이 인터넷 검색으로는 못 얻는 걸 주는 지점이다.
 * 확정된 사실 / 수사기관의 혐의 / 한쪽의 주장이 섞이면 독자는 전부를 사실로 읽는다.
 */
export type EvidenceGrade = "confirmed" | "alleged" | "claim";

export interface StoryArticle {
  /** 사안 안에서만 고유하면 된다. 모달 URL(?a=)에 실린다 */
  id: string;
  title: string;
  /** YYYY-MM-DD */
  published_at: string;
  source_name: string;
  /** "법원" "검찰" "공식기록" "종합일간지" 같은 출처 성격 */
  source_kind: string;
  grade: EvidenceGrade;
  /** 모달 본문. 없으면 제목·출처만 보여준다 */
  body?: string;
  source_url?: string;
  /** 수집된 실제 기사와 이어졌으면 /issues/<id> 로 보낸다 */
  issue_id?: string;
  cross_verified?: string[];
}

export interface StoryChapter {
  id: string;
  /** ① ② ③ … 표시용 */
  ordinal: string;
  /** "2015.3", "2022 – 2023" 처럼 자유 형식 */
  when: string;
  grade: EvidenceGrade;
  /** 명사가 아니라 문장. 제목만 훑어도 줄거리가 되어야 한다 */
  title: string;
  body: string;
  /** 다음 장으로 잇는 인과 한 줄. 마지막 장은 비운다 */
  link?: string;
  articles: StoryArticle[];
}

export interface StoryPerson {
  name: string;
  role: string;
  /** 이 사람이 등장하는 장 */
  chapter_ids: string[];
}

export interface StoryDisputeSide {
  text: string;
  source: string;
}

export interface StoryDispute {
  question: string;
  claim: StoryDisputeSide;
  counter: StoryDisputeSide;
}

export interface StoryFigure {
  value: string;
  label: string;
}

export interface RelatedStory {
  /** "같은 사건" "이어진 사건" "파생 사건" */
  kind: string;
  name: string;
  why: string;
  /** 사안 페이지가 있으면 링크 */
  slug?: string;
}

export interface StorylineSummary {
  slug: string;
  title: string;
  /** 주 대상 기준. 양측이 모두 처분 대상이면 "both" */
  camp: Camp | "both";
  /** 사안 자체의 진행 상태 */
  status: "ongoing" | "closed";
  /** "2심 선고 대기", "대법 확정 유죄 · 특별사면", "공소시효 만료" */
  status_label: string;
  /** 사안의 시작일. 경과일 계산 기준 */
  started_at: string;
  /** 종결 사안의 종료일. 진행중이면 비운다 */
  ended_at?: string | null;
  /** 한 줄 요지 — 목록 카드에서 쓴다 */
  blurb: string;
  /** 아래 둘은 원고에 적지 않는다. 손으로 적으면 장이 늘 때 어긋난다 — 코드가 센다 */
  chapter_count: number;
  article_count: number;
}

/** 원고. 개수는 코드가 세므로 여기에는 적지 않는다 */
export interface Storyline extends Omit<StorylineSummary, "chapter_count" | "article_count"> {
  /** 30초 요약. 문단 배열 — 첫 문단이 리드다 */
  lead: string[];
  figures: StoryFigure[];
  people: StoryPerson[];
  chapters: StoryChapter[];
  disputes: StoryDispute[];
  next_branch?: { date: string; title: string; description?: string } | null;
  /**
   * 종결 사안의 결말. 반드시 채운다 — 유죄만큼 무죄·혐의없음·공소시효 만료·
   * 흐지부지도 같은 크기로 보여야 한다. 한쪽만 기록하면 그게 편향이다.
   */
  outcome?: { label: string; description: string } | null;
  related: RelatedStory[];
}
