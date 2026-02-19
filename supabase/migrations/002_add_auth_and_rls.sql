-- =============================================================================
-- 002_add_auth_and_rls.sql — author_id 추가 + auth.uid() 기반 RLS
-- =============================================================================

-- 1. author_id 컬럼 추가
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id);

-- 2. 기존 행 backfill → NOT NULL 적용
DO $$
DECLARE
  placeholder UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  UPDATE posts    SET author_id = placeholder WHERE author_id IS NULL;
  UPDATE comments SET author_id = placeholder WHERE author_id IS NULL;
END $$;

ALTER TABLE posts    ALTER COLUMN author_id SET NOT NULL;
ALTER TABLE comments ALTER COLUMN author_id SET NOT NULL;

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_author_id    ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

-- 4. 기존 초기 정책 제거 (멱등)
DROP POLICY IF EXISTS "Anyone can read posts"    ON posts;
DROP POLICY IF EXISTS "Anyone can create posts"  ON posts;
DROP POLICY IF EXISTS "Anyone can delete posts"  ON posts;
DROP POLICY IF EXISTS "Everyone can read posts"  ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

DROP POLICY IF EXISTS "Anyone can read comments"    ON comments;
DROP POLICY IF EXISTS "Anyone can create comments"  ON comments;
DROP POLICY IF EXISTS "Anyone can delete comments"  ON comments;
DROP POLICY IF EXISTS "Everyone can read comments"  ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

DROP POLICY IF EXISTS "Anyone can read reactions"    ON reactions;
DROP POLICY IF EXISTS "Anyone can insert reactions"  ON reactions;
DROP POLICY IF EXISTS "Anyone can update reactions"  ON reactions;
DROP POLICY IF EXISTS "Everyone can read reactions"  ON reactions;
DROP POLICY IF EXISTS "Authenticated users can create reactions" ON reactions;
DROP POLICY IF EXISTS "Authenticated users can update reactions" ON reactions;

-- 5. 새 RLS 정책 (auth.uid() 기반)
CREATE POLICY "Everyone can read posts"
  ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Everyone can read comments"
  ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Everyone can read reactions"
  ON reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reactions"
  ON reactions FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'anon'));
CREATE POLICY "Authenticated users can update reactions"
  ON reactions FOR UPDATE
  USING (auth.role() IN ('authenticated', 'anon'));
