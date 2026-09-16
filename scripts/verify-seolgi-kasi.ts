/**
 * 절기 시각 대조 — public/seolgi.json (Skyfield) vs 한국천문연구원 24절기 API (분 단위 KST)
 *   npx tsx scripts/verify-seolgi-kasi.ts --from=1900 --to=2050
 * 허용 오차: ±1분 (KASI 는 분 단위 공표). 초과 건을 전부 출력한다.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import type { SeolgiRow } from '../src/lib/saju/seolgi-loader';
import { get24Divisions, loadEnvLocal, parseRange } from './kasi';
import { kstWallToUTC } from '../src/lib/saju/kst-offset';

loadEnvLocal();
const { from, to } = parseRange(process.argv, 1900, 2050);
const rows: SeolgiRow[] = JSON.parse(readFileSync(join(process.cwd(), 'public', 'seolgi.json'), 'utf-8'));

// seolgi.json 을 (연-절기명) 으로 색인. 같은 절기가 한 해에 두 번 나올 수 없다.
const ours = new Map<string, SeolgiRow>();
for (const r of rows) {
  const y = new Date(r.instant_utc).getUTCFullYear();
  // 소한·대한은 KST 기준 연도로 잡아야 KASI 와 같은 해에 붙는다 (UTC 12/31 늦은 시각 케이스)
  const kstYear = new Date(new Date(r.instant_utc).getTime() + 9 * 3600 * 1000).getUTCFullYear();
  ours.set(`${kstYear}-${r.name_ko}`, r);
  if (kstYear !== y) ours.set(`${y}-${r.name_ko}`, r);
}

interface Diff { key: string; kasiKst: string; oursUtc: string; diffMin: number }

async function main(): Promise<void> {
  let total = 0, missing = 0;
  const diffs: Diff[] = [];
  for (let y = from; y <= to; y++) {
    for (let m = 1; m <= 12; m++) {
      const items = await get24Divisions(y, m);
      for (const it of items) {
        total++;
        const key = `${y}-${it.dateName}`;
        const r = ours.get(key);
        if (!r) { missing++; console.log(`  seolgi.json 에 없음: ${key}`); continue; }
        const yy = Number(it.locdate.slice(0, 4)), mm = Number(it.locdate.slice(4, 6)), dd = Number(it.locdate.slice(6, 8));
        const hh = Number(it.kst.slice(0, 2)), mi = Number(it.kst.slice(2, 4));
        // KASI 는 당시 시계 시각(표준시·서머타임 반영)으로 공표한다 → 같은 규칙으로 UTC 환산
        const kasiUtc = kstWallToUTC(yy, mm, dd, hh, mi).utc.getTime();
        const diffMin = (new Date(r.instant_utc).getTime() - kasiUtc) / 60000;
        if (Math.abs(diffMin) > 1) diffs.push({ key, kasiKst: `${it.locdate} ${it.kst}`, oursUtc: r.instant_utc, diffMin: Math.round(diffMin * 10) / 10 });
      }
    }
  }
  console.log(`\n절기 대조 ${from}~${to}: ${total}건, 누락 ${missing}, ±1분 초과 ${diffs.length}`);
  for (const d of diffs) console.log(`  ${d.key}  KASI=${d.kasiKst}  ours=${d.oursUtc}  Δ${d.diffMin}분`);
  process.exit(diffs.length === 0 && missing === 0 ? 0 : 1);
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exit(2); });
