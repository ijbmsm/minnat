// 하네스 설정 — **이 파일만 프로젝트에 종속된다.**
//
// run.mjs · hook-edit.mjs · lib/ 는 여기를 읽을 뿐 리포 이름을 모른다.
// charzing 에서 엔진 6개를 그대로 떠왔고, 고친 것은 hook-edit.mjs 의
// 표식 디렉터리 이름 한 줄뿐이다 (프로젝트명 하드코딩 → ROOT 해시).
// (2026-09-25 — 두 번째 사용처. 이식 결과는 charzing 세션에 회신한다)

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** 하네스가 사는 리포. 형제 리포는 이것의 부모에서 찾는다 */
const REPO = resolve(HERE, '../..');

/**
 * 웹 루트. 크롤러 쪽과 **대칭**으로 오버라이드할 수 있어야 한다.
 *
 * 전에는 크롤러만 바꿀 수 있었다. 그래서 웹 쪽 판정은 표본으로 확인된 적이 없었다 —
 * 반대 방향 확인이 절반만 돌고 있었다 (2026-09-29).
 */
export const ROOT = process.env.HARNESS_WEB_ROOT
  ? resolve(process.env.HARNESS_WEB_ROOT)
  : REPO;
const SIBLING = (name) => resolve(REPO, '..', name);

/**
 * 크롤러 루트. 반대 방향 확인(§5.1)을 할 때 값을 일부러 어긋낸 사본을 가리키게 한다.
 * 검사가 "통과"를 내는 게 진짜 통과인지, 그냥 아무것도 안 본 건지 가르는 유일한 방법이다.
 */
const CRAWLER_ROOT = process.env.HARNESS_CRAWLER_ROOT
  ? resolve(process.env.HARNESS_CRAWLER_ROOT)
  : SIBLING('minnat-crawler');

/**
 * 검사 대상 리포.
 *
 * 하네스는 웹(minnat)에 산다. 크롤러는 파이썬이라 node 가 없고,
 * 엔진을 파이썬으로 다시 쓰면 baseline 포맷과 래칫 판정이 두 벌이 된다.
 * 엔진은 파일을 걷고 baseline 과 대조할 뿐이라 대상 언어를 모른다.
 *
 * ⚠️ 두 리포는 **점수 공식과 상수를 공유한다.** 크롤러가 계산해 DB 에 넣은
 *    weighted_score 와 웹이 화면에서 다시 계산한 점수가 같은 규칙을 따라야 한다.
 *    2026-09-25 실측에서 이미 갈라져 있었다 (crawler 에 diversity·상한 누락).
 */
export const REPOS = [
  { label: 'minnat', root: ROOT },
  { label: 'minnat-crawler', root: CRAWLER_ROOT },
];

/** 편집 훅이 파일 위치를 판정할 때 쓰는 루트. 중첩 루트(`only`)는 제외한다 */
export const EDIT_ROOTS = REPOS.filter((r) => !r.only);

/**
 * 점수 규칙의 **정본은 웹**이다 (2026-09-25 결정).
 *
 * 웹 공식:  min(base × diversity × position_weight × 100, 100) × viewDecay(view)
 * 크롤러는 이 중 **decay 를 뺀 부분까지** 계산해 weighted_score 에 저장한다.
 *
 * decay 는 저장할 수 없다 — 뷰별로 곡선이 4개(hot·recent·midterm·alltime)고
 * "지금"에 의존한다. 저장하면 다음 날 틀린 값이 된다. 렌더 시점에만 곱한다.
 */
export const SCORE_SOURCE_OF_TRUTH = 'minnat';

/** 점수 규칙이 사는 파일. score-parity 가 여기를 읽는다 */
export const SCORE_FILES = {
  web: {
    constants: resolve(ROOT, 'src/lib/constants.ts'),
    formula: resolve(ROOT, 'src/lib/score.ts'),
  },
  crawler: {
    constants: resolve(CRAWLER_ROOT, 'config.py'),
    formula: resolve(CRAWLER_ROOT, 'scorer.py'),
  },
};

