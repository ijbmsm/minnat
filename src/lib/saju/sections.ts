/**
 * 풀이 타입별 섹션 제목 — 비로그인 미리보기(블러) 와 이력 UI 가 공유한다.
 * 실제 LLM 섹션 정의는 reading/route.ts buildPrompt 의 system 에 있고, 제목은 여기와 같은 순서·의미다.
 */
export type SajuReadingType = 'full' | 'today' | 'love' | 'career';

export const SECTION_TITLES: Record<SajuReadingType, string[]> = {
  full:   ['나는 어떤 사람', '연애 스타일', '직업·재물 성향', '올해 흐름', '내년 예고', '지금 가장 필요한 것'],
  today:  ['오늘 에너지', '오늘 집중할 것', '오늘 조심할 것'],
  love:   ['내 연애 방식의 민낯', '내 인연의 모습 + 만남 시기', '결혼運 · 흔들리는 시기', '피해야 할 유형', '나의 치명적 매력 + 어필법'],
  career: ['구체적 직업·분야 추천', '직장인 vs 사업가', '재물운', '이직·승진·창업 타이밍', '맞는 환경 / 피해야 할 일'],
};

export const COMPAT_SECTION_TITLES = ['두 사람의 케미', '갈등 포인트와 극복법', '서로에게 미치는 영향', '함께하면 좋은 것들'];
