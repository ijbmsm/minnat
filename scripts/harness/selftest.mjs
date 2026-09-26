#!/usr/bin/env node
// 검사가 살아 있는가.
//
// 위반이 0 건인 검사는 **위반을 심어 보기 전까지 작동 여부를 모른다.**
// 검사가 망가져도 0 건은 그대로다. 구별할 방법이 없다.
//
// 실제로 두 번 걸렸다 (2026-09-25~26).
//   ① 값 비교가 단락 평가라 문자열이 영원히 통과했다 — MEDIA_LEAN 에
//      진영을 바꿔 심어도 안 잡혔다. 숫자 표만 보면 끝까지 모른다
//   ② 다양도 함수가 scorer 로 옮겨간 뒤 검사가 event_manager 를 계속 봤다.
//      못 찾으면 조용히 건너뛰어서 계단값을 1.3 → 1.5 로 심어도 통과했다
//
// 그래서 표본을 둔다.
//   fixtures/dirty/  판정마다 위반을 하나씩 심었다  → 누락 방향
//   fixtures/clean/  같은 구조에서 규칙을 지켰다     → 오탐 방향
//
// 기대값은 이 파일 한 곳에만 있다.
//
//   node scripts/harness/selftest.mjs

import { execFile } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const RUN = join(HERE, 'run.mjs');

/** dirty 표본에서 나와야 하는 finding id. 하나라도 빠지면 그 판정이 죽은 것이다 */
const EXPECTED_DIRTY = [
  'minnat-crawler:table#CRIMINAL_STAGE_WEIGHT#confirmed',
  'minnat-crawler:table#MEDIA_LEAN#조선일보',
  'minnat-crawler:diversity#steps',
  'minnat-crawler:formula#diversity',
  'minnat-crawler:formula#cap',
  'minnat-crawler:formula#duplicate-impl',
  'minnat-crawler:formula#duplicate-impl-issue',
];

function run(crawlerRoot) {
  return new Promise((ok, fail) => {
    execFile(
      process.execPath,
      [RUN, '--json'],
      // baseline 을 무시해야 심은 위반이 '기존 위반' 으로 숨지 않는다.
      // 표본은 baseline 과 무관하게 판정 자체를 본다.
      { env: { ...process.env, HARNESS_CRAWLER_ROOT: crawlerRoot }, maxBuffer: 32 * 1024 * 1024 },
      (err, stdout) => {
        const i = stdout.indexOf('{');
        if (i < 0) return fail(new Error(`JSON 이 없다:\n${stdout.slice(0, 400)}`));
        try {
          ok(JSON.parse(stdout.slice(i)));
        } catch (e) {
          // stdout 절단이 여기서 드러난다. run.mjs 가 process.exit() 을 쓰면
          // 파이프 버퍼가 비워지기 전에 죽어 JSON 이 잘린다 (2026-09-26 실측)
          fail(new Error(`JSON.parse 실패 (${stdout.length}바이트): ${e.message}`));
        }
      },
    );
  });
}

/** 판정에 잡힌 finding id 전부 — baseline 등록 여부와 무관하게 */
function allIds(report) {
  const out = new Set();
  for (const r of Object.values(report)) {
    if (r.crashed) continue;
    for (const key of ['fresh', 'acknowledged', 'expired']) {
      for (const f of r[key] ?? []) out.add(f.id);
    }
  }
  return out;
}

function crashed(report) {
  return Object.entries(report).filter(([, r]) => r.crashed).map(([n, r]) => `${n}: ${r.error}`);
}

let n = 0;
let bad = 0;
const ok = (cond, label) => {
  n++;
  if (cond) console.log(`ok ${n} - ${label}`);
  else { bad++; console.log(`not ok ${n} - ${label}`); }
};

const dirty = await run(resolve(HERE, 'fixtures/dirty'));
const clean = await run(resolve(HERE, 'fixtures/clean'));

ok(crashed(dirty).length === 0, `dirty 표본에서 검사가 터지지 않는다 ${crashed(dirty).join('; ')}`);
ok(crashed(clean).length === 0, `clean 표본에서 검사가 터지지 않는다 ${crashed(clean).join('; ')}`);

const got = allIds(dirty);
for (const id of EXPECTED_DIRTY) {
  ok(got.has(id), `dirty 에서 잡는다: ${id}`);
}

const cleanIds = allIds(clean);
ok(cleanIds.size === 0, `clean 에서는 아무것도 안 잡는다 (잡힌 것: ${[...cleanIds].join(', ') || '없음'})`);

// 심지 않은 것까지 잡으면 오탐이다
const extra = [...got].filter((id) => !EXPECTED_DIRTY.includes(id));
ok(extra.length === 0, `dirty 에서 심지 않은 것을 잡지 않는다 (추가: ${extra.join(', ') || '없음'})`);

console.log(`\n1..${n}`);
if (bad) console.error(`\n${bad}건 실패 — 검사가 망가졌거나 표본이 낡았다`);
process.exitCode = bad ? 1 : 0;
