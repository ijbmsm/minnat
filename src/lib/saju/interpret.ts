import type { Stem, Element, Sipshin } from './constants';

// ── 일간별 핵심 성격 ──
export const DAY_MASTER_PROFILE: Record<Stem, {
  keyword: string[];
  core: string;
  strength: string;
  weakness: string;
  vibe: string; // 술자리용 한 줄 ㅋㅋ
}> = {
  갑: {
    keyword: ['리더십', '고집', '직진'],
    core: '큰 나무처럼 곧게 자란다. 한번 정하면 꺾이지 않는다.',
    strength: '추진력, 정직함, 의리. 목표를 향해 직선으로 달린다.',
    weakness: '융통성 부족. 타협이 어렵고 꼰대 기질 잠재.',
    vibe: '자기가 리더 안 하면 불안한 타입. 근데 진짜 잘함.',
  },
  을: {
    keyword: ['적응력', '눈치', '유연'],
    core: '덩굴처럼 감고 올라간다. 겉은 부드럽지만 속은 단단하다.',
    strength: '사교성, 공감 능력, 상황 파악. 어디서든 살아남는다.',
    weakness: '우유부단해 보일 수 있음. 속마음 숨김.',
    vibe: '다 맞춰주는 척하다가 결국 자기 뜻대로 함.',
  },
  병: {
    keyword: ['에너지', '존재감', '낙관'],
    core: '태양처럼 환하다. 있는 것만으로 분위기를 만든다.',
    strength: '활기, 리더십, 긍정 에너지. 주변을 밝게 함.',
    weakness: '충동적, 자기중심적. 주목 못 받으면 힘들어함.',
    vibe: '파티장 켜지는 순간부터 이 사람이 주인공 됨.',
  },
  정: {
    keyword: ['집중력', '감성', '섬세'],
    core: '촛불처럼 작지만 강렬하다. 한 가지에 깊이 파고든다.',
    strength: '집중력, 정교함, 진심. 믿으면 끝까지 함.',
    weakness: '걱정 많음. 상처 잘 받고 오래 기억함.',
    vibe: '겉보기엔 조용한데 혼자 생각 엄청 많이 함.',
  },
  무: {
    keyword: ['안정', '포용', '신뢰'],
    core: '큰 산처럼 든든하다. 흔들리지 않고 다 받아준다.',
    strength: '믿음직함, 인내, 포용력. 오래 갈 관계 만든다.',
    weakness: '변화 거부. 느리다는 말 듣기 쉬움.',
    vibe: '갑자기 이직하거나 이사하는 타입은 아님. 근데 그래서 안심됨.',
  },
  기: {
    keyword: ['현실', '배려', '부지런'],
    core: '기름진 논밭처럼 풍요롭다. 뭐든 키워내는 능력이 있다.',
    strength: '실용적, 배려심, 성실. 알게 모르게 다 챙김.',
    weakness: '걱정이 너무 많고 소심해질 수 있음.',
    vibe: '아무 말 안 했는데 네가 뭐 필요한지 알고 미리 준비해놓음.',
  },
  경: {
    keyword: ['정의', '직설', '원칙'],
    core: '원석처럼 강하고 거칠다. 하고 싶은 말 다 한다.',
    strength: '결단력, 정의감, 추진력. 옳다고 생각하면 밀어붙임.',
    weakness: '인정 없어 보임. 공감 표현 서툼.',
    vibe: '팩폭 날릴 때 표정 하나 안 변함.',
  },
  신: {
    keyword: ['완벽', '자존심', '심미'],
    core: '보석처럼 예민하고 아름답다. 자기 기준이 높다.',
    strength: '완성도, 미적 감각, 자기관리. 디테일이 남다름.',
    weakness: '상처 잘 받음. 자존심 때문에 손해 볼 때 있음.',
    vibe: '기분 상하면 티는 안 내는데 절대 안 잊음.',
  },
  임: {
    keyword: ['자유', '기획', '다재다능'],
    core: '큰 강처럼 넓고 자유롭다. 생각과 행동 반경이 넓다.',
    strength: '창의성, 기획력, 적응력. 새로운 것에 빠르다.',
    weakness: '변덕. 깊이보다 넓이. 끈기가 약할 수 있음.',
    vibe: '아이디어 샘이 터지는데 실행은 종종 흐지부지.',
  },
  계: {
    keyword: ['직관', '감수성', '친화력'],
    core: '이슬비처럼 은은하다. 말 안 해도 다 느낀다.',
    strength: '공감, 직관력, 섬세함. 사람 마음 읽는 능력.',
    weakness: '우유부단. 자기 감정 처리 어려울 때 있음.',
    vibe: '겉은 조용한데 내면 세계가 드라마 50부작임.',
  },
};

