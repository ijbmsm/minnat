/**
 * QA 샘플 수집 — 프롬프트 빌더 + LLM 을 직접 호출해 scripts/qa-samples/ 에 저장.
 *   npx tsx scripts/collect-qa-samples.ts            # 4타입 × 10차트 = 40건 (Anthropic 크레딧 필요)
 *   npx tsx scripts/collect-qa-samples.ts --types=full,love --n=3
 * 각 파일: { type, birth, sections }. saju-qa.ts 가 읽는다.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { calcSajuServer } from '../src/lib/saju/server';
import { buildFactSheet } from '../src/lib/saju/factsheet';
import { buildPrompt, TOKEN_BUDGET, type ReadingType } from '../src/lib/saju/prompt';
import { callSajuLLM } from '../src/lib/saju/llm';
import { loadEnvLocal } from './kasi';

loadEnvLocal();

// 다양성 있게 고른 10차트 (신강·신약·시간미상·경계·서머타임 포함)
const CHARTS: { year: number; month: number; day: number; hour: number | null; sex: 'male' | 'female' }[] = [
  { year: 1999, month: 4,  day: 4,  hour: 5,    sex: 'male' },
  { year: 1987, month: 7,  day: 15, hour: 0,    sex: 'female' },   // 서머타임
  { year: 1992, month: 2,  day: 4,  hour: 22,   sex: 'female' },   // 입춘 경계
  { year: 2001, month: 12, day: 25, hour: null, sex: 'male' },     // 시간 미상
  { year: 1978, month: 8,  day: 30, hour: 14,   sex: 'male' },
  { year: 1995, month: 11, day: 11, hour: 9,    sex: 'female' },
  { year: 1985, month: 5,  day: 1,  hour: 23,   sex: 'male' },     // 야자시
  { year: 2003, month: 3,  day: 21, hour: 12,   sex: 'female' },
  { year: 1969, month: 10, day: 9,  hour: 3,    sex: 'female' },
  { year: 1990, month: 6,  day: 18, hour: 18,   sex: 'male' },
];

function parseSections(raw: string): { title: string; body: string }[] {
  let cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim();
  const start = cleaned.indexOf('['); if (start >= 0) cleaned = cleaned.slice(start);
  const parsed = JSON.parse(cleaned) as Array<{ title?: string | number | null; body?: string | number | null }>;
  return parsed.map(s => ({ title: String(s.title ?? ''), body: String(s.body ?? '') }));
}

async function main(): Promise<void> {
  const typesArg = process.argv.find(a => a.startsWith('--types='))?.slice(8);
  const types = (typesArg ? typesArg.split(',') : ['full', 'today', 'love', 'career']) as ReadingType[];
  const n = Number(process.argv.find(a => a.startsWith('--n='))?.slice(4) ?? CHARTS.length);
  const outDir = join(process.cwd(), 'scripts', 'qa-samples');
  mkdirSync(outDir, { recursive: true });

  for (const type of types) {
    for (const c of CHARTS.slice(0, n)) {
      const fp = calcSajuServer(c.year, c.month, c.day, c.hour, c.sex, 127.0, 0, 'midnight');
      const fs = buildFactSheet(fp, 'free', type);
      const { system, user } = buildPrompt(fs, { tier: 'free', type, sex: c.sex });
      const { text } = await callSajuLLM({ label: `qa:${type}`, system, user, maxTokens: Math.round(TOKEN_BUDGET[type].free * 1.3) });
      const sections = parseSections(text);
      const name = `${type}-${c.year}${String(c.month).padStart(2,'0')}${String(c.day).padStart(2,'0')}-${c.hour ?? 'x'}-${c.sex}.json`;
      writeFileSync(join(outDir, name), JSON.stringify({ type, birth: { ...c, minute: 0, longitudeE: 127.0 }, sections }, null, 2));
      console.log('saved', name);
    }
  }
}

main().catch(err => { console.error(err instanceof Error ? err.message : err); process.exit(2); });
