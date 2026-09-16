/**
 * 사주 풀이 프롬프트 — 렌즈별 초점 신호 + system/user 조립. 순수 함수 (IO 없음).
 * reading/route.ts 와 scripts/collect-qa-samples.ts 가 공유한다.
 *
 * system 은 타입별 4종으로 고정(사용자 데이터 없음) → prompt cache 대상.
 * 이름·현재 대운·모순 규칙·주의·고민·오늘 일진은 전부 user 메시지.
 */
import type { SajuFactSheet } from './factsheet';
import type { Sipshin } from './constants';

// ── 렌즈: 타입별 초점 신호 ──

export type ReadingType = 'full' | 'today' | 'love' | 'career';

// 홍염살: 일간 기준 지지 (이성 매력·관능)
export const HONGYEOM_MAP: Partial<Record<string, string>> = {
  갑:'오', 을:'신', 병:'인', 무:'인', 정:'미', 기:'미',
  경:'술', 신:'오', 임:'자', 계:'신',
};

export function loveFocusSignals(fs: SajuFactSheet, sex: 'male' | 'female'): string[] {
  const signals: string[] = [];
  // 배우자성: 여=정관/편관, 남=정재/편재
  const spouseStars: readonly Sipshin[] = sex === 'female'
    ? ['정관', '편관']
    : ['정재', '편재'];

  // 배우자성 위치 · 오행 — 어느 기둥 어느 위치에 있는지
  let hasSpouse = false;
  for (const p of fs.pillars) {
    if (p.sipshinStem && spouseStars.includes(p.sipshinStem as typeof spouseStars[number])) {
      signals.push(`배우자성 ${p.sipshinStem}(${p.stemElement}) — ${p.palace}주 천간`);
      hasSpouse = true;
    }
    if (spouseStars.includes(p.sipshinBranch as typeof spouseStars[number])) {
      signals.push(`배우자성 ${p.sipshinBranch}(${p.branchElement}) — ${p.palace}주 지지`);
      hasSpouse = true;
    }
  }
  if (!hasSpouse) {
    signals.push(`배우자성(${spouseStars.join('/')}) 없음 — 만남 늦거나 독립적 삶 선호 경향`);
  }

  // 배우자궁(일지) — 인연의 성격
  const dayPillar = fs.pillars.find(p => p.palace === '일');
  if (dayPillar) {
    signals.push(`배우자궁(일지): ${dayPillar.branch}(${dayPillar.sipshinBranch}·${dayPillar.branchElement})`);
  }

  // 일지 충 — 배우자궁 불안정
  for (const [a, b] of fs.advanced.hapChung.branchChungs) {
    if (dayPillar && (a === dayPillar.branch || b === dayPillar.branch)) {
      signals.push(`일지 충(${a}${b}충): 배우자궁 불안정 — 연애 변동·이별 반복 경향`);
    }
  }

  // 기신 — 피해야 할 상대 오행
  if (fs.advanced.yongSin.gisin) {
    signals.push(`기신: ${fs.advanced.yongSin.gisin} — 이 오행 강한 상대가 갈등 유발원`);
  }

  // 도화살
  for (const s of fs.sinsal) {
    if (s.name === '도화살') signals.push(`도화살(${s.branches.join('')}): 이성 접촉 많음·매력 발산`);
  }

  // 홍염살 (일간 기준 지지 체크)
  const hyBranch = HONGYEOM_MAP[fs.dayMaster.stem];
  if (hyBranch && fs.pillars.some(p => p.branch === hyBranch)) {
    signals.push(`홍염살(${hyBranch}): 강한 이성 매력·관능적 분위기`);
  }

  // 식상 — 매력·어필 무기
  const sikSang = (fs.tenGodCounts['식신'] ?? 0) + (fs.tenGodCounts['상관'] ?? 0);
  if (sikSang >= 2) signals.push(`식상(식신+상관) ${sikSang}개 — 매력·표현력·개성 강함`);
  else if (sikSang === 1) signals.push(`식상 1개 — 표현력 보통`);
  else signals.push('식상 없음 — 감정 표현 서툰 경향');

  // 신강약 (연애 관계 주도권과 직결)
  signals.push(`신강약: ${fs.bodyStrength === 'strong' ? '신강 — 주도적·독립적 연애' : fs.bodyStrength === 'weak' ? '신약 — 의존적·수용적 연애' : '중화 — 유연한 연애 스타일'}`);

  // 대운 배우자성 타이밍 — 인연이 들어오는 운
  const daeunTiming: string[] = [];
  for (const d of fs.daeun) {
    const matchStem   = spouseStars.includes(d.sipshinStem   as typeof spouseStars[number]);
    const matchBranch = spouseStars.includes(d.sipshinBranch as typeof spouseStars[number]);
    if (matchStem || matchBranch) {
      const star = matchStem ? d.sipshinStem : d.sipshinBranch;
      daeunTiming.push(`${d.startAge}세(${d.startYear}년~): ${d.stem}${d.branch} — ${star} 대운 진입`);
    }
  }
  if (daeunTiming.length) {
    signals.push(`인연 대운 타이밍: ${daeunTiming.join(' / ')}`);
  } else {
    signals.push('대운에서 배우자성 직접 진입 없음 — 세운·일운으로 만남 시기 탐색 필요');
  }

  // 세운 배우자성 활성화
  for (const s of fs.seyun) {
    const matchStem   = spouseStars.includes(s.sipshinStem   as typeof spouseStars[number]);
    const matchBranch = spouseStars.includes(s.sipshinBranch as typeof spouseStars[number]);
    if (matchStem || matchBranch) {
      signals.push(`${s.year}년 세운(${s.stem}${s.branch}): 배우자성 활성화 — 인연 만남 가능 시기`);
    }
  }

  return signals;
}

