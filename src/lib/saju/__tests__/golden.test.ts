/**
 * 사주 엔진 골든 테스트셋
 *
 * 목적: ad-hoc 리뷰로 두더지 잡기 대신 CI가 자동으로 회귀를 잡도록.
 * 케이스 출처: KASI 만세력, 이석영 사주첩경 예제, 직접 계산 검증.
 *
 * 케이스 추가 규칙:
 *  1. 출처 / 계산 근거 주석 필수
 *  2. 경계 케이스 포함 (절기 전후, 자시경계, KST 00:xx, UTC 날짜 롤오버)
 *  3. 결과 변경 시 반드시 출처 재확인 후 수정
 *
 * 주의: 서울(127°E)의 진태양시는 KST보다 약 508min(longitude) + EOT(≈-16~+14) 보정.
 *       "23:00 KST"가 진태양시로 22:XX 亥時가 될 수 있으므로 시주는 KST ≠ 진태양시.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import {
  buildSeolgiIndex, latestJieBefore, prevJieBefore, nextJieAfter,
  type SeolgiRow,
} from '../seolgi-loader';
import { computeFourPillars, fromKST } from '../engine';
import { equationOfTimeMinutes } from '../eot';
import type { FourPillars } from '../engine';

// ── 절기 인덱스 로드 ──
function loadIndex() {
  const filePath = join(process.cwd(), 'public', 'seolgi.json');
  const rows: SeolgiRow[] = JSON.parse(readFileSync(filePath, 'utf-8'));
  return buildSeolgiIndex(rows);
}
const INDEX = loadIndex();

function calc(
  year: number, month: number, day: number,
  hour: number | null, sex: 'male' | 'female',
  opts: { minute?: number; longitude?: number; rule?: 'midnight' | 'zi_hour' } = {},
): FourPillars {
  const birth = fromKST(
    year, month, day, hour,
    opts.minute ?? 0,
    opts.longitude ?? 127.0,
    opts.rule ?? 'midnight',
  );
  return computeFourPillars(INDEX, birth, sex);
}

// ────────────────────────────────────────────────────────
describe('사주 4주 — 핵심 케이스', () => {

  it('1999-04-04 05:00 KST 수원(127°E) 남 — fromKST UTC날짜 버그 수정 후 검증', () => {
    // 계산 근거:
    //   UTC = 1999-04-03 20:00
    //   doy(UTC Apr 3) = 93
    //   apparentMin = 1200 + 508 + eot(93) ≈ 1200 + 508 - 1.9 ≈ 1706 > 1440 → dayOffset=+1
    //   solarDate = UTC(Apr 3) + 1 = Apr 4 → gz=(JDN(Apr 4)+59)%60 = 32 → 丙申
    //   (32%12=8=申=신, 32%10=2=丙=병)
    //   dayStemIdx=2(丙) → RAT_HOUR[2%5]=RAT_HOUR[2]=4(戊) → 戊子起
    //   solarTime ≈ 04:24 → 寅時(03~05) branch=2 → stem=(4+2)%10=6(庚) → 庚寅
    const fp = calc(1999, 4, 4, 5, 'male', { longitude: 127.0 });
    expect(fp.year.stem).toBe('기');
    expect(fp.year.branch).toBe('묘');
    expect(fp.month.stem).toBe('정');
    expect(fp.month.branch).toBe('묘');
    expect(fp.day.stem).toBe('병');
    expect(fp.day.branch).toBe('신');
    expect(fp.hour?.stem).toBe('경');
    expect(fp.hour?.branch).toBe('인');
  });

  it('2024-01-01 기준점 — 甲戌日 (DAY_PILLAR_OFFSET=59 검증)', () => {
    // 근거: engine.ts 주석 "2024-01-01 = 甲戌(gz=10), KASI 교차검증"
    const fp = calc(2024, 1, 1, 12, 'male');
    expect(fp.day.stem).toBe('갑');
    expect(fp.day.branch).toBe('술');
    expect(fp.day.gz).toBe(10);
  });

  it('60년 주기 — 1924·1984·2044 모두 甲子年', () => {
    // 甲子 = gz=0. 1924년: mod(1924-4,60)=0. 중심 날짜 이용.
    for (const y of [1924, 1984, 2044]) {
      const fp = calc(y, 7, 1, 12, 'male');
      expect(fp.year.stem).toBe('갑');
      expect(fp.year.branch).toBe('자');
    }
  });

  it('KST 00:xx 출생 (UTC 전날) — 일주 날짜 롤오버 검증', () => {
    // 2000-03-05 01:00 KST = 2000-03-04 16:00 UTC
    // doy(UTC Mar 4) = 64. eot(64) ≈ +11.4min
    // apparentMin = 960 + 508 + 11.4 = 1479 → dayOffset=+1 → solarDate = UTC(Mar 4)+1 = Mar 5
    // JDN(2000-03-05)+59 = ? : 이 계산은 KST 날짜(Mar 5) 기준 = UTC 날짜(Mar 4)+1 = Mar 5 → 일치
    // 이전 버그: kstDay(5)+1 = Mar 6 → 틀렸음. 수정 후: utcDay(4)+1 = Mar 5 → 맞음.
    // JDN(2000-03-05) = 2451605+64 = 2451669-ish... 직접 계산 생략, 일간만 확인
    const fp = calc(2000, 3, 5, 1, 'male');
    // 수정 전이면 Mar 6 일주, 수정 후면 Mar 5 일주
    // Mar 5: JDN(2000-01-01)=2451545+64=2451609, (2451609+59)%60 = 2451668%60
    // 2451668/60 = 40861.13... 40861*60=2451660, 나머지=8 → gz=8 → 壬(임)申(신)
    expect(fp.day.stem).toBe('임');
    expect(fp.day.branch).toBe('신');
  });

});

// ────────────────────────────────────────────────────────
describe('연주 — 입춘 경계', () => {

  it('2024-02-04 입춘 이전 → 癸卯年', () => {
    // 2024 입춘 = 2024-02-04 17:26 KST. 12:00 KST(UTC 03:00) < 입춘(UTC 08:26) → 2023년사주
    const fp = calc(2024, 2, 4, 12, 'male');
    expect(fp.year.stem).toBe('계');
    expect(fp.year.branch).toBe('묘');
  });

  it('2024-02-04 입춘 이후 → 甲辰年', () => {
    // 18:00 KST(UTC 09:00) > 입춘(UTC 08:26) → 2024년사주
    const fp = calc(2024, 2, 4, 18, 'male');
    expect(fp.year.stem).toBe('갑');
    expect(fp.year.branch).toBe('진');
  });

});

// ────────────────────────────────────────────────────────
describe('월주 — 절기 경계', () => {

  it('2024-04-04 청명 이전 → 卯月', () => {
    // 2024 청명 ≈ 2024-04-04 17:02 KST. 12:00 KST < 청명 → 卯月
    const fp = calc(2024, 4, 4, 12, 'male');
    expect(fp.month.branch).toBe('묘');
  });

  it('2024-04-04 청명 이후 → 辰月', () => {
    // 18:00 KST > 청명(17:02) → 辰月
    const fp = calc(2024, 4, 4, 18, 'male');
    expect(fp.month.branch).toBe('진');
  });

  it('오호둔 — 甲年(0) 寅月 → 丙 월간', () => {
    // 1974 = 甲寅년 (mod(1974-4,60)=50, stem=0甲 ✓)
    // 경칩(1974년 ≈ 3월 6일) 이전, 입춘 이후 → 寅月
    // TIGER[0%5]=2(丙), monthOrder=(2-2)%12=0, stem=(2+0)%10=2 → 丙
    const fp = calc(1974, 2, 20, 12, 'male');
    expect(fp.month.stem).toBe('병');
    expect(fp.month.branch).toBe('인');
  });

  it('오호둔 — 乙年(1) 寅月 → 戊 월간', () => {
    // 1975 = 乙卯년, TIGER[1%5]=4(戊)
    const fp = calc(1975, 2, 20, 12, 'male');
    expect(fp.month.stem).toBe('무');
    expect(fp.month.branch).toBe('인');
  });

});

// ────────────────────────────────────────────────────────
describe('시주 — 진태양시 경계', () => {

  it('오서둔 — 甲日 子時(진태양시) → 甲子 시주', () => {
    // 2024-01-01 = 甲戌日 (dayStemIdx=0, 甲).
    // 23:45 KST → UTC 14:45 → apparentMin = 885+508+eot(1) ≈ 885+508-3.7 = 1389.3
    // → solarTime.hour=23, dayOffset=0, solarDate=Jan 1 → branch=子(0)
    // RAT[0%5]=0(甲), stem=(0+0)%10=0 → 甲子
    const fp = calc(2024, 1, 1, 23, 'male', { minute: 45 });
    expect(fp.hour?.stem).toBe('갑');
    expect(fp.hour?.branch).toBe('자');
  });

  it('시지 — 午時 중간(KST 12:00, 진태양시 ~12:30) → branch=6(午)', () => {
    // KST 12:00 → UTC 03:00 → apparentMin = 180+508+eot ≈ 680-700 → hour=11 → 午時(branch=6)
    // floor((680+60)/120)%12 = floor(6.17)%12 = 6 → 午 ✓
    const fp = calc(2024, 6, 1, 12, 'male');
    expect(fp.hour?.branch).toBe('오');
  });

  it('시간 미상(null) → 시주 null', () => {
    const fp = calc(1999, 4, 4, null, 'male');
    expect(fp.hour).toBeNull();
  });

});

// ────────────────────────────────────────────────────────
describe('zi_hour 야자시/조자시', () => {

  it('야자시 — 진태양시 23시대 → zi_hour 모드에서 일주 +1 roll', () => {
    // 2023-01-15 23:50 KST → UTC 14:50 → apparentMin = 890+508+eot(15) ≈ 1389 → hour=23
    // dayOffset=0, solarDate=Jan 15.
    // midnight.day = 癸未(gz=19 기대), zi_hour.day = 甲申(gz=20)
    const midnight = calc(2023, 1, 15, 23, 'male', { minute: 50, rule: 'midnight' });
    const ziHour   = calc(2023, 1, 15, 23, 'male', { minute: 50, rule: 'zi_hour' });
    expect(ziHour.day.gz).toBe((midnight.day.gz + 1) % 60);
    expect(ziHour.trace.dayRolled).toBe(true);
  });

  it('조자시 — 진태양시 00시대 → zi_hour 모드에서 roll 없음', () => {
    // 2023-01-16 01:15 KST → UTC 16:15 → apparentMin = 975+508+eot(16) ≈ 1474 → dayOffset+1
    // solarDate=Jan 17, solarTime.hour=0 → zi_hour 조건(>=23) 미충족 → no extra roll
    const midnight = calc(2023, 1, 16, 1, 'male', { minute: 15, rule: 'midnight' });
    const ziHour   = calc(2023, 1, 16, 1, 'male', { minute: 15, rule: 'zi_hour' });
    expect(ziHour.day.gz).toBe(midnight.day.gz);
    expect(ziHour.trace.dayRolled).toBe(false);
  });

});

// ────────────────────────────────────────────────────────
describe('대운 계산', () => {

  it('양년 남성 → 순행 대운 (월주 +1 순행)', () => {
    // 甲년(양) 남 → 순행
    const fp = calc(1974, 5, 15, 12, 'male');
    const STEMS   = ['갑','을','병','정','무','기','경','신','임','계'];
    const BRANCHES = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
    const ms = STEMS.indexOf(fp.month.stem);
    const mb = BRANCHES.indexOf(fp.month.branch);
    expect(fp.daeun[0].pillar.stem).toBe(STEMS[(ms + 1) % 10]);
    expect(fp.daeun[0].pillar.branch).toBe(BRANCHES[(mb + 1) % 12]);
    expect(fp.daeun[1].pillar.stem).toBe(STEMS[(ms + 2) % 10]);
  });

  it('음년 남성 → 역행 대운 (월주 -1 역행)', () => {
    // 乙년(음) 남 → 역행
    const fp = calc(1975, 5, 15, 12, 'male');
    const STEMS   = ['갑','을','병','정','무','기','경','신','임','계'];
    const BRANCHES = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
    const ms = STEMS.indexOf(fp.month.stem);
    const mb = BRANCHES.indexOf(fp.month.branch);
    expect(fp.daeun[0].pillar.stem).toBe(STEMS[((ms - 1) % 10 + 10) % 10]);
    expect(fp.daeun[0].pillar.branch).toBe(BRANCHES[((mb - 1) % 12 + 12) % 12]);
  });

  it('startDisplayYear ≤ startAge, startMonths ∈ [0,11]', () => {
    const fp = calc(1999, 4, 4, 5, 'male', { longitude: 127.0 });
    const d = fp.daeun[0];
    expect(d.startDisplayYear).toBeLessThanOrEqual(d.startAge);
    expect(d.startMonths).toBeGreaterThanOrEqual(0);
    expect(d.startMonths).toBeLessThanOrEqual(11);
  });

  it('2~8 대운은 startMonths=0 (정확한 10년 간격)', () => {
    const fp = calc(1999, 4, 4, 5, 'male');
    for (let i = 1; i < fp.daeun.length; i++) {
      expect(fp.daeun[i].startMonths).toBe(0);
    }
  });

});

// ────────────────────────────────────────────────────────
describe('seolgi-loader — 이진 탐색 정확성', () => {

  it('prevJieBefore < birthUTC < nextJieAfter (삼중 관계)', () => {
    const testDate = new Date('1999-04-04T20:00:00Z');
    const prev = prevJieBefore(INDEX, testDate);
    const next = nextJieAfter(INDEX, testDate);
    expect(new Date(prev.instant_utc).getTime()).toBeLessThan(testDate.getTime());
    expect(new Date(next.instant_utc).getTime()).toBeGreaterThan(testDate.getTime());
  });

  it('prevJieBefore — 2020년 전체 절기 사이 중간값 전수 검증', () => {
    // 버그 수정 전: 경로 추적형 second가 절기를 건너뛸 수 있었음
    // 수정 후: bestIdx 직접 탐색 → 모든 절기 구간에서 prevJieBefore = latestJieBefore
    const jies2020 = INDEX.jie.filter(r => r.instant_utc.startsWith('2020'));
    for (let i = 1; i < jies2020.length; i++) {
      const t1 = new Date(jies2020[i - 1].instant_utc).getTime();
      const t2 = new Date(jies2020[i].instant_utc).getTime();
      const mid = new Date(t1 + (t2 - t1) / 2);
      const prev   = prevJieBefore(INDEX, mid);
      const latest = latestJieBefore(INDEX, mid);
      // 두 절기 사이 중간점: prevJieBefore와 latestJieBefore 동일해야 함
      expect(prev.instant_utc).toBe(latest.instant_utc);
    }
  });

  it('nextJieAfter > latestJieBefore (연속 절기 순서 불변)', () => {
    const dates = [
      '1990-01-01T00:00:00Z', '2000-06-15T12:00:00Z',
      '2024-02-04T00:00:00Z', '2100-01-01T00:00:00Z',
    ];
    for (const ds of dates) {
      const d = new Date(ds);
      const latest = latestJieBefore(INDEX, d);
      const next   = nextJieAfter(INDEX, d);
      expect(new Date(latest.instant_utc).getTime())
        .toBeLessThan(new Date(next.instant_utc).getTime());
    }
  });

});

// ────────────────────────────────────────────────────────
describe('EOT (균시차) 수치 범위', () => {

  it('연중 균시차 -17 ~ +17분 이내 (Spencer 근사 실제 범위)', () => {
    // Spencer 공식 실제 범위: 약 -16.4 ~ +14.3분
    for (let doy = 1; doy <= 365; doy++) {
      const eot = equationOfTimeMinutes(doy);
      expect(eot).toBeGreaterThan(-17);
      expect(eot).toBeLessThan(17);
    }
  });

  it('극점 — doy=43 근처(약 -14.6min)와 doy=306 근처(약 +16.4min)', () => {
    // Spencer 공식: 최대 음수 ≈ doy=43(2월 중순), 최대 양수 ≈ doy=306(11월 초)
    const earlyMin = equationOfTimeMinutes(43);   // ≈ -14.6
    const lateMax  = equationOfTimeMinutes(306);  // ≈ +16.4
    expect(earlyMin).toBeLessThan(-10);
    expect(lateMax).toBeGreaterThan(10);
  });

  it('춘분(doy=81)에서 cos항 주도 — EOT ≈ -7.5min', () => {
    // B=0일 때: 9.87*sin(0) - 7.53*cos(0) - 1.5*sin(0) = -7.53
    const eot = equationOfTimeMinutes(81);
    expect(eot).toBeCloseTo(-7.53, 0); // 소수점 0자리까지 (±0.5min)
  });

});
