-- 027. 사안(storyline) 자동 생성 저장소
--
-- 024/026 의 storyline_candidates(사람 승인 큐)를 폐기하고, 파일 원고
-- (src/content/stories/*.ts)도 폐기한다. 사안 전체를 크롤러가 만들고 갱신한다.
--
-- 왜 바꾸나:
--   승인 큐는 읽을 사람이 있어야 돌아간다. 없으면 큐만 쌓이고 기능이 멈춘다.
--   그리고 "원고는 사람이 써야 한다"는 기준 자체가 이 제품과 어긋났다 —
--   기사 본문(issues.summary)은 이미 Haiku 가 써서 그대로 화면에 나간다.
--   사안 원고만 다른 잣대를 댈 이유가 없다.
--
-- 안전장치는 사람이 아니라 규칙으로 둔다:
--   - 표현 검수(expression_filter)를 통과해야 저장된다
--   - 등급(확정/혐의/주장)은 LLM 이 아니라 criminal_stage·source_tier 에서 도출한다
--   - 인과 문장은 기사가 명시적으로 연결할 때만. 아니면 시간 연결어만 쓴다
--   - 틀린 편입은 막는 대신 내린다 (hidden)

-- ── 사안 ──
CREATE TABLE IF NOT EXISTS storylines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  blurb         TEXT,
  -- 30초 요약. 문단 배열
  lead          JSONB NOT NULL DEFAULT '[]',
  camp          TEXT CHECK (camp IN ('blue', 'red', 'both')),
  status        TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'closed')),
  status_label  TEXT,
  started_at    DATE,
  ended_at      DATE,
  -- 종결 사안의 결말 {label, description}
  outcome       JSONB,
  -- 핵심 숫자 [{value, label}]
  figures       JSONB NOT NULL DEFAULT '[]',
  -- 등장인물 [{name, role, chapter_ids}]
  people        JSONB NOT NULL DEFAULT '[]',
  -- 사안을 특정하는 고유명사. 발견 단계에서 LLM 이 뽑고 이후 매칭에 쓴다
  match_keywords JSONB NOT NULL DEFAULT '[]',
  -- 사안 대표 임베딩 (발견·병합 판정용)
  embedding     vector(1536),
  -- 마지막으로 원고를 다시 쓴 시각. 사건이 늘면 갱신된다
  authored_at   TIMESTAMPTZ,
  -- 사람이 내린 사안은 화면에서 뺀다
  hidden        BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 국면(장) ──
CREATE TABLE IF NOT EXISTS storyline_chapters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storyline_id  UUID NOT NULL REFERENCES storylines(id) ON DELETE CASCADE,
  -- 사안 안에서의 순서 (1부터)
  position      INTEGER NOT NULL,
  -- "2021.10", "2022 – 2023"
  when_label    TEXT,
  -- 문장형 제목. 목차만 훑어도 줄거리가 되어야 한다
  title         TEXT NOT NULL,
  body          TEXT,
  -- 다음 장으로 잇는 한 줄. 기사가 인과를 명시하지 않으면 시간 연결어만 쓴다
  link          TEXT,
  -- 기사가 인과를 명시했는가. false 면 link 는 시간 연결어다
  link_is_causal BOOLEAN NOT NULL DEFAULT false,
  grade         TEXT NOT NULL DEFAULT 'claim' CHECK (grade IN ('confirmed', 'alleged', 'claim')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (storyline_id, position)
);

-- ── 편입된 기사 ──
CREATE TABLE IF NOT EXISTS storyline_articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storyline_id  UUID NOT NULL REFERENCES storylines(id) ON DELETE CASCADE,
  chapter_id    UUID REFERENCES storyline_chapters(id) ON DELETE SET NULL,
  issue_id      UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  event_id      UUID REFERENCES issue_clusters(id) ON DELETE SET NULL,
  score         NUMERIC NOT NULL CHECK (score >= 0 AND score <= 1),
  stage         TEXT NOT NULL CHECK (stage IN ('rule', 'embedding', 'seed')),
  reason        TEXT,
  -- 잘못 붙은 걸 내리는 수단. 삭제하지 않는 이유는 UNIQUE 로 재편입을 막기 위해서다
  hidden        BOOLEAN NOT NULL DEFAULT false,
  hidden_reason TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (storyline_id, issue_id)
);

CREATE INDEX IF NOT EXISTS idx_storylines_visible ON storylines (hidden, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_storyline_chapters_order ON storyline_chapters (storyline_id, position);
CREATE INDEX IF NOT EXISTS idx_storyline_articles_ch ON storyline_articles (chapter_id) WHERE hidden = false;
CREATE INDEX IF NOT EXISTS idx_storyline_articles_story ON storyline_articles (storyline_id) WHERE hidden = false;

-- ── RLS ──
ALTER TABLE storylines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyline_chapters  ENABLE ROW LEVEL SECURITY;
ALTER TABLE storyline_articles  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_storylines"          ON storylines         FOR SELECT USING (true);
CREATE POLICY "public_read_storyline_chapters"  ON storyline_chapters FOR SELECT USING (true);
CREATE POLICY "public_read_storyline_articles"  ON storyline_articles FOR SELECT USING (true);

CREATE POLICY "service_write_storylines"         ON storylines         FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_storylines"        ON storylines         FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_delete_storylines"        ON storylines         FOR DELETE USING (auth.role() = 'service_role');
CREATE POLICY "service_write_storyline_chapters" ON storyline_chapters FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_storyline_chapters" ON storyline_chapters FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_delete_storyline_chapters" ON storyline_chapters FOR DELETE USING (auth.role() = 'service_role');
CREATE POLICY "service_write_storyline_articles" ON storyline_articles FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_storyline_articles" ON storyline_articles FOR UPDATE USING (auth.role() = 'service_role');

-- 승인 큐는 폐기한다
COMMENT ON TABLE storyline_candidates IS
  '폐기 (2026-09-19). 사람 승인 큐는 읽을 사람이 없으면 멈춘다. storylines/storyline_chapters/storyline_articles 로 대체';
