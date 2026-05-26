-- ============================================================
-- Phase 1-1: 인증 + 게시판 통합 마이그레이션
-- 기존 migration-006-board.sql 의 board_posts 를 교체
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 기존 board_posts 제거 (데이터 없으므로 안전)
DROP TABLE IF EXISTS board_posts CASCADE;

-- ── 1. 유저 프로필 (Supabase Auth 확장) ──
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kakao_nickname TEXT,
  profile_image TEXT,
  display_camp TEXT DEFAULT 'free' CHECK (display_camp IN ('blue', 'red', 'free')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. 게시글 ──
CREATE TABLE board_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camp TEXT NOT NULL CHECK (camp IN ('blue', 'red', 'free')),
  title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 100),
  content TEXT NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 5000),
  like_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. 추천 (1인 1추천) ──
CREATE TABLE board_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- ── 4. 인덱스 ──
CREATE INDEX IF NOT EXISTS idx_board_posts_created ON board_posts(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_board_posts_camp ON board_posts(camp, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_posts_popular ON board_posts(like_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_likes_post ON board_likes(post_id);

-- ── 5. RLS ──
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_likes ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY "profiles_public_read" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "profiles_owner_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_owner_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- board_posts
CREATE POLICY "posts_public_read" ON board_posts FOR SELECT USING (true);
CREATE POLICY "posts_auth_insert" ON board_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_owner_delete" ON board_posts FOR DELETE USING (auth.uid() = user_id);

-- board_likes
CREATE POLICY "likes_public_read" ON board_likes FOR SELECT USING (true);
CREATE POLICY "likes_auth_insert" ON board_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_owner_delete" ON board_likes FOR DELETE USING (auth.uid() = user_id);

-- ── 6. 추천수 자동 갱신 트리거 ──
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE board_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE board_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_like_count ON board_likes;
CREATE TRIGGER trg_like_count
  AFTER INSERT OR DELETE ON board_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- ── 7. 유저 프로필 자동 생성 트리거 ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, kakao_nickname, profile_image)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '사용자'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