/**
 * 두 리포가 반드시 같은 값을 가져야 하는 표.
 *
 * ⚠️ `POSITION_WEIGHT` 는 여기 없다. 웹에 **정의는 있으나 읽는 코드가 없고**
 *    (2026-09-25 실측: constants.ts:62 정의 외 참조 0건), 실제로는 크롤러가
 *    계산해 DB 에 넣은 issue.position_weight 를 쓴다. 지금 넣으면 "웹에 5개가
 *    없다"는 위반이 뜨는데, 고칠 방법이 웹에서 죽은 상수를 지우는 것뿐이다.
 *    죽은 정의를 지운 뒤에 넣는다.
 */
export const SHARED_TABLES = ['CRIMINAL_STAGE_WEIGHT', 'MEDIA_LEAN'];

/**
 * 앵커 — 검사가 보는 **정본이 제자리에 있는가.** 검사보다 먼저 돈다.
 *
 * ## 왜 있나
 *
 * 검사가 정본을 못 찾으면 조용히 0건을 돌려주고, 그건 "위반이 없다" 와 구별되지 않는다.
 * 2026-09-26 에 실제로 겪었다 — 다양도 함수를 event_manager 에서 scorer 로 옮겼는데
 * 검사가 옛 자리를 계속 보다가 비교 자체를 건너뛰었다. 표본에 위반을 심어도 통과했다.
 *
 * **남이 정본을 옮긴 게 아니라 내가 리팩터하며 옮겼다.** 앵커가 막아야 할 것은
 * 주로 이 경우다.
 *
 * ## `repo` 가 필요한 이유
 *
 * 무조건 필수로 만들면 CI 가 영구 빨간불이 된다 — 형제 리포가 체크아웃되지 않는 CI 도
 * 있기 때문이다. 스캔하지 않은 리포의 앵커는 **부분 스캔**으로 알리고 통과시킨다.
 */
export const ANCHORS = [
  {
    what: '점수 공식 단일 소스 (scorer.score_core)',
    repo: 'minnat-crawler',
    path: resolve(CRAWLER_ROOT, 'scorer.py'),
    // 파일만 보지 않는다. 심볼이 다른 모듈로 이사하는 쪽이 더 흔하다.
    count: (text) => (/^def score_core\s*\(/m.test(text) ? 1 : 0),
    min: 1,
  },
  {
    what: '다양도 계단 (scorer.media_diversity)',
    repo: 'minnat-crawler',
    path: resolve(CRAWLER_ROOT, 'scorer.py'),
    count: (text) => (/^def media_diversity\s*\(/m.test(text) ? 1 : 0),
    min: 1,
  },
  {
    what: '웹 점수 상수 (CATEGORY_MAP·CRIMINAL_STAGE_WEIGHT·MEDIA_LEAN)',
    repo: 'minnat',
    path: resolve(ROOT, 'src/lib/constants.ts'),
    count: (text) => ['CATEGORY_MAP', 'CRIMINAL_STAGE_WEIGHT', 'MEDIA_LEAN']
      .filter((n) => new RegExp(`export const ${n}\\b`).test(text)).length,
    min: 3,
  },
  {
    what: '웹 점수 공식 (calculateEventScore)',
    repo: 'minnat',
    path: resolve(ROOT, 'src/lib/score.ts'),
    count: (text) => (/export function calculateEventScore\s*\(/.test(text) ? 1 : 0),
    min: 1,
  },
];

/**
 * 진영 집계가 있는 파일 (M-02, camp-tally).
 *
 * 세 곳에 같은 결함이 있었다 — camp 이 blue 가 아니면 전부 빨강.
 * 두 리포에 걸쳐 있어 한쪽 PR 만 보는 사람은 알 수 없다.
 */
export const CAMP_TALLY_FILES = [
  { label: 'minnat', file: 'src/lib/score.ts', path: resolve(ROOT, 'src/lib/score.ts'), lang: 'ts' },
  { label: 'minnat-crawler', file: 'scorer.py', path: resolve(CRAWLER_ROOT, 'scorer.py'), lang: 'py' },
];

/** 빌드 산출물 — 소스가 아니다 */
export const BUILD_DIRS = new Set([
  'node_modules', 'dist', 'build', 'out', '.next', 'coverage', '.venv', '__pycache__',
]);

/** 공개 웹 — 여기로 넘어간 것은 사용자가 본다 */
export const PUBLIC_REPOS = new Set(['minnat']);
