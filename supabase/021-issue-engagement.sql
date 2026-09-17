-- ==========================================================================
-- 021 — 이슈 라인 팔로우 + 이슈 댓글
--
-- 기사 상세 페이지(design_handoff_article_detail)의 팔로우/댓글 섹션용.
-- board_posts / board_likes (migration-007) 의 규약을 그대로 따른다:
--   · 읽기는 공개, 쓰기는 본인만 (RLS)
--   · 추천수는 트리거로 비정규화 컬럼에 반영
--   · 진영(camp)은 추정하지 않고 작성 시점의 자기 선택값을 복사해 저장
--
-- 멱등. SQL Editor 에 통째로 붙여넣어 실행할 수 있다.
-- ==========================================================================

-- ── 1. 이슈 라인 팔로우 ───────────────────────────────────────────────────
-- 팔로우 단위는 기사(issues)가 아니라 사건(issue_clusters) 이다.
-- 같은 사건의 다른 기사로 이동해도 팔로우 상태가 유지돼야 하기 때문.
CREATE TABLE IF NOT EXISTS issue_follows (
  user_id    UUID NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  event_id   UUID NOT NULL REFERENCES issue_clusters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_follows_event ON issue_follows(event_id);

ALTER TABLE issue_follows ENABLE ROW LEVEL SECURITY;

-- 팔로우는 "누가 무엇을 지켜보는지" 라 공개하지 않는다. 본인 것만 읽는다.
DROP POLICY IF EXISTS "follows_owner_read" ON issue_follows;
CREATE POLICY "follows_owner_read"   ON issue_follows FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "follows_owner_insert" ON issue_follows;
CREATE POLICY "follows_owner_insert" ON issue_follows FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "follows_owner_delete" ON issue_follows;
CREATE POLICY "follows_owner_delete" ON issue_follows FOR DELETE USING (auth.uid() = user_id);


-- ── 2. 이슈 댓글 ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS issue_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id   UUID NOT NULL REFERENCES issues(id)     ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 작성 시점의 자기 선택 진영. 추정하지 않는다 (board_posts.camp 와 같은 규약)
  camp       TEXT NOT NULL DEFAULT 'free' CHECK (camp IN ('blue', 'red', 'free')),
  body       TEXT NOT NULL CHECK (char_length(body) >= 2 AND char_length(body) <= 500),
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_issue_comments_issue   ON issue_comments(issue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_comments_popular ON issue_comments(issue_id, like_count DESC, created_at DESC);

ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- 삭제된 댓글은 목록에서 빠진다 (행은 남겨 신고·감사 추적이 가능하게)
DROP POLICY IF EXISTS "issue_comments_public_read" ON issue_comments;
CREATE POLICY "issue_comments_public_read" ON issue_comments FOR SELECT USING (deleted_at IS NULL);
DROP POLICY IF EXISTS "issue_comments_auth_insert" ON issue_comments;
CREATE POLICY "issue_comments_auth_insert" ON issue_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "issue_comments_owner_update" ON issue_comments;
CREATE POLICY "issue_comments_owner_update" ON issue_comments FOR UPDATE USING (auth.uid() = user_id);


-- ── 3. 댓글 공감 (1인 1공감) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS issue_comment_likes (
  user_id    UUID NOT NULL REFERENCES auth.users(id)      ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES issue_comments(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_comment_likes_comment ON issue_comment_likes(comment_id);

ALTER TABLE issue_comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "icl_public_read" ON issue_comment_likes;
CREATE POLICY "icl_public_read"   ON issue_comment_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "icl_owner_insert" ON issue_comment_likes;
CREATE POLICY "icl_owner_insert" ON issue_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "icl_owner_delete" ON issue_comment_likes;
CREATE POLICY "icl_owner_delete" ON issue_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- 공감수 비정규화 갱신
CREATE OR REPLACE FUNCTION update_issue_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE issue_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE issue_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_issue_comment_like_count ON issue_comment_likes;
CREATE TRIGGER trg_issue_comment_like_count
  AFTER INSERT OR DELETE ON issue_comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_issue_comment_like_count();


-- ── 4. 다음 분기점 (예정 일정) ────────────────────────────────────────────
-- 날짜가 확정된 예정 일정만 넣는다. 추측성 전망은 넣지 않는다.
-- 채우는 쪽은 크롤러(minnat-crawler). 값이 없으면 화면에서 노드가 나오지 않는다.
--   { "date": "2026-09-19", "title": "인사청문경과보고서 채택 시한",
--     "description": "시한을 넘기면 … / 철회되면 …", "source_url": "https://…" }
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS next_branch JSONB;

COMMENT ON COLUMN issue_clusters.next_branch IS
  '확정된 예정 일정 1건. {date, title, description, source_url}. 추측성 전망 금지.';
