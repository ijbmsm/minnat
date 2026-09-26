// 점수 규칙이 두 리포에서 같은가.
//
// 크롤러가 계산해 DB(weighted_score)에 넣은 점수와, 웹이 화면에서 다시 계산한
// 점수가 같은 규칙을 따라야 한다. 매일 찍히는 진영 스냅샷("파랑 37% vs 빨강 63%")은
// 앞엣것으로, 홈·이슈목록·정치인 페이지의 순위는 뒤엣것으로 나온다.
// 규칙이 갈리면 두 숫자가 다른 세계에서 나오는데, 화면 어디에도 그 사실이 안 보인다.
//
// 정본은 **웹**이다 (2026-09-25 결정, harness.config.mjs SCORE_SOURCE_OF_TRUTH).
//
//   저장 (크롤러) = min(base × diversity × position_weight × 100, 100)
//   화면 (웹)     = 저장값 × viewDecay(view)
//
// decay 는 검사하지 않는다. 뷰별 곡선이 4개고 "지금"에 의존해서 저장할 수 없다.
//
// 정규식 기반이다. AST 가 아니라 오탐이 있을 수 있고, 그건 baseline 의 reason 으로 관리한다.
// 설계 전에 세어봤다 — 크롤러 전체에서 `diversity` 는 8회 나오고 그중 점수 계산에
// 쓰이는 것은 0회다 (2026-09-25 실측).

import { readFile } from 'node:fs/promises';
import { finding } from '../lib/findings.mjs';
import { SCORE_FILES, SHARED_TABLES } from '../harness.config.mjs';
import { pyCodeOnly } from '../lib/source.mjs';

export const name = 'score-parity';
export const constraint = 'M-01';
/** 지금 고칠 코드를 본다. 레거시 전용이 아니라 baseline 으로 다 새지 않는다 */
export const scope = 'repo';

/** 편집 훅이 이 파일들을 건드릴 때만 돈다 */
export function interested(rel) {
  return /^(src\/lib\/(score|constants)\.ts|config\.py|scorer\.py|event_manager\.py)$/.test(rel);
}

/** `export const NAME ... = {` 부터 첫 `\n};` 까지 */
function tsBlock(src, tableName) {
  const re = new RegExp(`export const ${tableName}[^=]*=\\s*\\{`);
  const m = re.exec(src);
  if (!m) return null;
  const a = m.index + m[0].length - 1;
  const b = src.indexOf('\n};', a);
  return b < 0 ? null : src.slice(a, b);
}

/** `NAME = {` 부터 첫 `\n}` 까지 */
function pyBlock(src, tableName) {
  const re = new RegExp(`^${tableName}\\s*=\\s*\\{`, 'm');
  const m = re.exec(src);
  if (!m) return null;
  const a = m.index + m[0].length - 1;
  const b = src.indexOf('\n}', a);
  return b < 0 ? null : src.slice(a, b);
}

/** `키: 값` 쌍을 뽑는다. 키는 따옴표가 있을 수도 없을 수도 있다 */
function entries(block) {
  const out = {};
  if (!block) return out;
  const re = /["']?([^"'\s:,{}]+)["']?\s*:\s*(?:["']([^"']+)["']|(-?[0-9.]+))/g;
  let m;
  while ((m = re.exec(block)) !== null) out[m[1]] = m[2] ?? m[3];
  return out;
}

/**
 * 두 값이 다른가.
 *
 * ⚠️ 숫자와 문자열을 갈라서 본다. 예전에는
 *    `String(Number(a)) !== String(Number(b)) && String(a) !== String(b)` 였는데,
 *    문자열이면 앞 항이 'NaN' !== 'NaN' = false 라 && 가 단락돼 **문자열 값은
 *    영원히 통과했다**. MEDIA_LEAN 에 진영을 바꿔 심어도 안 잡혔다
 *    (2026-09-25 반대 방향 테스트에서 발견).
 */
function differs(a, b) {
  const na = Number(a), nb = Number(b);
  const bothNum = a !== '' && b !== '' && !Number.isNaN(na) && !Number.isNaN(nb);
  return bothNum ? na !== nb : String(a) !== String(b);
}

/** 파이썬 함수 본문 — `def 이름(` 부터 다음 최상위 `def`/`class` 앞까지 */
function pyFunc(src, fnName) {
  const re = new RegExp(`^def ${fnName}\\s*\\(`, 'm');
  const m = re.exec(src);
  if (!m) return null;
  const rest = src.slice(m.index);
  const next = /\n(?=def |class )/.exec(rest.slice(1));
  return next ? rest.slice(0, next.index + 1) : rest;
}

