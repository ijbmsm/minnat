/**
 * 일주(日柱) 전수 대조 — 한국천문연구원 음양력 API 의 일진(lunIljin) vs engine.ts
 *   npx tsx scripts/verify-day-pillar-kasi.ts --from=1900 --to=2050
 * 정오 KST 입력으로 계산하면 solarDate 가 그 날짜 그대로라 달력 일진과 1:1 로 비교된다.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildSeolgiIndex, type SeolgiRow } from '../src/lib/saju/seolgi-loader';
import { computeFourPillars, fromKST } from '../src/lib/saju/engine';
import { getLunCalMonth, koreanGz, loadEnvLocal, parseRange } from './kasi';

loadEnvLocal();
const { from, to } = parseRange(process.argv, 1900, 2050);
const rows: SeolgiRow[] = JSON.parse(readFileSync(join(process.cwd(), 'public', 'seolgi.json'), 'utf-8'));
const index = buildSeolgiIndex(rows);

interface Mismatch { date: string; kasi: string; ours: string }

async function main(): Promise<void> {
  let total = 0;
  const mismatches: Mismatch[] = [];
  for (let y = from; y <= to; y++) {
    for (let m = 1; m <= 12; m++) {
      const items = await getLunCalMonth(y, m);
      for (const it of items) {
        const d = Number(it.solDay);
        const fp = computeFourPillars(index, fromKST(y, m, d, 12, 0, 127.0), 'male');
        const ours = `${fp.day.stem}${fp.day.branch}`;
        const kasi = koreanGz(it.lunIljin);
        total++;
        if (ours !== kasi) mismatches.push({ date: `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`, kasi, ours });
      }
    }
    if ((y - from) % 10 === 9) console.log(`  ${y} 까지 ${total}일 검사, 불일치 ${mismatches.length}`);
  }
  console.log(`\n일주 대조 ${from}~${to}: ${total}일, 불일치 ${mismatches.length}`);
  for (const mm of mismatches.slice(0, 50)) console.log(`  ${mm.date}  KASI=${mm.kasi}  ours=${mm.ours}`);
  if (mismatches.length > 50) console.log(`  … 외 ${mismatches.length - 50}건`);
  process.exit(mismatches.length === 0 ? 0 : 1);
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exit(2); });