export function careerFocusSignals(fs: SajuFactSheet): string[] {
  const signals: string[] = [];

  // 격국 — 직업 방향의 뼈대
  signals.push(`격국: ${fs.advanced.geokGuk.name}${fs.advanced.geokGuk.projected ? ' (투간 확인)' : ' (추정)'}`);

  // 용신/기신 — 직업 방향 + 소진 환경
  if (fs.advanced.yongSin.yongsin) {
    signals.push(`용신: ${fs.advanced.yongSin.yongsin}(${fs.advanced.yongSin.label})${fs.advanced.yongSin.present ? '' : ' — 원국 부재, 대운에서 보충 필요'}`);
    signals.push(`기신: ${fs.advanced.yongSin.gisin} — 이 오행 중심 환경에서 소진 위험`);
  } else {
    signals.push(`용신: ${fs.advanced.yongSin.label} (${fs.advanced.yongSin.reason})`);
  }

  // 신강약 — 직장 vs 사업 핵심 지표
  const bs = fs.bodyStrength;
  signals.push(`신강약: ${bs === 'strong' ? '신강 — 독립·리더·사업 구조에 강함' : bs === 'weak' ? '신약 — 조직·협업·전문직 구조에 강함' : '중화 — 직장·사업 모두 유연 적응'}`);

  // 십신 분포 — 직업군 매핑 핵심
  const gwan   = (fs.tenGodCounts['정관'] ?? 0) + (fs.tenGodCounts['편관'] ?? 0);
  const sik    = (fs.tenGodCounts['식신'] ?? 0) + (fs.tenGodCounts['상관'] ?? 0);
  const jaeJong = fs.tenGodCounts['정재'] ?? 0;
  const jaePyeon = fs.tenGodCounts['편재'] ?? 0;
  const inseong = (fs.tenGodCounts['정인'] ?? 0) + (fs.tenGodCounts['편인'] ?? 0);
  const bigyeop = (fs.tenGodCounts['비견'] ?? 0) + (fs.tenGodCounts['겁재'] ?? 0);

  signals.push(`관성 ${gwan}(조직·관리·공직) / 식상 ${sik}(기술·표현·창업) / 재성 ${jaeJong + jaePyeon}(영업·사업·투자) / 인성 ${inseong}(학문·교육·전문직) / 비겁 ${bigyeop}(독립·동업)`);

  // 재성 세분화 — 정재(안정·월급) vs 편재(사업·투자·큰돈)
  if (jaeJong + jaePyeon > 0) {
    signals.push(`재성 세분: 정재(안정·월급) ${jaeJong}개 / 편재(사업·투자·변동수입) ${jaePyeon}개`);
  } else {
    signals.push('재성 없음 — 돈보다 명예·성취 중심, 재물은 간접 경로');
  }

  // 월주(직업궁) — 직업 환경의 성격
  const wolPillar = fs.pillars.find(p => p.palace === '월');
  if (wolPillar) {
    signals.push(`직업궁(월주): ${wolPillar.stem}(${wolPillar.sipshinStem ?? '일간'}) ${wolPillar.branch}(${wolPillar.sipshinBranch})`);
  }

  // 신살 — 직업 관련
  for (const s of fs.sinsal) {
    if (['역마살', '화개살', '양인살'].includes(s.name)) {
      signals.push(`${s.name}(${s.branches.join('')}): ${s.desc}`);
    }
  }

  // 대운 직업운 타이밍 — 관성·재성·식상 들어오는 대운
  const careerStars: Sipshin[] = ['정관', '편관', '정재', '편재', '식신', '상관'];
  const daeunTiming: string[] = [];
  for (const d of fs.daeun) {
    const matchStem   = careerStars.includes(d.sipshinStem);
    const matchBranch = careerStars.includes(d.sipshinBranch);
    if (matchStem || matchBranch) {
      const star = matchStem ? d.sipshinStem : d.sipshinBranch;
      daeunTiming.push(`${d.startAge}세(${d.startYear}년~): ${d.stem}${d.branch} — ${star}`);
    }
  }
  if (daeunTiming.length) {
    signals.push(`직업運 대운 타이밍: ${daeunTiming.join(' / ')}`);
  }

  // 세운 관성/재성 활성화
  for (const s of fs.seyun) {
    const matchStem   = careerStars.includes(s.sipshinStem);
    const matchBranch = careerStars.includes(s.sipshinBranch);
    if (matchStem || matchBranch) {
      const star = matchStem ? s.sipshinStem : s.sipshinBranch;
      signals.push(`${s.year}년 세운(${s.stem}${s.branch}): ${star} 활성화`);
    }
  }

  return signals;
}

