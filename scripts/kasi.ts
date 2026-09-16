/**
 * 한국천문연구원 API 클라이언트 (공공데이터포털). 스크립트 전용.
 *  - 음양력: LrsrCldInfoService/getLunCalInfo (solYear+solMonth → 그 달 전체, lunIljin 일진 포함)
 *  - 24절기: SpcdeInfoService/get24DivisionsInfo (solYear+solMonth → 절기명·날짜·KST 시각)
 * 응답은 scripts/.cache/kasi/ 에 캐시해 재실행 시 API 를 다시 부르지 않는다.
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = 'http://apis.data.go.kr/B090041/openapi/service';
const CACHE_DIR = join(process.cwd(), 'scripts', '.cache', 'kasi');

export function apiKey(): string {
  const k = process.env.DATA_GO_KR_API_KEY;
  if (!k) throw new Error('DATA_GO_KR_API_KEY 미설정 — .env.local 또는 환경변수에 넣어라 (공공데이터포털 인증키)');
  return k;
}

export interface LunCalItem {
  solYear: string; solMonth: string; solDay: string;
  lunYear: string; lunMonth: string; lunDay: string;
  lunLeapmonth: '평' | '윤';
  lunIljin: string;   // "병술(丙戌)"
  lunSecha: string;   // 연주
  lunWolgeon: string; // 월건
  solJd: string;
}

export interface DivisionItem {
  dateName: string;   // "입춘"
  locdate: string;    // "20240204"
  kst: string;        // "1727"
  sunLon: string;
}

interface Envelope<T> {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: { items?: { item?: T | T[] } | ''; totalCount?: number | string };
  };
}

function cachePath(kind: string, year: number, month: number): string {
  mkdirSync(join(CACHE_DIR, kind), { recursive: true });
  return join(CACHE_DIR, kind, `${year}-${String(month).padStart(2, '0')}.json`);
}

async function fetchJson<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`KASI HTTP ${res.status} ${url}`);
  const text = await res.text();
  let data: Envelope<T>;
  try { data = JSON.parse(text) as Envelope<T>; }
  catch { throw new Error(`KASI 응답이 JSON 이 아님 (키 오류일 수 있음): ${text.slice(0, 200)}`); }
  const code = data.response?.header?.resultCode;
  if (code && code !== '00') throw new Error(`KASI resultCode=${code} ${data.response?.header?.resultMsg ?? ''}`);
  const items = data.response?.body?.items;
  if (!items || typeof items === 'string') return [];
  const item = items.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

export async function getLunCalMonth(year: number, month: number): Promise<LunCalItem[]> {
  const cp = cachePath('luncal', year, month);
  if (existsSync(cp)) return JSON.parse(readFileSync(cp, 'utf-8')) as LunCalItem[];
  const url = `${BASE}/LrsrCldInfoService/getLunCalInfo?serviceKey=${encodeURIComponent(apiKey())}&solYear=${year}&solMonth=${String(month).padStart(2, '0')}&numOfRows=31&_type=json`;
  const items = await fetchJson<LunCalItem>(url);
  writeFileSync(cp, JSON.stringify(items));
  return items;
}

export async function get24Divisions(year: number, month: number): Promise<DivisionItem[]> {
  const cp = cachePath('divisions', year, month);
  if (existsSync(cp)) return JSON.parse(readFileSync(cp, 'utf-8')) as DivisionItem[];
  const url = `${BASE}/SpcdeInfoService/get24DivisionsInfo?serviceKey=${encodeURIComponent(apiKey())}&solYear=${year}&solMonth=${String(month).padStart(2, '0')}&numOfRows=10&_type=json`;
  const items = await fetchJson<DivisionItem>(url);
  writeFileSync(cp, JSON.stringify(items));
  return items;
}

/** "병술(丙戌)" → "병술" */
export function koreanGz(s: string): string {
  return s.replace(/\(.*\)$/, '').trim();
}

export function loadEnvLocal(): void {
  // .env.local 을 최소한으로 읽는다 (dotenv 의존 없이)
  const p = join(process.cwd(), '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf-8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export function parseRange(argv: string[], defFrom: number, defTo: number): { from: number; to: number } {
  const from = Number(argv.find(a => a.startsWith('--from='))?.slice(7) ?? defFrom);
  const to   = Number(argv.find(a => a.startsWith('--to='))?.slice(5) ?? defTo);
  return { from, to };
}
