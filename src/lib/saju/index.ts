export * from './constants';
export * from './pillars';
export * from './sipshin';
export * from './interpret';
export { getSolarTermKST, getIpchunKST } from './solar';

import { STEM_DATA, BRANCH_DATA, ELEMENT_COLOR, type Element } from './constants';
import { calcSaju, type SajuPillars, type Pillar } from './pillars';
import { getSipshin, getBranchSipshin, countElements } from './sipshin';
import { DAY_MASTER_PROFILE, SIPSHIN_DESC, ELEMENT_COMMENT, getCompat } from './interpret';

export type { SajuPillars, Pillar };

export interface SajuResult {
  pillars:    SajuPillars;
  dayMaster:  {
    stem:    string;
    hanja:   string;
    element: Element;
    image:   string;
    profile: (typeof DAY_MASTER_PROFILE)[keyof typeof DAY_MASTER_PROFILE];
  };
  elements:   { el: Element; count: number; color: string; comment: string | null }[];
  sipshinMap: {
    yearStem: string; yearStemSipshin: string;
    monthStem: string; monthStemSipshin: string;
    dayStem: string;   // 일간 본인
    hourStem: string | null; hourStemSipshin: string | null;
    yearBranch: string; yearBranchSipshin: string;
    monthBranch: string; monthBranchSipshin: string;
    dayBranch: string;  dayBranchSipshin: string;
    hourBranch: string | null; hourBranchSipshin: string | null;
  };
}

export function buildSajuResult(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number | null,
  sex: 'male' | 'female',
): SajuResult {
  const pillars = calcSaju(birthYear, birthMonth, birthDay, birthHour, sex);
  const { year, month, day, hour } = pillars;
  const dm = day.stem;

  // 일간 정보
  const dmData    = STEM_DATA[dm];
  const dmProfile = DAY_MASTER_PROFILE[dm];

  // 오행 카운트
  const activePillars = [
    { stem: STEM_DATA[year.stem],  branch: BRANCH_DATA[year.branch]  },
    { stem: STEM_DATA[month.stem], branch: BRANCH_DATA[month.branch] },
    { stem: STEM_DATA[day.stem],   branch: BRANCH_DATA[day.branch]   },
    ...(hour ? [{ stem: STEM_DATA[hour.stem], branch: BRANCH_DATA[hour.branch] }] : []),
  ];
  const elemCount = countElements(activePillars);
  const total     = Object.values(elemCount).reduce((s, v) => s + v, 0);

  const elements = (['목','화','토','금','수'] as Element[]).map((el) => {
    const count = elemCount[el];
    const ratio = count / total;
    let comment: string | null = null;
    if (ratio >= 0.5) comment = ELEMENT_COMMENT[el].excess;
    else if (count === 0) comment = ELEMENT_COMMENT[el].lack;
    return { el, count, color: ELEMENT_COLOR[el], comment };
  });

  // 십신 맵
  const sipshinMap = {
    yearStem:          year.stem,
    yearStemSipshin:   getSipshin(dm, year.stem),
    monthStem:         month.stem,
    monthStemSipshin:  getSipshin(dm, month.stem),
    dayStem:           dm,
    hourStem:          hour?.stem ?? null,
    hourStemSipshin:   hour ? getSipshin(dm, hour.stem) : null,
    yearBranch:        year.branch,
    yearBranchSipshin: getBranchSipshin(dm, year.branch),
    monthBranch:       month.branch,
    monthBranchSipshin: getBranchSipshin(dm, month.branch),
    dayBranch:         day.branch,
    dayBranchSipshin:  getBranchSipshin(dm, day.branch),
    hourBranch:        hour?.branch ?? null,
    hourBranchSipshin: hour ? getBranchSipshin(dm, hour.branch) : null,
  };

  return {
    pillars,
    dayMaster: { stem: dm, hanja: dmData.hanja, element: dmData.element, image: dmData.image, profile: dmProfile },
    elements,
    sipshinMap,
  };
}

export { getCompat, SIPSHIN_DESC, DAY_MASTER_PROFILE };
