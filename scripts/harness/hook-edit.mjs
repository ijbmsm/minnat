#!/usr/bin/env node
// 편집 직후 훅 (PostToolUse: Edit|Write|MultiEdit).
//
// 가장 값싼 게이트다 — 에이전트가 아직 맥락을 들고 있을 때 걸리니 왕복이 없다.
// 같은 지적을 PR 에서 받으면 파일을 다시 열고 기억을 되살려야 한다.
//
// 설계 (harness-spec §5)
//   - 편집된 파일만 본다. 전체 스캔 금지
//   - baseline 을 안다. 레거시 파일을 열 때마다 기존 위반을 뱉으면 그날로 꺼진다
//   - 훅 자체가 터져도 본 작업을 막지 않는다 (exit 0). CI 가 뒤에서 또 본다
//
// 종료 코드
//   0  통과 또는 무관 — 조용히 넘어간다
//   2  새 위반 — stderr 가 에이전트에게 전달된다

import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { makeLogger, defaultLogPath } from './lib/audit.mjs';
import { CHECKS } from './checks/index.mjs';
import { EDIT_ROOTS, ROOT } from './harness.config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = ROOT;

/** 표식 디렉터리 네임스페이스. 엔진이 리포 이름을 모르게 ROOT 에서 판다 */
const NS = createHash('sha256').update(ROOT).digest('hex').slice(0, 8);


const log = makeLogger(defaultLogPath(REPO));

/** 훅 입력을 stdin 으로 받는다 */
async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * 같은 편집이 두 번 들어오면 두 번째는 조용히 넘긴다.
 *
 * 훅이 user 설정과 프로젝트 설정 두 곳에 등록돼 있다. 예전에는 user 쪽에
 * `$PWD` 가드를 둬서 이중 실행을 막았는데, 세션을 리포 밖에서 열고
 * 리포로 들어오면 **둘 다 빠지는 구간**이 생겼다 (charzing 2026-09-22 실측).
 * 가드를 빼고 여기서 거른다 — 구멍보다 중복이 낫다.
 *
 * 키는 훅 입력 전체의 해시다. 편집이 다르면 페이로드가 달라 통과한다.
 */
async function 이미봤나(raw) {
  const key = createHash('sha256').update(raw).digest('hex').slice(0, 16);
  const mark = join(tmpdir(), `harness-hook-${NS}`, key);
  try {
    const { mtimeMs } = await stat(mark);
    if (Date.now() - mtimeMs < 10_000) return true;
  } catch { /* 없으면 처음이다 */ }
  try {
    await mkdir(dirname(mark), { recursive: true });
    await writeFile(mark, '');
  } catch { /* 표식을 못 남겨도 검사는 돈다 */ }
  return false;
}

/**
 * 절대경로 → { label, root, rel }. 모르는 위치면 null.
 *
 * 중첩 루트(`only` 가 붙은 것)는 목록에 없다 — 부모 루트로 잡힌다.
 * 트리 검사가 거기까지 훑기 때문이다 (harness.config.mjs).
 */
function locate(abs) {
  for (const { label, root } of EDIT_ROOTS) {
    const rel = relative(root, abs);
    if (rel && !rel.startsWith('..') && !rel.startsWith(sep)) return { label, root, rel };
  }
  return null;
}

try {
  const raw = await readStdin();
  if (!raw.trim()) process.exit(0);
  if (await 이미봤나(raw)) process.exit(0);

  const input = JSON.parse(raw);
  const filePath = input?.tool_input?.file_path;
  if (!filePath) process.exit(0);

  const loc = locate(resolve(filePath));
  if (!loc) process.exit(0);                      // 리포 밖 편집

  let baseline = {};
  try {
    baseline = JSON.parse(await readFile(resolve(HERE, 'baseline.json'), 'utf8'));
  } catch { /* 없으면 전부 새 위반으로 본다 */ }

  const 새위반 = [];

  for (const name of CHECKS) {
    const mod = await import(`./checks/${name}.mjs`);

    // 관심 없는 파일이면 검사를 아예 돌리지 않는다
    if (typeof mod.interested === 'function' && !mod.interested(loc.rel)) continue;

    const { findings } = await mod.run({ root: loc.root, label: loc.label });

    // 파일 경로로 거르지 않는다.
    // public-env 는 id 가 `env#VAR`, dead-dep 은 `dep#name` 이라 경로와 안 맞는다.
    // baseline 이 현재 위반을 전부 담고 있으므로, 여기 없는 것이 곧 이번 편집이 만든 것이다.
    const known = baseline[name]?.known ?? {};
    for (const f of findings) if (!known[f.id]) 새위반.push({ check: name, constraint: mod.constraint, ...f });
  }

  if (새위반.length === 0) process.exit(0);

  for (const f of 새위반) await log.appeared(f.check, f);

  const 줄 = 새위반.map((f) =>
    `  [${f.check}] ${f.message}\n` +
    `     제약 ${f.constraint} — .harness/constraints.md\n` +
    `     baseline 에 없는 새 위반이다. 고치거나, 정당한 예외면 사유와 기한을 적어 등록한다.`
  );
  console.error(`하네스: ${loc.rel} 에 새 위반 ${새위반.length}건\n${줄.join('\n')}`);
  process.exit(2);

} catch (err) {
  // 훅이 터져도 본 작업을 막지 않는다. CI 가 뒤에서 또 본다.
  await log.crashed('hook-edit', err);
  process.exit(0);
}
