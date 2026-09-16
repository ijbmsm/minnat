-- 016: 원국 스냅샷 + 공개 공유 컬럼 제한
-- 1) chart: 계산 당시의 FourPillars(연·월·일·시주, 대운, trace) 를 그대로 보관.
--    엔진이 바뀌어도 "내가 봤던 원국" 이 유지되고, 공개 공유가 출생정보 없이 렌더된다.
-- 2) engine_version: factsheet FACTSHEET_VERSION. 현재 엔진과 다르면 UI 가 배너를 띄운다.
-- 3) 공개 정책이 USING(true) 로 모든 컬럼을 anon 에 열고 있었다 → anon 은 안전 컬럼만.

ALTER TABLE saju_readings
  ADD COLUMN IF NOT EXISTS chart          JSONB,
  ADD COLUMN IF NOT EXISTS engine_version TEXT;

-- anon(공개 링크) 은 출생정보·고민을 볼 수 없다. 컬럼 단위 GRANT.
DROP POLICY IF EXISTS "saju_readings_public_select" ON saju_readings;
CREATE POLICY "saju_readings_public_select" ON saju_readings
  FOR SELECT TO anon
  USING (true);

REVOKE SELECT ON saju_readings FROM anon;
GRANT SELECT (id, type, chart, engine_version, ai_sections, day_stem, day_element, created_at)
  ON saju_readings TO anon;
