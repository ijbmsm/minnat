// M-02 — 진영 집계에 기본값을 두지 않는다.
//
// ## 무엇이 문제인가
//
// 세 곳이 이렇게 쓰여 있었다 (2026-09-29 실측).
//
//   if (camp === "blue") { blue += ... }
//   else                 { red  += ... }   ← camp 가 무엇이든 빨강
//
//   crawler scorer.py:130        generate_daily_snapshot
//   web     score.ts:116         calculateScores
//   web     score.ts:203         calculateEventScores
//
// camp 가 null·빈문자열·오타·새로 생긴 값이면 전부 빨강으로 들어간다. 지금은
// DB 에 blue/red 만 있어 증상이 없지만, **정치 중립이 설계의 중심인 서비스에서
// 진영 집계의 기본값이 한쪽인 것 자체가 결함**이다. 제3정당·무소속을 담게 되는
// 순간 조용히 한쪽에 얹힌다.
//
// 그리고 이 실패는 화면에 안 보인다. 합이 100% 로 맞춰지므로(bluePct + redPct)
// 잘못 얹힌 만큼이 그냥 상대 진영 몫으로 나타난다.
//
// ## 무엇을 요구하는가
//
// 두 진영을 **각각 명시적으로** 비교한다. 어느 쪽도 아니면 세지 않는다.
//
//   if (camp === "blue")      { blue += ... }
//   else if (camp === "red")  { red  += ... }
//   // 그 외는 집계에서 빼고, 필요하면 따로 센다
//
// ## 판정 방법
//
// 정규식이다. "blue 비교 뒤 red 비교 없이 else 가 온다" 를 본다.
// 주석·독스트링은 걷어낸 코드에서만 본다 — 주석에 적힌 else 는 위반이 아니다.

import { readFile } from 'node:fs/promises';
import { finding } from '../lib/findings.mjs';
import { pyCodeOnly, withoutJsComments } from '../lib/source.mjs';
import { CAMP_TALLY_FILES } from '../harness.config.mjs';

export const name = 'camp-tally';
export const constraint = 'M-02';
export const scope = 'repo';

export function interested(rel) {
  return /^(src\/lib\/score\.ts|scorer\.py)$/.test(rel);
}

/**
 * `camp` 을 blue 와 비교하면서 **red 는 비교하지 않는** 자리.
 *
 * 판정은 하나다 — blue 비교 근처에 red 비교가 있는가.
 *
 *   if blue: … else: …            ← red 비교 없음. 위반
 *   if blue: … elif red: …        ← 정상
 *   if (blue) … else if (red) …   ← 정상
 *
 * ⚠️ `else` 를 찾는 방식은 두 번 오탐을 냈다 (2026-09-29).
 *    ① "else 와 red 의 위치" 를 견줬더니 `else if (camp === "red")` 에서 else 가
 *       앞이라 고친 코드를 잡았다
 *    ② "맨 else" 로 바꿨더니 창이 블록을 넘어가 `x = a if c else 50` 의 삼항
 *       else 를 잡았다
 *    구문을 흉내내려다 두 번 틀렸다. **있어야 하는 것이 있는가**만 보면
 *    구문을 몰라도 된다. 창을 넘어가도 최악이 누락(위반을 놓침)이라 안전하다.
 */
function findMissingRed(code) {
  const hits = [];
  const re = /camp[^\n]{0,24}==+\s*["']blue["']/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    const window = code.slice(m.index, m.index + 300);
    if (/==+\s*["']red["']/.test(window)) continue;
    hits.push(code.slice(0, m.index).split('\n').length);
  }
  return hits;
}

async function read(p) {
  try { return await readFile(p, 'utf8'); } catch { return null; }
}

export async function run(ctx) {
  // 두 리포를 한꺼번에 본다. 루트마다 불리므로 한 쪽에서만 돈다
  if (ctx.label !== 'minnat') return { findings: [], scanned: 0 };

  const findings = [];
  let scanned = 0;

  for (const { label, file, path, lang } of CAMP_TALLY_FILES) {
    const src = await read(path);
    // 형제 리포가 없는 CI 면 건너뛴다. 앵커가 부분 스캔을 따로 알린다
    if (src === null) continue;
    scanned++;

    const code = lang === 'py' ? pyCodeOnly(src) : withoutJsComments(src);
    let seen = 0;
    for (const line of findMissingRed(code)) {
      seen++;
      findings.push(finding({
        check: name,
        // ⚠️ id 에 줄 번호를 넣지 않는다. 코드를 조금만 고쳐도 줄이 밀려
        //    baseline 항목과 표본 기대값이 통째로 깨진다 (2026-09-30 실측:
        //    독립성 전환으로 3건이 전부 새 위반으로 뜨고 옛 3건은 '해소됨' 이 됐다).
        //    파일 안에 여러 건이 있으면 **몇 번째인가**로 가른다 — 위치가 아니라 순서다.
        id: `${label}:camp-tally#${file}#${seen}`,
        file,
        line,
        severity: 'high',
        message: 'blue 만 비교하고 red 는 안 본다 — 나머지가 전부 한쪽에 얹힌다. 두 진영을 각각 비교할 것',
        evidence: code.split('\n')[line - 1]?.trim().slice(0, 80),
      }));
    }
  }

  return { findings, scanned };
}
