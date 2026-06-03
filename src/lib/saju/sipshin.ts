import { STEM_DATA, BRANCH_DATA, GENERATES, CONTROLS, type Stem, type Branch, type Element, type Sipshin } from './constants';

// 일간 기준으로 다른 천간의 십신을 계산
export function getSipshin(dayMaster: Stem, target: Stem): Sipshin {
  const dmEl   = STEM_DATA[dayMaster].element;
  const dmYang = STEM_DATA[dayMaster].yang;
  const tEl    = STEM_DATA[target].element;
  const tYang  = STEM_DATA[target].yang;
  const sameYin = dmYang === tYang;

  if (tEl === dmEl) return sameYin ? '비견' : '겁재';

  if (GENERATES[dmEl] === tEl)   return sameYin ? '식신' : '상관';  // 내가 생하는
  if (CONTROLS[dmEl]  === tEl)   return sameYin ? '편재' : '정재';  // 내가 극하는
  if (GENERATES[tEl]  === dmEl)  return sameYin ? '편인' : '정인';  // 나를 생하는
  if (CONTROLS[tEl]   === dmEl)  return sameYin ? '편관' : '정관';  // 나를 극하는

  return '비견'; // fallback (발생 X)
}

// 지지의 십신 (지지 본기 오행 기준)
export function getBranchSipshin(dayMaster: Stem, branch: Branch): Sipshin {
  const dmEl   = STEM_DATA[dayMaster].element;
  const dmYang = STEM_DATA[dayMaster].yang;
  const tEl    = BRANCH_DATA[branch].element;
  const tYang  = BRANCH_DATA[branch].yang;
  const sameYin = dmYang === tYang;

  if (tEl === dmEl) return sameYin ? '비견' : '겁재';
  if (GENERATES[dmEl] === tEl)  return sameYin ? '식신' : '상관';
  if (CONTROLS[dmEl]  === tEl)  return sameYin ? '편재' : '정재';
  if (GENERATES[tEl]  === dmEl) return sameYin ? '편인' : '정인';
  if (CONTROLS[tEl]   === dmEl) return sameYin ? '편관' : '정관';
  return '비견';
}

// 오행 카운트 (천간 4 + 지지 4)
export function countElements(
  pillars: Array<{ stem: { element: Element }; branch: { element: Element } }>
): Record<Element, number> {
  const count: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const { stem, branch } of pillars) {
    count[stem.element]++;
    count[branch.element]++;
  }
  return count;
}
