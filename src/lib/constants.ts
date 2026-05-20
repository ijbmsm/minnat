import type { CategoryConfig, IssueCategory, Severity, ImpactScope } from "@/types";

// ── 카테고리 설정 ──
export const CATEGORIES: CategoryConfig[] = [
  { key: "crime",         label: "범죄/사법",     description: "기소, 유죄 판결, 구속, 수사 중",           baseWeight: 10, isPositive: false, isScored: true },
  { key: "corruption",    label: "부정부패/비리",  description: "뇌물, 횡령, 배임, 이권 개입",             baseWeight: 9,  isPositive: false, isScored: true },
  { key: "policy_fail",   label: "정책 실패",     description: "입법/행정 실패로 측정 가능한 국민 피해",    baseWeight: 8,  isPositive: false, isScored: true },
  { key: "promise_broke", label: "공약 불이행",    description: "약속 파기, 공약 폐기",                    baseWeight: 7,  isPositive: false, isScored: true },
  { key: "hypocrisy",     label: "위선/이중잣대",  description: "내로남불, 과거 발언 모순 (팩트체크 확인)",   baseWeight: 6,  isPositive: false, isScored: true },
  { key: "division",      label: "논란/갈등 조장", description: "지역, 세대, 성별 갈등 발언 (발언 원문 기준)", baseWeight: 5,  isPositive: false, isScored: true },
  { key: "slander",       label: "막말/폭언",     description: "비속어, 혐오 발언, 인신공격 (영상/기록)",   baseWeight: 4,  isPositive: false, isScored: true },
  { key: "policy_win",    label: "정책 성공",     description: "입법/행정 성공으로 측정 가능한 국민 이익",   baseWeight: 7,  isPositive: true,  isScored: true },
  { key: "promise_kept",  label: "공약 이행",     description: "공약 이행률 기반 (선관위 공약 대조)",       baseWeight: 6,  isPositive: true,  isScored: true },
  { key: "charity",       label: "선행/봉사",     description: "기부, 봉사, 사비 출연 (금액/규모 확인)",   baseWeight: 5,  isPositive: true,  isScored: true },
  { key: "controversial", label: "논란 정책",     description: "가치 판단이 갈리는 정책 (점수 미반영)",     baseWeight: 0,  isPositive: false, isScored: false },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<IssueCategory, CategoryConfig>;

// ── 심각도 배수 ──
export const SEVERITY_MULTIPLIER: Record<Severity, number> = {
  mild: 1.0,
  normal: 1.5,
  severe: 2.0,
  extreme: 3.0,
};

// ── 영향 범위 배수 ──
export const IMPACT_MULTIPLIER: Record<ImpactScope, number> = {
  individual: 0.5,
  regional: 0.8,
  national: 1.0,
  international: 1.2,
};

// ── 시간 감쇠 ──
const DECAY_LAMBDA = 0.01;
export function timeDecay(daysSincePublished: number): number {
  return Math.exp(-DECAY_LAMBDA * daysSincePublished);
}

// ── 심각도 한글 ──
export const SEVERITY_LABEL: Record<Severity, string> = {
  mild: "경미",
  normal: "보통",
  severe: "중대",
  extreme: "극심",
};

// ── 영향범위 한글 ──
export const IMPACT_LABEL: Record<ImpactScope, string> = {
  individual: "개인",
  regional: "지역",
  national: "전국",
  international: "국제",
};

// ── 소스 티어 라벨 ──
export const SOURCE_TIER_LABEL: Record<number, string> = {
  1: "공식 기관",
  2: "팩트체크 기관",
  3: "주요 언론",
  4: "보조 참고",
};

// ── 진영 컬러 ──
export const CAMP_COLORS = {
  blue: {
    primary: "#2563eb",
    glow: "#3b82f6",
    bg: "rgba(37, 99, 235, 0.08)",
    border: "rgba(37, 99, 235, 0.2)",
    label: "더불어민주당 계열",
  },
  red: {
    primary: "#dc2626",
    glow: "#ef4444",
    bg: "rgba(220, 38, 38, 0.08)",
    border: "rgba(220, 38, 38, 0.2)",
    label: "국민의힘 계열",
  },
} as const;
