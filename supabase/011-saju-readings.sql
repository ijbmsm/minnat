-- saju_readings: 회원별 사주 열람 기록
-- cache_key 는 Redis 키와 동일 (deterministic) — 동일 차트 재조회 시 upsert

CREATE TABLE IF NOT EXISTS saju_readings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 사주 종류
  type            TEXT NOT NULL CHECK (type IN ('full', 'today', 'love', 'career')),

  -- 출생 정보 (재조회 시 폼 복원용)
  birth_year      SMALLINT NOT NULL,
  birth_month     SMALLINT NOT NULL,
  birth_day       SMALLINT NOT NULL,
  birth_hour      SMALLINT,                          -- NULL = 시간 모름
  birth_minute    SMALLINT NOT NULL DEFAULT 0,       -- 분 (0~59)
  birth_sex       TEXT NOT NULL CHECK (birth_sex IN ('male', 'female')),
  birth_longitude REAL NOT NULL DEFAULT 127.0,
  birth_name      TEXT,
  concern         TEXT,

  -- 결과 캐시
  cache_key       TEXT NOT NULL,                     -- Redis 키와 동일

  -- 일간 (표시용)
  day_stem        TEXT,
  day_element     TEXT,

  -- 타임스탬프
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 동일 사용자 + 동일 캐시키 → upsert 기준
CREATE UNIQUE INDEX IF NOT EXISTS saju_readings_user_cache
  ON saju_readings (user_id, cache_key);

-- 최근 열람 순 조회
CREATE INDEX IF NOT EXISTS saju_readings_user_viewed
  ON saju_readings (user_id, last_viewed_at DESC);

ALTER TABLE saju_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saju_readings_own" ON saju_readings
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
