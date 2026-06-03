#!/usr/bin/env python3
"""절입(節入) 시각 사전계산 배치.

Skyfield + JPL DE440s ephemeris로 24절기의 정확한 순간을 산출해
JSON 테이블로 박제한다. 런타임 엔진은 이 테이블을 구간 lookup으로만
사용하므로 요청 경로에 천문 계산이 0번 들어간다.

사용:
    python3 solar_terms_batch.py --start 1880 --end 2100 \
        --out ../public/seolgi.json
"""
from __future__ import annotations

import argparse
import json
import logging
from dataclasses import asdict, dataclass
from pathlib import Path
from zoneinfo import ZoneInfo

from skyfield import almanac
from skyfield import almanac_east_asia as aea
from skyfield.api import load

KST = ZoneInfo("Asia/Seoul")
log = logging.getLogger("solar_terms")

# almanac_east_asia 인덱스: 春分=0, 입춘=21, 경칩=23, 청명=1, ...
SOLAR_TERMS_KO: tuple[str, ...] = (
    "춘분", "청명", "곡우", "입하", "소만", "망종",
    "하지", "소서", "대서", "입추", "처서", "백로",
    "추분", "한로", "상강", "입동", "소설", "대설",
    "동지", "소한", "대한", "입춘", "우수", "경칩",
)

# 節(홀수 index) → 月支 index (子=0, 丑=1, 寅=2, ...)
JIEQI_TO_BRANCH: dict[int, int] = {
    21: 2, 23: 3, 1: 4, 3: 5, 5: 6, 7: 7,
    9: 8, 11: 9, 13: 10, 15: 11, 17: 0, 19: 1,
}


@dataclass(frozen=True, slots=True)
class SolarTermEvent:
    term_index: int           # 0..23 (春分=0)
    name_ko: str
    name_zh: str
    longitude_deg: int        # 태양 겉보기 황경 (15°배수)
    instant_utc: str          # ISO8601 UTC (Z suffix)
    instant_kst: str          # ISO8601 +09:00 (디버깅용)
    is_month_boundary: bool   # 節 여부 (월주 경계)
    month_branch: int | None  # 節이면 月支 index, 中氣면 None
    boundary_caution: bool    # KST 자정 ±threshold 이내 → 공식력 교차검증 권장


def compute_terms(
    start_year: int,
    end_year: int,
    eph_name: str = "de440s.bsp",
    caution_seconds: int = 180,
) -> list[SolarTermEvent]:
    log.info("ephemeris 로드: %s", eph_name)
    eph = load(eph_name)
    ts = load.timescale()
    solar_terms_fn = aea.solar_terms(eph)

    events: list[SolarTermEvent] = []
    for year in range(start_year, end_year + 1):
        t0 = ts.utc(year, 1, 1)
        t1 = ts.utc(year + 1, 1, 1)
        times, indices = almanac.find_discrete(t0, t1, solar_terms_fn)

        for t, raw_idx in zip(times, indices):
            idx = int(raw_idx)
            dt_utc = t.utc_datetime()
            dt_kst = dt_utc.astimezone(KST)

            secs = dt_kst.hour * 3600 + dt_kst.minute * 60 + dt_kst.second
            near_midnight = min(secs, 86_400 - secs) <= caution_seconds

            is_jie = (idx % 2 == 1)
            events.append(SolarTermEvent(
                term_index=idx,
                name_ko=SOLAR_TERMS_KO[idx],
                name_zh=aea.SOLAR_TERMS_ZHS[idx],
                longitude_deg=idx * 15,
                instant_utc=dt_utc.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
                instant_kst=dt_kst.replace(microsecond=0).isoformat(),
                is_month_boundary=is_jie,
                month_branch=JIEQI_TO_BRANCH.get(idx) if is_jie else None,
                boundary_caution=near_midnight,
            ))

        if year % 10 == 0:
            log.info("%d년 처리 중...", year)

    events.sort(key=lambda e: e.instant_utc)
    log.info("총 %d개 절기 산출 완료", len(events))
    return events


def write_json(events: list[SolarTermEvent], path: Path) -> None:
    rows = [asdict(e) for e in events]
    path.write_text(
        json.dumps(rows, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    size_kb = path.stat().st_size / 1024
    log.info("JSON 저장: %s (%.1f KB, %d행)", path, size_kb, len(rows))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=1880)
    parser.add_argument("--end", type=int, default=2100)
    parser.add_argument("--ephemeris", default="de440s.bsp")
    parser.add_argument("--out", type=Path, default=Path("../public/seolgi.json"))
    parser.add_argument("--caution-seconds", type=int, default=180)
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

    events = compute_terms(args.start, args.end, args.ephemeris, args.caution_seconds)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    write_json(events, args.out)

    cautions = sum(e.boundary_caution for e in events)
    log.info("경계 주의 케이스: %d개 (KASI 교차검증 권장)", cautions)


if __name__ == "__main__":
    main()