// ── 오행 과다·부족 멘트 ──
type Balance = 'excess' | 'lack';

export const ELEMENT_COMMENT: Record<Element, Record<Balance, string>> = {
  목: {
    excess: '고집과 방향성이 강함. 한번 정한 건 안 꺾임. 유연성이 필요.',
    lack:   '추진력·방향감각이 약해질 수 있음. 결정을 자꾸 미룰 때 있음.',
  },
  화: {
    excess: '열정 넘치고 표현력 강함. 즉흥적 결정에 주의.',
    lack:   '활력·열정이 가라앉기 쉬움. 동기부여가 외부 의존적.',
  },
  토: {
    excess: '안정 추구, 보수적. 변화를 꺼리고 새 시작에 느림.',
    lack:   '현실 감각과 중심 잡기가 어려울 수 있음. 붕 뜨는 느낌.',
  },
  금: {
    excess: '원칙·냉철함이 강함. 예민하고 완벽주의 경향.',
    lack:   '결단력이 약함. 마무리가 잘 안 됨. 매듭 못 짓는 타입.',
  },
  수: {
    excess: '생각이 많고 계획은 철저함. 실행보다 분석에서 막힐 때 있음.',
    lack:   '유연성·지혜가 부족해질 수 있음. 고집스러운 흑백논리.',
  },
};

// ── 십신 설명 ──
export const SIPSHIN_DESC: Record<Sipshin, { short: string; detail: string }> = {
  비견: {
    short: '나 자신·동료',
    detail: '독립심과 자존심. 경쟁심도 있지만 의리도 강함. 비슷한 사람끼리 뭉침.',
  },
  겁재: {
    short: '라이벌·강한 자아',
    detail: '추진력 강하고 승부욕 넘침. 재물 취득과 손실이 모두 클 수 있음.',
  },
  식신: {
    short: '재능·표현·식복',
    detail: '창의성과 표현력이 풍부. 먹복 있고 낙천적. 예술·요리·말재주.',
  },
  상관: {
    short: '비범함·자유로운 영혼',
    detail: '위아래 없는 자유로운 기질. 비범한 재능이 있지만 규칙과 충돌.',
  },
  편재: {
    short: '사업·투기·큰 재물',
    detail: '넓은 인맥과 사업 감각. 큰 걸 노리지만 리스크도 큼.',
  },
  정재: {
    short: '안정적 재물·성실',
    detail: '착실히 모으는 타입. 현실적이고 절약 잘함. 안정 추구.',
  },
  편관: {
    short: '카리스마·도전·스트레스',
    detail: '강한 에너지와 카리스마. 도전을 즐기지만 스트레스 원인이기도.',
  },
  정관: {
    short: '규칙·명예·사회적 인정',
    detail: '원칙 준수, 체면 중시. 사회적 지위와 인정을 중요하게 여김.',
  },
  편인: {
    short: '직관·비정형 학습',
    detail: '독특한 방식으로 배움. 영감과 직관이 강함. 편협해질 수 있음.',
  },
  정인: {
    short: '바른 학문·보호·모성',
    detail: '지식과 배움에 투자. 보호받는 관계. 성실하고 바른 방향으로 성장.',
  },
};

// ── 궁합 키워드 (일간 × 일간) ──
// 일단 오행 조합 기준 간단 버전
type CompatLevel = '최상' | '상' | '중' | '하';

