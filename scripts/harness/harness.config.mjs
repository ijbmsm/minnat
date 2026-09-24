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
export const ROOT = resolve(HERE, '../..');
const SIBLING = (name) => resolve(ROOT, '..', name);

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

/** 빌드 산출물 — 소스가 아니다 */
export const BUILD_DIRS = new Set([
  'node_modules', 'dist', 'build', 'out', '.next', 'coverage', '.venv', '__pycache__',
]);

/** 공개 웹 — 여기로 넘어간 것은 사용자가 본다 */
export const PUBLIC_REPOS = new Set(['minnat']);
