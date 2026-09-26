#!/usr/bin/env node
// 하네스 러너.
// 검사는 러너 독립 순수 모듈이다 — 각 리포의 테스트 러너(node:test / vitest / jest)는
// 이 결과 JSON 을 assert 만 한다.
//
//   node scripts/harness/run.mjs                 전체
//   node scripts/harness/run.mjs --check api-auth
//   node scripts/harness/run.mjs --json
//   node scripts/harness/run.mjs --update-baseline

import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPOS, ROOT } from './harness.config.mjs';
import { classify, formatText } from './lib/findings.mjs';
import { CHECKS } from './checks/index.mjs';
import { makeLogger, defaultLogPath } from './lib/audit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = ROOT;

/** 검사 대상 루트. CI 에서는 형제 리포가 체크아웃되지 않으므로 실재하는 것만 본다. */
const ROOTS = [];
for (const c of REPOS) {
  try { await access(c.root); ROOTS.push(c); } catch { /* 없으면 건너뛴다 */ }
}



if (ROOTS.length === 0) { console.error('스캔할 리포가 없다'); process.exit(1); }
if (!process.argv.includes('--json')) {
  console.log(`스캔 대상: ${ROOTS.map((r) => r.label).join(', ')}`);
}

const argv = process.argv.slice(2);
const only = argv.includes('--check') ? argv[argv.indexOf('--check') + 1] : null;
const scope = argv.includes('--scope') ? argv[argv.indexOf('--scope') + 1] : null;
const asJson = argv.includes('--json');
const update = argv.includes('--update-baseline');

const baselinePath = join(HERE, 'baseline.json');
let baseline = {};
try { baseline = JSON.parse(await readFile(baselinePath, 'utf8')); } catch { /* 최초 실행 */ }

const log = makeLogger(defaultLogPath(REPO));
let failed = 0;
let crashed = 0;
const report = {};

for (const name of CHECKS) {
  if (only && only !== name) continue;
  const mod = await import(`./checks/${name}.mjs`);
  if (scope && (mod.scope ?? 'repo') !== scope) continue;

  // `only` 가 붙은 루트는 그 검사만 받는다. 중첩 루트의 이중 스캔을 막는다 (harness.config.mjs)
  const roots = ROOTS.filter((r) => !r.only || r.only.includes(name));

  let all = [];
  let scanned = 0;
  try {
    for (const ctx of roots) {
      const r = await mod.run(ctx);
      all = all.concat(r.findings);
      scanned += r.scanned;
    }
  } catch (err) {
    // 검사가 터지면 조용히 넘기지 않는다. 다른 검사는 계속 돌린다.
    // 보호가 멈춘 것을 모르는 게 빨간불보다 나쁘다.
    crashed++;
    await log.crashed(name, err);
    console.error(`\n[${name}] 검사가 실패했다 — ${err?.message ?? err}`);
    report[name] = { crashed: true, error: String(err?.message ?? err) };
    continue;
  }

  const c = classify(all, baseline[name], new Date(), new Set(roots.map((r) => r.label)));
  report[name] = { constraint: mod.constraint, scanned, total: all.length, ...c };

  if (update) {
    const known = { ...(baseline[name]?.known ?? {}) };
    for (const f of all) {
      if (!known[f.id]) known[f.id] = { reason: '미분류 — 사유를 적을 것', until: null, severity: f.severity };
    }
    baseline[name] = { known };
  } else {
    failed += c.fresh.length + c.expired.length;
    await log.run(name, c, scanned);
    for (const f of c.fresh) await log.appeared(name, f);
    for (const id of c.stale) await log.resolved(name, id);
  }

  if (!asJson) {
    console.log(`\n${'='.repeat(64)}\n${name}  (${mod.constraint})  — ${scanned}개 스캔, 위반 ${all.length}건`);
    console.log(formatText(name, c) || '  위반 없음');
  }
}

// ⚠️ process.exit() 을 쓰지 않는다.
//
//    console.log 직후에 exit 을 부르면 **stdout 이 파이프일 때 버퍼가 비워지기 전에
//    프로세스가 죽어 출력이 잘린다.** 실측(2026-09-26): 200,001 바이트를 쓰고
//    process.exit() 하면 Node execFile 로 받을 때 8,192 바이트(파이프 버퍼 하나)만
//    도착한다. exitCode 로 두면 200,001 전부 온다.
//
//    대화형으로는 안 보인다 — stdout 이 TTY 면 동기 쓰기다. 그래서 --json 을
//    사람이 볼 때는 멀쩡하고, **프로그램이 소비하는 순간** 조용히 깨진다
//    (CI 파싱, Stop 훅, 다른 도구). charzing 쪽에서 46KB JSON 이 6,987 바이트로
//    잘려 JSON.parse 가 "Unterminated string" 으로 터졌다.
if (update) {
  await writeFile(baselinePath, JSON.stringify(baseline, null, 2) + '\n');
  console.log(`\nbaseline 갱신: ${baselinePath}`);
  console.log('각 항목의 reason 과 until 을 채울 것. 영구 면제는 두지 않는다.');
  process.exitCode = 0;
} else {
  if (asJson) console.log(JSON.stringify(report, null, 2));
  else {
    const msg = crashed ? `실패 — 검사 ${crashed}개가 터졌다`
              : failed  ? `실패 — 새 위반/만료 ${failed}건`
              : '통과';
    console.log(`\n${'='.repeat(64)}\n${msg}`);
  }
  process.exitCode = failed || crashed ? 1 : 0;
}
