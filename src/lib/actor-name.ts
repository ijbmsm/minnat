/**
 * 행위자 이름 표기 헬퍼.
 *
 * 카드 UI 는 "이름 + 요약" 을 나란히 붙여 쓰는데, 크롤러가 넣는 summary 는
 * 기사 제목에서 온 것이라 이미 이름으로 시작하는 경우가 많다.
 * 그대로 두면 "이재명 이재명, 추석 명절 각계 선물 증정" 처럼 이름이 두 번 나온다.
 *
 * 이름을 지우는 게 아니라 요약 쪽에서 앞머리만 떼어낸다 —
 * 이름은 "이 이슈가 누구 것인지" 를 말해주는 고정 자리라 카드마다 있고 없고 하면 안 된다.
 */

/** 이름 뒤에 바로 붙어 떼어내도 되는 구분자 */
const LEADING_SEP = /^[\s,、·:;\-–—]+/;

/** 한글 음절 — 이름 뒤에 곧바로 한글이 오면 다른 단어의 일부다 ("이재명그룹") */
const HANGUL = /[가-힣]/;

/** 두 글자 복성 — 성씨 한 글자만 떼면 안 되는 경우 */
const COMPOUND_SURNAMES = ['남궁', '황보', '제갈', '선우', '독고', '사공', '서문', '동방'];

/**
 * 언론이 쓰는 "성 + 직함" 축약형 목록.
 * "이 대통령" 의 "이" 만 떼어 "이재명 대통령, …" 으로 읽히게 하려고 쓴다.
 * 직함이 아니면 떼지 않는다 — "이 사건은" 의 지시관형사 '이' 를 성씨로 오인하지 않기 위해.
 */
const TITLES = [
  '대통령', '당대표', '원내대표', '대표', '의원', '장관', '차관', '총리', '부총리',
  '도지사', '지사', '시장', '군수', '구청장', '청장', '처장', '실장', '비서실장',
  '수석', '의장', '부의장', '위원장', '위원', '후보', '교육감', '검사', '판사', '변호사',
];

/** 이름에서 성씨를 뽑는다 (복성 우선) */
function surnameOf(name: string): string {
  return COMPOUND_SURNAMES.find(c => name.startsWith(c)) ?? name[0];
}

/** "이 대통령, …" 처럼 성+직함으로 시작하면 성씨 한 글자만 떼어낸다. 아니면 null */
function stripSurnameTitle(s: string, name: string): string | null {
  const surname = surnameOf(name);
  if (!s.startsWith(surname + ' ')) return null;
  const next = s.slice(surname.length + 1).trimStart();
  if (!TITLES.some(t => next.startsWith(t))) return null;
  return next.length > 0 ? next : null;
}

/**
 * summary 가 actorName 으로 시작하면 그 이름과 뒤따르는 구분자를 떼어낸 문자열을 준다.
 * 시작하지 않으면 원본 그대로.
 *
 *   ("이재명, 추석 명절 각계 선물 증정", "이재명") → "추석 명절 각계 선물 증정"
 *   ("김민석 당대표, 당내통합 선언",     "김민석") → "당대표, 당내통합 선언"
 *   ("이 대통령, 한-중앙아시아 …",       "이재명") → "대통령, 한-중앙아시아 …"   (성+직함 축약)
 *   ("민주당 법사위원들, …",             "서영교") → "민주당 법사위원들, …"
 */
export function stripLeadingActor(summary: string, actorName: string | null | undefined): string {
  if (!summary || !actorName) return summary;

  const name = actorName.trim();
  const s    = summary.trimStart();
  if (!name) return summary;

  if (!s.startsWith(name)) return stripSurnameTitle(s, name) ?? summary;

  const after = s.slice(name.length);
  // "이재명그룹" 처럼 이름이 다른 단어에 이어지는 경우는 건드리지 않는다
  if (after && HANGUL.test(after[0])) return summary;

  const rest = after.replace(LEADING_SEP, '').trimStart();
  // 요약이 이름뿐이면 지우지 않는다 (지우면 빈 카드가 된다)
  return rest.length > 0 ? rest : summary;
}