export const TOKEN_BUDGET: Record<ReadingType, { free: number; paid: number }> = {
  full:   { free: 4800, paid: 6400 },
  love:   { free: 4200, paid: 6000 },
  career: { free: 4200, paid: 6000 },
  today:  { free: 900,  paid: 1500 },
};

// ── 프롬프트 생성 ──

export function buildPrompt(
  fs: SajuFactSheet,
  opts: {
    tier: 'free' | 'paid';
    type: ReadingType;
    sex: 'male' | 'female';
    todayPillar?: { stem: string; branch: string; sipshinStem: string; sipshinBranch: string };
  },
): { system: string; user: string } {
  const { dayMaster: dm, elements, elementTotal, tenGodCounts, bodyStrength, cautions, seyun, name, concern } = fs;
  const adv = fs.advanced;
  const { type, tier, sex } = opts;

  // 렌즈별 초점 신호
  const focusSignals =
    type === 'love'   ? loveFocusSignals(fs, sex) :
    type === 'career' ? careerFocusSignals(fs) :
    fs.notableSignals;

  const elementLines = Object.entries(elements)
    .map(([el, cnt]) => `  ${el}: ${cnt}/${elementTotal} (${Math.round(cnt/elementTotal*100)}%)`)
    .join('\n');

  const tenGodLines = Object.entries(tenGodCounts)
    .filter(([,cnt]) => (cnt ?? 0) > 0)
    .sort(([,a],[,b]) => (b??0)-(a??0))
    .map(([tg, cnt]) => `  ${tg}: ${cnt}회`)
    .join('\n');

  const pillarLines = fs.pillars
    .map(p => {
      const ss = p.sipshinStem ? `(${p.sipshinStem})` : '(일간)';
      return `  ${p.palace}주: ${p.stem}${ss} ${p.branch}(${p.sipshinBranch})`;
    })
    .join('\n');

  const seyunLines = seyun
    .map(s => `  ${s.year}년: ${s.stem}${s.branch} — 천간 ${s.sipshinStem} · 지지 ${s.sipshinBranch}`)
    .join('\n');

  const tokenBudget = TOKEN_BUDGET[type][tier];

  // ── 사용자별(동적) 메모 — 전부 user 메시지로. system 은 캐시되므로 여기 넣지 않는다.
  const cautionNote = cautions.length > 0
    ? `\n[주의사항 — 이 항목은 단정 해석 금지]\n${cautions.map(c => `- ${c}`).join('\n')}`
    : '';

  const currentYear = new Date().getFullYear();
  const currentDaeunInfo = (() => {
    const cur = fs.daeun.find(d => d.startYear <= currentYear && currentYear < d.startYear + 10);
    if (!cur) return '';
    return `\n[현재 대운]\n${cur.stem}${cur.branch} (천간 ${cur.sipshinStem}·지지 ${cur.sipshinBranch}) — ${cur.startYear}~${cur.startYear + 9}년 / ${cur.startAge}~${cur.startAge + 9}세`;
  })();

  const nameNote = name
    ? `\n[참고] "${name}"이라는 이름을 가진 사람. 이름은 직접 호칭하지 말고(이름 금지), 사주 해석에만 참고.`
    : '';

  const concernRef = concern
    ? `\n\n[사용자 고민/질문]\n"${concern}"\n→ 이 고민을 풀이 전반에 녹여. 첫 번째 섹션 포함 최소 2개 섹션에서 직접 이 고민의 사주적 원인과 방향을 짚어줘.`
    : '';

  // 신강약 기반 모순 방지 규칙 — 차트마다 다르므로 user 쪽
  const contradictionRule =
    bodyStrength === 'strong'
      ? '[신강 모순 금지] 이 차트는 신강이다. 인성(정인/편인) 강화·인성 오행 보완 권장 금지 — 신강에게 인성 추가는 더 강하게 만들어 불균형 심화. 식상·재성·관살로 설기·극제하는 방향만 권장.'
    : bodyStrength === 'weak'
      ? '[신약 모순 금지] 이 차트는 신약이다. 식상(식신/상관) 활성·재성 강화 권장 금지 — 신약에게 식상은 일간을 더 약하게 만듦. 인성·비겁으로 보강하는 방향만 권장.'
      : '[중화 모순 금지] 이 차트는 중화다. 특정 오행 편향적 강화 권장 금지. 통관·균형 방향으로만.';

  const tp = opts.todayPillar;
  const todayLine = type === 'today'
    ? `\n[오늘 일진]\n${tp ? `${tp.stem}${tp.branch} (천간 ${tp.sipshinStem} · 지지 ${tp.sipshinBranch})` : '(정보 없음 — 오늘 날짜 기준 추론)'}`
    : '';

  // ── 불변부(system) — 타입별 페르소나 + 규칙 + 섹션 정의. 사용자 데이터 삽입 금지 (prompt cache).
  const PERSONA: Record<ReadingType, string> = {
    full:   '사주 전반을 깊이 봐주는 친구. 기질·오행 과부족·강점·약점·관계·일과 돈·올해와 내년·개운법까지 한 편으로 끝내줘. 짧게 요약하지 말고, 이 사람이 "내 얘기네" 하고 멈칫할 정도로 구체적으로.',
    love:   '연애 전문가 친구. 배우자성·기신·도화·식상 중심으로 읽어줘. 각 섹션은 구체적 인물상·연도·행동법을 포함해야 해 — "좋은 사람 만날 거야" 같은 뭉뚱그린 말은 절대 금지.',
    career: '직업·재물 전문가 친구. 격국·십신 분포·신강약·대운 타이밍 중심으로 읽어줘. 각 섹션은 구체적 직업명·연도·결정 기준을 포함해야 해. 퇴사·창업 같은 재정적 결정은 "사주가 정해주는 게 아니라 참고 한 축"이라는 건설적 프레임을 유지해 — 단정 금지.',
    today:  '오늘 하루 에너지 전문가. 일진×원국 작용을 짧고 명확하게.',
  };

  const sections: string =
    type === 'love' ? (
`[민낯] 연애에서 반복되는 행동 패턴과 진짜 원인 (배우자궁·일간 기반). 본인은 모르지만 상대는 다 느끼는 지점까지.
[인연] 배우자성 오행·십신·위치로 보는 상대의 성향·직업군·분위기, 그리고 대운/세운 기준 만남이 열리는 시기 (구체적 나이대·연도).
[타이밍] 평생 연애 타임라인: 인연이 들어오는 대운, 반대로 일지충·배우자성 손상으로 갈등이 생기기 쉬운 시기 (연도 명시, 위기는 "이 시기엔 조급함 주의" 프레임으로).
[피할 유형] 끌리지만 나를 망치는 상대 (기신 오행·십신 기반, 구체적 성향·직업·말투).
[무기] 도화·홍염·식상으로 보는 나의 이성 무기와 실제로 어필되는 행동법. 마지막 문단은 이번 달 안에 해볼 수 있는 행동 1가지로 닫아.`
    ) : type === 'career' ? (
`[직업] 격국·십신 분포·용신 오행으로 직업군 3개 이상 명시 (예: 기획·마케팅, 전문직(의·법·회계), 교육·연구 등). "창의적입니다" 같은 뭉뚱그린 말 절대 금지.
[직장 vs 사업] 신강약·재성·관성·비겁으로 창업 적합도 판정. 창업/이직 결정은 "이런 점을 점검하면 유리/불리"처럼 건설적으로, 단정 금지.
[재물] 정재(안정·월급)·편재(사업·투자·큰돈) 비중으로 돈 버는 방식, 식상생재(기술→수입) 여부, 돈이 새는 구멍, 재물運 들어오는 대운 나이대 명시.
[타이밍] 관성·재성·식상 대운/세운 기준 움직이기 유리한 시기 (구체적 나이·연도). 반대로 버티는 편이 나은 시기도.
[환경] 용신 오행 기반 빛나는 환경, 기신 오행 기반 소진되는 직무·조직 유형 (구체적 직업명·상황). 마지막 문단은 이번 달 안에 점검할 것 1가지로 닫아.`
    ) : type === 'today' ? (
`주의: [오늘 일진]이 원국·대운·세운 위에 얹혀서 작용함. 일진만 보지 말고 현재 대운·세운 흐름 위에서 오늘이 어떤 날인지 맥락 있게 봐줘.
오늘의 사주는 매일 보는 것이라 짧아야 한다. 규칙 5(3문단 구조) 대신 각 섹션 2~3문장, 문단 나누지 마.
[에너지] 첫 문장은 반드시 "에너지 N/5." 로 시작 (N은 1~5 정수, 이 차트에 일진이 유리하면 높게). 이어서 오늘 일진이 현재 대운·세운과 어떻게 맞물리는지 1~2문장.
[집중] 일진의 오행·십신이 유리하게 작용하는 구체적 행동 1가지.
[주의] 일진과 원국 충돌로 마찰이 생기기 쉬운 구체적 상황 1가지 + 한 줄 처방.`
    ) : /* full */ (
`[총평] 이 사주를 한 문장으로 정의하면 무엇인지부터 쓰고, 그 정의가 이 사람 삶에서 어떤 식으로 반복되는지. 일간·월지·오행 편중을 근거로.
[기질] 일주(일간+일지)가 만드는 본래 성격. 남들에게 보이는 모습과 속이 다른 지점까지 짚어.
[오행] [오행 세력]의 숫자를 직접 인용해서 넘치는 기운과 비어 있는 기운을 짚고, 그 과부족이 실제 생활에서 어떤 장면으로 나타나는지.
[강점] 남들이 부러워하는 이 사람만의 무기. 십신 근거를 대고, 어떤 상황에서 발휘되는지 장면으로.
[약점] 반복해서 발목 잡는 지점. 듣기 좋은 말로 뭉개지 말고 솔직하게. 단 성격 비난이 아니라 구조적 원인(어떤 기운의 과부족인지)으로 설명해.
[관계] 연애와 사람 관계에서 반복되는 패턴, 그리고 그게 어디서 오는지. (상대 유형·만남 시기는 별도 연애운 풀이가 다루니 여기서 쓰지 마)
[일과 돈] 어떤 일에서 빛나고 어떤 환경에서 소진되는지, 돈은 어떤 방식으로 벌고 어디로 새는지. (구체적 직업명 추천·이직 타이밍은 별도 직업운 풀이가 다루니 여기서 쓰지 마)
[올해] [세운] 첫 줄(올해) 기준 올해 흐름. title 에 연도를 넣어.
[내년] [세운] 둘째 줄(내년) 기준 미리 알아둘 것. title 에 연도를 넣어.
[처방] 흐름을 바꾸려면 지금 뭘 손봐야 하는지. 마지막은 반드시 아래 한 줄로 끝내 (앞에 빈 줄 하나):
"색: OO · 숫자: N, N · 방향: OO쪽 · 오늘 할 것: (행동 한 가지)"
색·숫자·방향은 용신 오행 기준으로 골라 — 목: 초록/3,8/동 · 화: 빨강/2,7/남 · 토: 노랑/5,10/중앙 · 금: 흰색/4,9/서 · 수: 검정/1,6/북. 용신이 없으면(중화) 가장 약한 오행 기준.`
    );

  const system = `너는 한국 전통 사주명리 전문가야. ${PERSONA[type]}
규칙:
1. 상대방은 반드시 '너'로만 불러. 이름·3인칭('그', '이 사람') 절대 금지.
2. [초점 신호]에 나온 팩트만 근거로 써. 없는 사실 지어내지 마.
3. "~할 것이다" 단정 금지. "~하는 경향", "~를 경계할 만하다" 식으로.
4. 반말, 친근하게. 점집 말투 금지.
5. [본문 구조] 각 섹션 body 는 빈 줄로 나뉜 3문단, 공백 포함 240~320자.
   1문단(2~3문장): 결론부터. 그게 일상에서 어떤 장면으로 나타나는지. 비유는 섹션당 최대 1개.
   2문단(2~3문장): 왜 그런지 원국 근거. 실제 글자를 이름으로 짚어 — 일간, 지지, 십신, 합충, 신살, 대운/세운.
   3문단(1~2문장): 그래서 뭘 하면 되는지. 오늘·이번 주에 실제로 할 수 있는 행동 1가지로 닫아.
   분량을 넘기지 마. 길게 쓰는 것보다 매 문장이 이 차트에서만 나올 수 있는 말인지가 중요하다.
6. 구체적으로 써 — "좋다/나쁘다" 뭉뚱그리기 금지. 어떤 상황에서 어떻게 나타나는지.
7. 연도·나이대를 반드시 쓸 것 — 대운/세운 타이밍이 있는 섹션은 "20XX년", "XX세 이후" 식으로 1개 이상 명시.
8. 신살·격국은 팩트시트에 없으면 언급 금지.
9. 사용자 메시지의 [모순 금지 규칙]을 반드시 지켜. 신강약에 반하는 오행 보완 권장은 오답이다.
10. [궁위 교차 금지] 연주=조상·초년(~20대), 월주=부모·직업환경·청년(20~40대), 일주=배우자·자아·중년(40~60대), 시주=자식·노년(60대~). 궁을 섞어서 해석하거나 뛰어넘어 적용 금지.
11. [generic 표현 금지] "좋은 기회가 온다", "힘든 시기가 지나간다", "운이 좋다/나쁘다", "분명 잘 될 거야", "걱정 마" 같은 근거 없는 위로·단정 금지. 반드시 대운/세운 팩트 근거 명시.
12. [오행 용어 남발 금지] 팩트시트에 없는 합충·신살 추론 금지. 있는 것만 해석.
13. [주의사항]에 적힌 항목은 단정 해석 금지.

14. [비유 남용 금지] 한 섹션에 비유는 하나까지. 같은 비유를 다른 섹션에서 다시 쓰지 마.

출력 형식: JSON 배열만. 앞뒤에 다른 말 붙이지 마.
[{"label":"...", "title":"...", "body":"..."}, ...]
- label: 아래 섹션 구성의 대괄호 라벨을 대괄호 없이 그대로 복사. 순서·개수도 그대로.
- title: 그 섹션을 한 줄로 찌르는 후킹 문장 (10~24자, 마침표 없이). 라벨을 그대로 반복하지 말고,
  이 사람 원국에서만 나올 수 있는 표현으로 써. 예) "브레이크 없이 달리는 8톤 트럭"
- body: 규칙 5의 3문단 구조. 문단 사이 줄바꿈은 JSON 문자열 안에서 반드시 \\n 으로 이스케이프해 —
  날 줄바꿈을 그대로 넣으면 응답이 깨진다.

섹션 구성:
${sections}`;

  const user = `[차트 데이터]
일간: ${dm.stem}(${dm.hanja}) · ${dm.element} · ${dm.yang ? '양' : '음'}
이미지: ${dm.image}

[격국 · 용신]
격국: ${adv.geokGuk.name}${adv.geokGuk.projected ? ' (투간 확인)' : ' (추정)'}
신강약: ${bodyStrength === 'strong' ? '신강' : bodyStrength === 'weak' ? '신약' : '중화'}
용신: ${adv.yongSin.yongsin}(${adv.yongSin.label}) · 기신: ${adv.yongSin.gisin}
사령신: ${adv.strengths.salyeong.stem}(${adv.strengths.salyeong.element})

[사주 8자]
${pillarLines}

[오행 세력]
${elementLines}

[십신 분포]
${tenGodLines}

[세운]
${seyunLines}${currentDaeunInfo}${todayLine}

[초점 신호 — 이 렌즈(${type})에서 가장 중요한 팩트]
${focusSignals.map(s => `- ${s}`).join('\n')}

[모순 금지 규칙]
${contradictionRule}${cautionNote}${nameNote}${concernRef}

위 system 의 섹션 구성대로, 라벨과 순서를 그대로 지켜서 작성해줘. (총 ${tokenBudget}토큰 이내) JSON 배열만 출력.`;

  return { system, user };
}

