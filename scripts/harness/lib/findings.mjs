// 하네스 finding 공통 형식.
// 검증 서브에이전트도 같은 형식을 쓴다 — 감사 로그와 측정이 한 파이프로 흐르게 하기 위함.

/** @typedef {'high'|'medium'|'low'} Severity */

/**
 * @param {{check:string, id:string, file:string, line?:number,
 *          severity:Severity, message:string, evidence?:string}} f
 */
export function finding(f) {
  return { line: null, evidence: null, ...f };
}

/** baseline 에 등록된 항목인지. 만료된 면제는 통과시키지 않는다. */
export function classify(findings, baselineEntry, today = new Date(), scannedLabels = null) {
  const known = baselineEntry?.known ?? {};
  const fresh = [];
  const acknowledged = [];
  const expired = [];
  const needsTriage = [];   // until 이 정해지지 않은 것. 영구 면제로 새지 않게 따로 센다

  for (const f of findings) {
    const k = known[f.id];
    if (!k) { fresh.push(f); continue; }
    const hasDate = k.until != null && !Number.isNaN(Date.parse(k.until));
    if (hasDate && new Date(k.until) < today) {
      expired.push({ ...f, message: `${f.message} (면제 만료: ${k.until})` });
    } else {
      acknowledged.push({ ...f, reason: k.reason ?? null });
      if (k.until != null && !hasDate) needsTriage.push({ ...f, reason: k.reason ?? null });
    }
  }

  // baseline 에 있는데 더 이상 안 잡히는 것 = 고쳐진 것. 목록에서 빼라고 알린다.
  //
  // ⚠️ 이번에 스캔하지 않은 리포의 항목은 제외한다.
  //    CI 는 형제 리포를 체크아웃하지 않아서, 안 그러면 admin 항목이 전부 '해소됨'으로 뜬다.
  const ids = new Set(findings.map((f) => f.id));
  const stale = Object.keys(known).filter((id) => {
    if (ids.has(id)) return false;
    if (scannedLabels) {
      const label = id.split(':')[0];
      if (!scannedLabels.has(label)) return false;
    }
    return true;
  });

  return { fresh, acknowledged, expired, stale, needsTriage };
}

export function formatText(name, r) {
  const L = [];
  const mark = { high: '!!', medium: '! ', low: '  ' };
  if (r.fresh.length) {
    L.push(`\n[${name}] 새 위반 ${r.fresh.length}건`);
    for (const f of r.fresh) L.push(`  ${mark[f.severity]} ${f.file}${f.line ? ':' + f.line : ''}  ${f.message}`);
  }
  if (r.expired.length) {
    L.push(`\n[${name}] 면제 만료 ${r.expired.length}건`);
    for (const f of r.expired) L.push(`  !! ${f.file}  ${f.message}`);
  }
  if (r.stale.length) {
    L.push(`\n[${name}] 해소됨 — baseline 에서 빼도 된다 (${r.stale.length}건)`);
    for (const id of r.stale) L.push(`     ${id}`);
  }
  if (r.acknowledged.length) L.push(`\n[${name}] 기존 위반 ${r.acknowledged.length}건 (baseline 등록됨)`);
  if (r.needsTriage.length) {
    const byS = { high: 0, medium: 0, low: 0 };
    for (const f of r.needsTriage) byS[f.severity]++;
    L.push(`\n[${name}] 기한 미정 ${r.needsTriage.length}건 — high ${byS.high} / medium ${byS.medium}`);
    L.push(`     baseline 의 until 을 날짜로 바꾸거나, 고칠 필요가 없으면 null 로 바꾼다`);
  }
  return L.join('\n');
}
