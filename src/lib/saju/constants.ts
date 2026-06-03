// ── 천간 (Heavenly Stems) ──
export const STEMS = ['갑','을','병','정','무','기','경','신','임','계'] as const;
export type Stem = (typeof STEMS)[number];

// ── 지지 (Earthly Branches) ──
export const BRANCHES = ['자','축','인','묘','진','사','오','미','신','유','술','해'] as const;
export type Branch = (typeof BRANCHES)[number];

// ── 오행 (Five Elements) ──
export const ELEMENTS = ['목','화','토','금','수'] as const;
export type Element = (typeof ELEMENTS)[number];

// ── 천간 데이터 ──
export const STEM_DATA: Record<Stem, { element: Element; yang: boolean; hanja: string; image: string }> = {
  갑: { element: '목', yang: true,  hanja: '甲', image: '큰 나무'   },
  을: { element: '목', yang: false, hanja: '乙', image: '풀·화초'   },
  병: { element: '화', yang: true,  hanja: '丙', image: '태양·큰 불' },
  정: { element: '화', yang: false, hanja: '丁', image: '등불·촛불'  },
  무: { element: '토', yang: true,  hanja: '戊', image: '큰 산·대지' },
  기: { element: '토', yang: false, hanja: '己', image: '논밭·평지'  },
  경: { element: '금', yang: true,  hanja: '庚', image: '원석·큰 쇠' },
  신: { element: '금', yang: false, hanja: '辛', image: '보석·칼날'  },
  임: { element: '수', yang: true,  hanja: '壬', image: '큰 강·바다' },
  계: { element: '수', yang: false, hanja: '癸', image: '비·이슬·샘물'},
};

// ── 지지 데이터 ──
export const BRANCH_DATA: Record<Branch, {
  element: Element; yang: boolean; hanja: string;
  animal: string; hourRange: string; sajuMonth: number;
}> = {
  자: { element: '수', yang: true,  hanja: '子', animal: '쥐',     hourRange: '23~01', sajuMonth: 11 },
  축: { element: '토', yang: false, hanja: '丑', animal: '소',     hourRange: '01~03', sajuMonth: 12 },
  인: { element: '목', yang: true,  hanja: '寅', animal: '호랑이', hourRange: '03~05', sajuMonth: 1  },
  묘: { element: '목', yang: false, hanja: '卯', animal: '토끼',   hourRange: '05~07', sajuMonth: 2  },
  진: { element: '토', yang: true,  hanja: '辰', animal: '용',     hourRange: '07~09', sajuMonth: 3  },
  사: { element: '화', yang: false, hanja: '巳', animal: '뱀',     hourRange: '09~11', sajuMonth: 4  },
  오: { element: '화', yang: true,  hanja: '午', animal: '말',     hourRange: '11~13', sajuMonth: 5  },
  미: { element: '토', yang: false, hanja: '未', animal: '양',     hourRange: '13~15', sajuMonth: 6  },
  신: { element: '금', yang: true,  hanja: '申', animal: '원숭이', hourRange: '15~17', sajuMonth: 7  },
  유: { element: '금', yang: false, hanja: '酉', animal: '닭',     hourRange: '17~19', sajuMonth: 8  },
  술: { element: '토', yang: true,  hanja: '戌', animal: '개',     hourRange: '19~21', sajuMonth: 9  },
  해: { element: '수', yang: false, hanja: '亥', animal: '돼지',   hourRange: '21~23', sajuMonth: 10 },
};

// ── 오행 상생·상극 ──
export const GENERATES: Record<Element, Element> = { 목:'화', 화:'토', 토:'금', 금:'수', 수:'목' };
export const CONTROLS:  Record<Element, Element> = { 목:'토', 토:'수', 수:'화', 화:'금', 금:'목' };

// ── 오행 UI 색상 ──
export const ELEMENT_COLOR: Record<Element, string> = {
  목: '#4ade80', 화: '#f87171', 토: '#fbbf24', 금: '#d1d5db', 수: '#60a5fa',
};

// ── 십신 ──
export const SIPSHIN = [
  '비견','겁재','식신','상관','편재','정재','편관','정관','편인','정인',
] as const;
export type Sipshin = (typeof SIPSHIN)[number];