export interface CompatResult {
  level: CompatLevel;
  emoji: string;
  comment: string;
}

const COMPAT_TABLE: Partial<Record<Element, Partial<Record<Element, CompatResult>>>> = {
  목: {
    목: { level: '중', emoji: '🌲', comment: '둘 다 고집이 세서 경쟁하거나 의기투합하거나 극단적' },
    화: { level: '최상', emoji: '🔥', comment: '목이 화를 살려줌. 서로 에너지 넘침. 불꽃 케미' },
    토: { level: '하', emoji: '⚡', comment: '목이 토를 극함. 부딪히기 쉬움. 주도권 싸움 잦음' },
    금: { level: '하', emoji: '⚔️', comment: '금이 목을 극함. 상처 받기 쉬운 조합' },
    수: { level: '상', emoji: '💧', comment: '수가 목을 생함. 수가 목을 키워주는 느낌' },
  },
  화: {
    목: { level: '최상', emoji: '🔥', comment: '목이 화를 살려줌. 서로 에너지 넘침. 불꽃 케미' },
    화: { level: '중', emoji: '☀️', comment: '둘 다 뜨거워서 폭발하거나 너무 뜨거워 힘들 수도' },
    토: { level: '상', emoji: '🌋', comment: '화가 토를 생함. 화가 리드하고 토가 따라가는 구조' },
    금: { level: '하', emoji: '⚡', comment: '화가 금을 극함. 냉정한 금에게 화가 부딪힘' },
    수: { level: '하', emoji: '🌊', comment: '수가 화를 극함. 감정 억누르는 조합. 갈등 잦음' },
  },
  토: {
    목: { level: '하', emoji: '⚡', comment: '목이 토를 극함. 부딪히기 쉬움. 주도권 싸움 잦음' },
    화: { level: '상', emoji: '🌋', comment: '화가 토를 생함. 화가 리드하고 토가 따라가는 구조' },
    토: { level: '중', emoji: '🪨', comment: '안정적이지만 변화가 없음. 지루할 수 있지만 편안함' },
    금: { level: '최상', emoji: '💎', comment: '토가 금을 생함. 서로 보완하고 안정감 있는 조합' },
    수: { level: '상', emoji: '🌿', comment: '토가 수를 극하지만 서로 균형을 맞추는 경우 많음' },
  },
  금: {
    목: { level: '하', emoji: '⚔️', comment: '금이 목을 극함. 상처 받기 쉬운 조합' },
    화: { level: '하', emoji: '⚡', comment: '화가 금을 극함. 냉정한 금에게 화가 부딪힘' },
    토: { level: '최상', emoji: '💎', comment: '토가 금을 생함. 서로 보완하고 안정감 있는 조합' },
    금: { level: '중', emoji: '⚙️', comment: '원칙 맞으면 강한 팀. 안 맞으면 서로 예민함' },
    수: { level: '상', emoji: '✨', comment: '금이 수를 생함. 금이 수를 이끌어주는 멘토-멘티 케미' },
  },
  수: {
    목: { level: '상', emoji: '💧', comment: '수가 목을 생함. 수가 목을 키워주는 느낌' },
    화: { level: '하', emoji: '🌊', comment: '수가 화를 극함. 감정 억누르는 조합. 갈등 잦음' },
    토: { level: '상', emoji: '🌿', comment: '토가 수를 극하지만 서로 균형을 맞추는 경우 많음' },
    금: { level: '상', emoji: '✨', comment: '금이 수를 생함. 금이 수를 이끌어주는 멘토-멘티 케미' },
    수: { level: '최상', emoji: '🌊', comment: '생각 통하고 깊이 공감. 근데 너무 같아서 결정 못 할 수도' },
  },
};

export function getCompat(el1: Element, el2: Element): CompatResult {
  return COMPAT_TABLE[el1]?.[el2] ?? { level: '중', emoji: '🤝', comment: '평범한 케미. 노력하면 잘 맞음.' };
}
