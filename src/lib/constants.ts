import type { CategoryConfig, IssueCategory, CriminalStage } from "@/types";

// ── 카테고리 설정 v1.1 ──
export const CATEGORIES: CategoryConfig[] = [
  // 점수 부여 (공식 처분)
  { key: "criminal_conviction",  label: "사법 기록",       description: "형사 유죄·기소·기소유예",           isScored: true,  isArchive: false },
  { key: "civil_judgment",       label: "민사 패소",       description: "민사 소송 패소 판결",               isScored: true,  isArchive: false },
  { key: "ethics_violation",     label: "윤리위·선관위",   description: "윤리위·선관위 처분",                isScored: true,  isArchive: false },
  { key: "factcheck_false",      label: "팩트체크 거짓",   description: "IFCN 인증 매체 false 판정",         isScored: true,  isArchive: false },
  { key: "self_admission",       label: "본인 시인",       description: "본인 공식 시인·사과",               isScored: true,  isArchive: false },
  { key: "official_misconduct",  label: "감사원 적발",     description: "감사원·국정감사 적발",              isScored: true,  isArchive: false },
  // Archive (점수 X)
  { key: "controversial_statement", label: "논란 발언",   description: "막말·논란 발언 (원문 보존)",         isScored: false, isArchive: true },
  { key: "policy_record",          label: "정책 기록",    description: "발의·표결·정책 이력",                isScored: false, isArchive: true },
  { key: "attendance_record",      label: "출석 기록",    description: "본회의·상임위 출석률",               isScored: false, isArchive: true },
  { key: "media_coverage",         label: "보도 모음",    description: "관련 보도 아카이브",                 isScored: false, isArchive: true },
  { key: "politician_sns",         label: "본인 SNS",     description: "본인 공식 SNS 게시물",              isScored: false, isArchive: true },
  // 입법 기록 (점수 X)
  { key: "bill_proposed",    label: "법안 발의",    description: "법안 발의/제안/제출",    isScored: false, isArchive: true },
  { key: "bill_committee",   label: "위원회 통과",  description: "상임위/소위 가결",       isScored: false, isArchive: true },
  { key: "bill_plenary",     label: "본회의 가결",  description: "국회 본회의 통과",       isScored: false, isArchive: true },
  { key: "bill_promulgated", label: "법률 공포",    description: "관보 게재, 법률 공포",   isScored: false, isArchive: true },
  { key: "bill_enforced",    label: "법률 시행",    description: "법률 시행/발효",         isScored: false, isArchive: true },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<IssueCategory, CategoryConfig>;

export const SCORED_CATEGORIES = CATEGORIES.filter((c) => c.isScored);
export const ARCHIVE_CATEGORIES = CATEGORIES.filter((c) => c.isArchive);

// ── 형사 단계 가중치 ──
export const CRIMINAL_STAGE_WEIGHT: Record<CriminalStage, number> = {
  investigation: 0,
  indicted: 2,
  suspended_indictment: 1.5,
  guilty_1st: 4,
  guilty_2nd: 6,
  confirmed: 10,
  pardoned: 10, // 점수 유지
  not_guilty: 0,
  no_charges: 0,
  dismissed: 0,
};

export const CRIMINAL_STAGE_LABEL: Record<CriminalStage, string> = {
  investigation: "수사 중",
  indicted: "기소",
  suspended_indictment: "기소유예",
  guilty_1st: "1심 유죄",
  guilty_2nd: "2심 유죄",
  confirmed: "대법 확정",
  pardoned: "사면",
  not_guilty: "무죄",
  no_charges: "혐의없음",
  dismissed: "각하",
};

// ── 직책 가중치 ──
export const POSITION_WEIGHT: Record<string, number> = {
  "대통령": 1.2,
  "총리": 1.0,
  "대표": 1.0,
  "원내대표": 1.0,
  "장관": 0.8,
  "의원": 0.8,
  "시장": 0.8,
  "도지사": 0.8,
  "후보": 0.5,
  "당직자": 0.5,
};

// ── 소스 티어 라벨 ──
export const SOURCE_TIER_LABEL: Record<number, string> = {
  1: "공식 기관",
  2: "팩트체크",
  3: "언론 보도",
  4: "보조 참고",
};

// ── 진영 컬러 ──
export const CAMP_COLORS = {
  blue: {
    primary: "#2563eb",
    glow: "#3b82f6",
    bg: "rgba(37, 99, 235, 0.08)",
    border: "rgba(37, 99, 235, 0.2)",
    label: "더불어민주당",
  },
  red: {
    primary: "#dc2626",
    glow: "#ef4444",
    bg: "rgba(220, 38, 38, 0.08)",
    border: "rgba(220, 38, 38, 0.2)",
    label: "국민의힘",
  },
} as const;

// ── 매체 진영 매핑 ──
export const MEDIA_LEAN: Record<string, string> = {
  "한겨레": "progressive",
  "경향신문": "progressive",
  "오마이뉴스": "progressive",
  "프레시안": "progressive",
  "민중의소리": "progressive",
  "KBS": "center",
  "MBC": "center",
  "SBS": "center",
  "연합뉴스": "center",
  "JTBC": "center",
  "YTN": "center",
  "뉴시스": "center",
  "한국일보": "center",
  "조선일보": "conservative",
  "중앙일보": "conservative",
  "동아일보": "conservative",
  "채널A": "conservative",
  "TV조선": "conservative",
  "문화일보": "conservative",
  "세계일보": "conservative",
};
