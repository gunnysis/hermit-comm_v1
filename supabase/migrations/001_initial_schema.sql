-- =============================================================================
-- 001_initial_schema.sql — 은둔마을 초기 스키마
-- 테이블 생성, 인덱스, RLS 활성화 및 초기 정책(전체 허용)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 테이블
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS posts (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  author     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id         BIGSERIAL PRIMARY KEY,
  post_id    BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  author     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reactions (
  id            BIGSERIAL PRIMARY KEY,
  post_id       BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  count         INT DEFAULT 0,
  UNIQUE (post_id, reaction_type)
);

-- -----------------------------------------------------------------------------
-- 인덱스
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_posts_created_at   ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id   ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id  ON reactions(post_id);

-- -----------------------------------------------------------------------------
-- RLS 활성화 및 정책 (초기: 모두 허용)
-- -----------------------------------------------------------------------------

ALTER TABLE posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- posts
CREATE POLICY "Anyone can read posts"    ON posts FOR SELECT USING (true);
CREATE POLICY "Anyone can create posts"  ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete posts"  ON posts FOR DELETE USING (true);

-- comments
CREATE POLICY "Anyone can read comments"    ON comments FOR SELECT USING (true);
CREATE POLICY "Anyone can create comments"  ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete comments"  ON comments FOR DELETE USING (true);

-- reactions
CREATE POLICY "Anyone can read reactions"    ON reactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reactions" ON reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reactions" ON reactions FOR UPDATE USING (true);
