-- ============================================================
-- 012: user_profiles에 출생 정보 컬럼 추가
-- 마이페이지 - 폼 자동 입력을 위해 사용자별 출생 정보 저장
-- Supabase SQL Editor에서 실행
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS birth_year     SMALLINT,
  ADD COLUMN IF NOT EXISTS birth_month    SMALLINT,
  ADD COLUMN IF NOT EXISTS birth_day      SMALLINT,
  ADD COLUMN IF NOT EXISTS birth_hour     SMALLINT,   -- NULL = 시간 미상
  ADD COLUMN IF NOT EXISTS birth_minute   SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS birth_sex      TEXT CHECK (birth_sex IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS birth_name     TEXT,
  ADD COLUMN IF NOT EXISTS birth_longitude REAL DEFAULT 127.0;
