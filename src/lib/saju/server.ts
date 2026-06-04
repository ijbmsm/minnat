/**
 * 서버 전용 — seolgi.json 로드 + SeolgiIndex 빌드.
 * Next.js 서버 컴포넌트 / Route Handler에서만 import.
 * 모듈 캐시에 인덱스를 유지하므로 프로세스당 1회만 파일을 읽는다.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildSeolgiIndex, type SeolgiIndex, type SeolgiRow } from './seolgi-loader';
import { computeFourPillars, fromKST, type FourPillars } from './engine';

let _index: SeolgiIndex | null = null;

export function getSeolgiIndex(): SeolgiIndex {
  if (_index) return _index;
  const filePath = join(process.cwd(), 'public', 'seolgi.json');
  const rows: SeolgiRow[] = JSON.parse(readFileSync(filePath, 'utf-8'));
  _index = buildSeolgiIndex(rows);
  return _index;
}

/** 서버에서 사주 계산. KST 생년월일시분 + 성별 → FourPillars */
export function calcSajuServer(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  sex: 'male' | 'female',
  longitudeE = 127.0,
  minute = 0,
): FourPillars {
  const index = getSeolgiIndex();
  const birth = fromKST(year, month, day, hour, minute, longitudeE);
  return computeFourPillars(index, birth, sex);
}