async function read(p) {
  try { return await readFile(p, 'utf8'); } catch { return null; }
}

export async function run(ctx) {
  // 두 리포를 한꺼번에 보는 검사다. 루트마다 한 번씩 불리므로 한 쪽에서만 돈다.
  if (ctx.label !== 'minnat') return { findings: [], scanned: 0 };

  const webConst = await read(SCORE_FILES.web.constants);
  const webForm = await read(SCORE_FILES.web.formula);
  const crawConst = await read(SCORE_FILES.crawler.constants);
  const crawForm = await read(SCORE_FILES.crawler.formula);

  // 형제 리포가 체크아웃 안 된 CI 에서는 조용히 건너뛴다. 웹 파일이 없으면 그건 문제다.
  if (!crawConst || !crawForm) return { findings: [], scanned: 0 };
  if (!webConst || !webForm) {
    throw new Error(`웹 점수 파일을 못 읽었다: ${SCORE_FILES.web.constants}`);
  }

  const findings = [];
  let scanned = 0;

  // ── ① 공유 표의 키·값이 같은가 ──
  for (const table of SHARED_TABLES) {
    scanned++;
    const web = entries(tsBlock(webConst, table));
    const craw = entries(pyBlock(crawConst, table));

    if (Object.keys(web).length === 0 || Object.keys(craw).length === 0) {
      findings.push(finding({
        check: name,
        id: `minnat-crawler:table#${table}#missing`,
        file: 'config.py',
        severity: 'high',
        message: `${table} 을 한쪽에서 못 찾았다 (웹 ${Object.keys(web).length}개 · 크롤러 ${Object.keys(craw).length}개) — 검사가 헛돌고 있다`,
      }));
      continue;
    }

    for (const key of new Set([...Object.keys(web), ...Object.keys(craw)])) {
      const w = web[key];
      const c = craw[key];
      if (w === undefined || c === undefined) {
        findings.push(finding({
          check: name,
          id: `minnat-crawler:table#${table}#${key}`,
          file: w === undefined ? 'src/lib/constants.ts' : 'config.py',
          severity: 'medium',
          message: `${table}.${key} 이 ${w === undefined ? '웹' : '크롤러'}에만 없다`,
          evidence: `웹=${w ?? '없음'} 크롤러=${c ?? '없음'}`,
        }));
      } else if (differs(w, c)) {
        findings.push(finding({
          check: name,
          id: `minnat-crawler:table#${table}#${key}`,
          file: 'config.py',
          severity: 'high',
          message: `${table}.${key} 값이 다르다 — 같은 사건 점수가 DB 와 화면에서 갈린다`,
          evidence: `웹=${w} 크롤러=${c}`,
        }));
      }
    }
  }

  // ── ② diversity 계단값이 같은가 ──
  scanned++;
  // ⚠️ 값 **집합**으로 비교한다. 웹에는 점수 함수가 둘(calculateIssueScore·
  //    calculateEventScore)이라 같은 계단이 두 벌 나온다. 리스트로 비교하면
  //    웹 6개 vs 크롤러 3개가 되어 늘 위반으로 뜬다 (2026-09-25 오탐 실측).
  const uniq = (a) => [...new Set(a)].sort();
  const webSteps = uniq((webForm.match(/diversityMultiplier\s*=\s*([0-9.]+)/g) ?? [])
    .map((s) => s.split('=')[1].trim()));
  // 다양도는 scorer.media_diversity 에 있다. 예전에는 event_manager 에
  // _calculate_media_diversity 사본이 있었고, 공식을 합치면서 옮겼다.
  //
  // ⚠️ 못 찾으면 **조용히 건너뛰지 않는다.** 2026-09-26 에 그랬다 —
  //    함수가 옮겨간 뒤 검사가 event_manager 를 계속 보다가 null 을 받고,
  //    `crawSteps.length` 가 0 이라 비교 자체를 안 했다. 표본에 계단값을
  //    1.3 → 1.5 로 심었는데 통과했다. 0 건이 정상처럼 보이는 실패다.
  const crawDiv = pyFunc(pyCodeOnly(crawForm), 'media_diversity');
  if (!crawDiv) {
    throw new Error('scorer.py 에서 media_diversity 를 못 찾았다 — 다양도 계단값을 대조할 대상이 없다');
  }
  const crawSteps = uniq((crawDiv.match(/return\s+([0-9.]+)/g) ?? []).map((s) => s.split(/\s+/)[1]));
  if (!crawSteps.length || !webSteps.length) {
    throw new Error(`다양도 계단값을 못 읽었다 (웹 ${webSteps.length}개 · 크롤러 ${crawSteps.length}개)`);
  }

  if (webSteps.join(',') !== crawSteps.join(',')) {
    findings.push(finding({
      check: name,
      id: 'minnat-crawler:diversity#steps',
      file: 'scorer.py',
      severity: 'high',
      message: '진영 다양도 계단값이 두 리포에서 다르다',
      evidence: `웹=[${webSteps}] 크롤러=[${crawSteps}]`,
    }));
  }

  // ── ③ 크롤러 최종 점수식이 웹을 따르는가 ──
  // 웹:     min(base × diversity × posWeight × 100, 100)
  // 크롤러: 같아야 한다. decay 는 제외 (저장 불가)
  //
  // ⚠️ 공식은 scorer.score_core 한 곳에만 있어야 한다. 예전에는 크롤러 안에만
  //    둘이었고(calculate_score · recalculate_event_score) 둘 다 diversity 가
  //    빠져 있었다. 사본이 생기면 다시 갈린다 — 그래서 위임 여부도 같이 본다.
  scanned++;
  // 주석을 걷어낸 코드에서 찾는다 — `# return min(...)` 같은 주석이 섞이면 안 된다
  const core = pyFunc(pyCodeOnly(crawForm), 'score_core');
  if (!core) {
    throw new Error('scorer.py 에서 score_core 를 못 찾았다 — 공식이 어디로 갔는지 확인할 것');
  }
  const coreReturns = core.match(/^\s*return .+$/gm) ?? [];
  const coreLast = coreReturns[coreReturns.length - 1] ?? '';

  if (!/diversity/.test(coreLast)) {
    findings.push(finding({
      check: name,
      id: 'minnat-crawler:formula#diversity',
      file: 'scorer.py',
      severity: 'high',
      message: '최종 점수에 진영 다양도(0.7~1.3)가 안 곱해진다 — 단독 보도가 DB 에서 약 1.43배 높게 저장된다',
      evidence: coreLast.trim(),
    }));
  }
  if (!/\bmin\s*\(/.test(coreLast)) {
    findings.push(finding({
      check: name,
      id: 'minnat-crawler:formula#cap',
      file: 'scorer.py',
      severity: 'medium',
      message: '최종 점수에 100 상한이 없다 — 웹은 Math.min(raw * 100, 100) 으로 자른다',
      evidence: coreLast.trim(),
    }));
  }

  // ── ④ 공식 사본이 다시 생기지 않았는가 ──
  scanned++;
  const eventMgr = await read(SCORE_FILES.crawler.formula.replace(/scorer\.py$/, 'event_manager.py'));
  // ⚠️ 주석·독스트링을 걷어낸 **코드만** 본다. 2026-09-26 실측: 위임을 걷어내고
  //    `# score_core() 를 쓰지 않는다` 라고 적어두니 이 검사가 통과했다.
  const evtFn = eventMgr ? pyFunc(pyCodeOnly(eventMgr), 'recalculate_event_score') : null;
  if (evtFn && !/score_core\s*\(/.test(evtFn)) {
    findings.push(finding({
      check: name,
      id: 'minnat-crawler:formula#duplicate-impl',
      file: 'event_manager.py',
      severity: 'high',
      message: 'recalculate_event_score 가 score_core 를 안 쓴다 — 공식 사본이 다시 생겼다',
    }));
  }
  const calcFn = pyFunc(pyCodeOnly(crawForm), 'calculate_score');
  if (calcFn && !/score_core\s*\(/.test(calcFn)) {
    findings.push(finding({
      check: name,
      id: 'minnat-crawler:formula#duplicate-impl-issue',
      file: 'scorer.py',
      severity: 'high',
      message: 'calculate_score 가 score_core 를 안 쓴다 — 공식 사본이 다시 생겼다',
    }));
  }

  // 독스트링이 코드와 다르면 다음 사람이 코드를 안 읽는다
  // 독스트링 검사는 원본을 본다 — 걷어낸 코드에는 독스트링이 없다
  const coreRaw = pyFunc(crawForm, 'score_core') ?? '';
  if (/final\s*=.*diversity/.test(coreRaw) && !/diversity/.test(coreLast)) {
    findings.push(finding({
      check: name,
      id: 'minnat-crawler:formula#docstring',
      file: 'scorer.py',
      severity: 'low',
      message: '독스트링은 diversity 를 곱한다고 적혀 있는데 코드에는 없다',
    }));
  }

  return { findings, scanned };
}
