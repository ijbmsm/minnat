// 감사 로그 — JSONL.
//
// 설계 원칙 셋
//   1. 로그 실패가 본 작업을 막지 않는다   → 모든 쓰기를 try/catch 로 감싼다
//      ⚠️ 이 원칙은 '로깅'에만 적용한다. '검사'가 조용히 죽으면 보호가 멈춘 걸 아무도 모른다
//   2. 길이를 제한한다                     → message 300자, evidence 120자
//   3. git 에 올리지 않는다                → .gitignore 등록. 경로·사유가 들어간다
//
// 공식 감사 기록은 사실 이 파일이 아니라 `baseline.json` 의 git history 다.
// 언제 무엇이 등록·해제됐고 사유가 무엇이었는지가 커밋에 남는다.
// 이 JSONL 은 그 사이의 '실행 추이'를 보조로 남긴다.

import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const MAX_MESSAGE = 300;
const MAX_EVIDENCE = 120;

/** 매칭된 원문이 새는 걸 막는다. evidence 는 라벨이어야지 값이면 안 된다 (C-33) */
const 금지패턴 = [
  /\b[A-Za-z0-9_-]{32,}\b/,          // 토큰처럼 긴 문자열
  /\b\d{6}-\d{7}\b/,                 // 주민번호 형태
  /\b01\d-?\d{3,4}-?\d{4}\b/,        // 휴대폰
];

function 안전하게(s, max) {
  if (s == null) return null;
  let t = String(s).slice(0, max);
  for (const re of 금지패턴) t = t.replace(new RegExp(re, 'g'), '<마스킹>');
  return t;
}

export function makeLogger(logPath) {
  const write = async (entry) => {
    try {
      await mkdir(dirname(logPath), { recursive: true });
      await appendFile(logPath, JSON.stringify({
        ts: new Date().toISOString(),        // ISO 8601 + 타임존(Z)
        ...entry,
      }, null, 0) + '\n');
    } catch {
      // 로그 실패는 무시한다. 본 작업을 막지 않는다
    }
  };

  return {
    /** 실행 1회 요약 — 추이 그래프의 재료 */
    run: (check, r, scanned) => write({
      kind: 'run', check, scanned,
      total: r.fresh.length + r.acknowledged.length + r.expired.length,
      fresh: r.fresh.length,
      acknowledged: r.acknowledged.length,
      expired: r.expired.length,
      needsTriage: r.needsTriage.length,
      stale: r.stale.length,
    }),

    /** 새로 나타난 위반 — 언제 생겼는지 */
    appeared: (check, f) => write({
      kind: 'appeared', check, id: f.id, severity: f.severity,
      message: 안전하게(f.message, MAX_MESSAGE),
      evidence: 안전하게(f.evidence, MAX_EVIDENCE),
    }),

    /** 사라진 위반 — 고쳐졌거나 파일이 옮겨졌다 */
    resolved: (check, id) => write({ kind: 'resolved', check, id }),

    /** 검사 자체가 터졌다 — 이건 조용히 넘기지 않는다 */
    crashed: (check, err) => write({
      kind: 'crashed', check,
      error: 안전하게(err?.message ?? String(err), MAX_MESSAGE),
    }),
  };
}

export const defaultLogPath = (root) => join(root, '.harness', 'log', 'harness.jsonl');
