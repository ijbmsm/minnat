-- 게시판 테이블
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS board_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기
CREATE POLICY "public_read_posts" ON board_posts FOR SELECT USING (true);

-- 누구나 작성
CREATE POLICY "anyone_can_post" ON board_posts FOR INSERT WITH CHECK (true);

-- 누구나 업데이트 (비밀번호 검증은 API에서)
CREATE POLICY "anyone_can_update_posts" ON board_posts FOR UPDATE USING (true);

-- 누구나 삭제 (비밀번호 검증은 API에서)
CREATE POLICY "anyone_can_delete_posts" ON board_posts FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_board_posts_created ON board_posts(created_at DESC);
