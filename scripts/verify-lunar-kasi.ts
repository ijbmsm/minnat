/**
 * 음력 변환 대조 — KASI 가 준 (음력 연·월·일·윤달) 을 lunarToSolar 에 넣어 양력이 KASI 의 양력과 같은지
 *   npx tsx scripts/verify-lunar-kasi.ts --from=1900 --to=2050
 * korean-lunar-calendar 패키지의 지원 범위(1000~2050) 밖은 건너뛴다.
 */
import { lunarToSolar } from '../src/lib/saju/lunar';
import { getLunCalMonth, loadEnvLocal, parseRange } from './kasi';

loadEnvLocal();
const { from, to } = parseRange(process.argv, 1900, 2050);

interface Mismatch { lunar: string; kasiSolar: string; ours: string }

async function main(): Promise<void> {
  let total = 0, skipped = 0;
  const mismatches: Mismatch[] = [];
  for (let y = from; y <= to; y++) {
    for (let m = 1; m <= 12; m++) {
      const items = await getLunCalMonth(y, m);
      for (const it of items) {
        total++;
        const ly = Number(it.lunYear), lm = Number(it.lunMonth), ld = Number(it.lunDay);
        const leap = it.lunLeapmonth === '윤';
        let ours: string;
        try {
          const s = lunarToSolar(ly, lm, ld, leap);
          ours = `${s.year}-${String(s.month).padStart(2,'0')}-${String(s.day).padStart(2,'0')}`;
        } catch { skipped++; continue; }
        const kasi = `${it.solYear}-${it.solMonth.padStart(2,'0')}-${it.solDay.padStart(2,'0')}`;
        if (ours !== kasi) mismatches.push({ lunar: `${ly}-${lm}-${ld}${leap ? '(윤)' : ''}`, kasiSolar: kasi, ours });
      }
    }
    if ((y - from) % 10 === 9) console.log(`  ${y} 까지 ${total}일, 불일치 ${mismatches.length}, 범위밖 ${skipped}`);
  }
  console.log(`\n음력 대조 ${from}~${to}: ${total}일, 불일치 ${mismatches.length}, 변환 불가 ${skipped}`);
  for (const mm of mismatches.slice(0, 50)) console.log(`  음력 ${mm.lunar}  KASI양력=${mm.kasiSolar}  ours=${mm.ours}`);
  process.exit(mismatches.length === 0 ? 0 : 1);
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exit(2); });
