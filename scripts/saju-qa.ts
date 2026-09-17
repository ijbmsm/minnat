/**
 * LLM 통변 자동 QA (SAJU_PLAN_V2 P4-3)
 *   npx tsx scripts/saju-qa.ts            # scripts/qa-samples/*.json 전부
 * 샘플 형식 (collect-qa-samples.ts 가 만든다):
 *   { type, birth: {year,month,day,hour,minute,sex,longitudeE}, sections: [{title, body}] }
 * 검사:
 *   (a) 신강/신약 모순 — 신강에 인성 보강, 신약에 식상·재성 강화 권장 → fail
 *   (b) 팩트시트에 없는 신살 언급 → fail
 *   (c) 금지 generic 표현 → fail
 *   (d) 타이밍 섹션에 연도·나이 없음 → warn
 *   (e) 같은 타입 샘플 간 문자 2-gram 코사인 유사도 > 0.55 → 몰개성 warn (임베딩 API 없이)
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { calcSajuServer } from '../src/lib/saju/server';
import { buildFactSheet } from '../src/lib/saju/factsheet';
import { HONGYEOM_MAP, type ReadingType } from '../src/lib/saju/prompt';

interface Sample {
  file: string;
  type: ReadingType;
  birth: { year: number; month: number; day: number; hour: number | null; minute?: number; sex: 'male' | 'female'; longitudeE?: number };
  sections: { label?: string; title: string; body: string }[];
}

const SINSAL_NAMES = ['역마살', '도화살', '양인살', '화개살', '천을귀인', '백호대살', '원진살', '귀문관살', '겁살', '재살', '천살', '지살', '망신살', '장성살', '반안살', '육해살', '홍염살'];
const GENERIC = ['좋은 기회가 온다', '좋은 기회가 올', '힘든 시기가 지나간다', '힘든 시기가 지나갈', '운이 좋다', '운이 나쁘다', '분명 잘 될', '걱정 마', '걱정하지 마', '다 잘 될'];
const TIMING_TITLE = /시기|타이밍|흐름|예고|運|운$|만남|타임라인/;
// 후킹 제목으로 바뀐 뒤로는 제목만으로 타이밍 섹션을 못 고른다 — 고정 라벨을 우선 본다.
const TIMING_LABELS = new Set(['올해', '내년', '타이밍', '인연', '재물']);

function loadSamples(): Sample[] {
  const dir = join(process.cwd(), 'scripts', 'qa-samples');
  let files: string[] = [];
  try { files = readdirSync(dir).filter(f => f.endsWith('.json')); } catch { return []; }
  return files.map(f => ({ file: f, ...(JSON.parse(readFileSync(join(dir, f), 'utf-8')) as Omit<Sample, 'file'>) }));
}

function bigrams(s: string): Map<string, number> {
  const t = s.replace(/\s+/g, '');
  const m = new Map<string, number>();
  for (let i = 0; i < t.length - 1; i++) { const g = t.slice(i, i + 2); m.set(g, (m.get(g) ?? 0) + 1); }
  return m;
}
function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, na = 0, nb = 0;
  for (const [k, v] of a) { na += v * v; const w = b.get(k); if (w) dot += v * w; }
  for (const v of b.values()) nb += v * v;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

interface Finding { file: string; level: 'fail' | 'warn'; rule: string; detail: string }

function check(sample: Sample): Finding[] {
  const out: Finding[] = [];
  const b = sample.birth;
  const fp = calcSajuServer(b.year, b.month, b.day, b.hour, b.sex, b.longitudeE ?? 127.0, b.minute ?? 0, 'midnight');
  const fs = buildFactSheet(fp, 'free', sample.type);
  const text = sample.sections.map(s => `${s.title}\n${s.body}`).join('\n');

  // (a) 신강·신약 모순.
  //     "인성을 더 채우면 독이 된다" 처럼 부정 맥락에서 같은 어휘가 나오므로,
  //     매치 주변에 부정 표현이 있으면 권장이 아니라 경고로 보고 넘긴다.
  const NEGATION = /독이|악순환|금물|금지|피해|피하|위험|말고|말아|아니라|오히려|줄이|덜어|경계|과잉|과다/;
  const recommends = (re: RegExp): boolean => {
    for (const m of text.matchAll(new RegExp(re.source, 'g'))) {
      const i = m.index ?? 0;
      const around = text.slice(Math.max(0, i - 30), i + m[0].length + 30);
      if (!NEGATION.test(around)) return true;
    }
    return false;
  };
  if (fs.bodyStrength === 'strong' && recommends(/인성[^。.\n]{0,12}(보강|보완|강화|채우|키우)/)) out.push({ file: sample.file, level: 'fail', rule: 'a.신강모순', detail: '신강 차트에 인성 보강 권장' });
  if (fs.bodyStrength === 'weak' && recommends(/(식상|식신|상관|재성)[^。.\n]{0,12}(활성|강화|키우|살리)/)) out.push({ file: sample.file, level: 'fail', rule: 'a.신약모순', detail: '신약 차트에 식상·재성 강화 권장' });

  // (b)
  const allowed = new Set(fs.sinsal.map(s => s.name));
  const hy = HONGYEOM_MAP[fs.dayMaster.stem];
  if (hy && fs.pillars.some(p => p.branch === hy)) allowed.add('홍염살');
  for (const name of SINSAL_NAMES) {
    if (text.includes(name) && !allowed.has(name)) out.push({ file: sample.file, level: 'fail', rule: 'b.없는신살', detail: `${name} 언급 (팩트시트에 없음)` });
  }

  // (c)
  for (const g of GENERIC) if (text.includes(g)) out.push({ file: sample.file, level: 'fail', rule: 'c.generic', detail: `"${g}"` });

  // (d)
  for (const s of sample.sections) {
    const isTiming = s.label ? TIMING_LABELS.has(s.label) : TIMING_TITLE.test(s.title);
    if (isTiming && !/20\d\d년|\d{2}세|\d{2}대/.test(s.body)) out.push({ file: sample.file, level: 'warn', rule: 'd.연도없음', detail: `"${s.label ?? s.title}" 에 연도·나이 없음` });
  }
  return out;
}

function main(): void {
  const samples = loadSamples();
  if (samples.length === 0) { console.log('샘플 없음 — scripts/qa-samples/*.json 을 먼저 모아라 (npm run qa:collect)'); process.exit(0); }
  const findings: Finding[] = [];
  for (const s of samples) { try { findings.push(...check(s)); } catch (e) { findings.push({ file: s.file, level: 'fail', rule: 'x.검사불가', detail: e instanceof Error ? e.message : String(e) }); } }

  // (e) 몰개성 — 같은 타입끼리
  const byType = new Map<string, Sample[]>();
  for (const s of samples) byType.set(s.type, [...(byType.get(s.type) ?? []), s]);
  for (const [type, list] of byType) {
    const vecs = list.map(s => bigrams(s.sections.map(x => x.body).join(' ')));
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const c = cosine(vecs[i], vecs[j]);
      if (c > 0.55) findings.push({ file: `${list[i].file} ~ ${list[j].file}`, level: 'warn', rule: 'e.몰개성', detail: `${type} 유사도 ${c.toFixed(2)}` });
    }
  }

  const fails = findings.filter(f => f.level === 'fail'), warns = findings.filter(f => f.level === 'warn');
  console.log(`샘플 ${samples.length}건 · fail ${fails.length} · warn ${warns.length}\n`);
  for (const f of findings) console.log(`[${f.level}] ${f.rule}  ${f.file}  ${f.detail}`);
  process.exit(fails.length === 0 && warns.length <= 5 ? 0 : 1);
}

main();
