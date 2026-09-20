-- 025. score_snapshots 를 v1.1 점수 체계에 맞춘다
--
-- schema.sql(v1.0) 은 blue_negative / blue_positive / blue_net 구조였는데,
-- v1.1 로 넘어오면서 크롤러(scorer.py)와 앱(types/index.ts ScoreSnapshot)은
-- blue_score / blue_count 를 쓰게 바뀌었다. 그런데 테이블은 그대로였다.
--
-- 결과: 크롤러가 매 실행 끝에 스냅샷을 저장하려다 PGRST204
-- ("Could not find the 'blue_count' column")로 죽었고, score_snapshots 는
-- **행이 0개**다. 일별 추이가 한 번도 쌓이지 않았다.
--
-- 기존 컬럼은 지우지 않는다. 과거 데이터가 없어 지울 이유도 없고,
-- 되돌릴 일이 생겼을 때 구조가 남아 있는 편이 안전하다.

ALTER TABLE score_snapshots ADD COLUMN IF NOT EXISTS blue_score NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE score_snapshots ADD COLUMN IF NOT EXISTS red_score  NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE score_snapshots ADD COLUMN IF NOT EXISTS blue_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE score_snapshots ADD COLUMN IF NOT EXISTS red_count  INTEGER NOT NULL DEFAULT 0;

-- v1.0 컬럼들은 이제 크롤러가 채우지 않는다. NOT NULL DEFAULT 가 걸려 있어
-- upsert 가 실패하지는 않지만, 의미가 없어졌다는 표시를 남겨 둔다.
COMMENT ON COLUMN score_snapshots.blue_negative IS 'v1.0 잔존 컬럼 — v1.1 이후 사용하지 않음';
COMMENT ON COLUMN score_snapshots.blue_positive IS 'v1.0 잔존 컬럼 — v1.1 이후 사용하지 않음';
COMMENT ON COLUMN score_snapshots.red_negative  IS 'v1.0 잔존 컬럼 — v1.1 이후 사용하지 않음';
COMMENT ON COLUMN score_snapshots.red_positive  IS 'v1.0 잔존 컬럼 — v1.1 이후 사용하지 않음';
COMMENT ON COLUMN score_snapshots.blue_net      IS 'v1.0 잔존 컬럼 — v1.1 이후 사용하지 않음';
COMMENT ON COLUMN score_snapshots.red_net       IS 'v1.0 잔존 컬럼 — v1.1 이후 사용하지 않음';
