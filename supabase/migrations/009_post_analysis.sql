-- =============================================================================
-- 009_post_analysis.sql — 감정 분석 테이블 및 뷰 갱신
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. post_analysis 테이블
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS post_analysis (
  id          BIGSERIAL PRIMARY KEY,
  post_id     BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  emotions    TEXT[] NOT NULL DEFAULT '{}',
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id)
);

CREATE INDEX IF NOT EXISTS idx_post_analysis_post_id ON post_analysis(post_id);
ALTER TABLE post_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_analysis_select" ON post_analysis
  FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- 2. posts_with_like_count 뷰 재생성 (emotions 포함)
-- -----------------------------------------------------------------------------

DROP VIEW IF EXISTS posts_with_like_count;
CREATE VIEW posts_with_like_count AS
SELECT
  p.id, p.title, p.content, p.author, p.author_id, p.created_at,
  p.board_id, p.group_id, p.is_anonymous, p.display_name, p.member_id,
  COALESCE(
    (SELECT SUM(r.count) FROM reactions r
     WHERE r.post_id = p.id AND r.reaction_type = 'like'), 0
  )::INT AS like_count,
  (SELECT COUNT(*)::INT FROM comments c
   WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count,
  pa.emotions AS emotions
FROM posts p
LEFT JOIN post_analysis pa ON pa.post_id = p.id
WHERE p.deleted_at IS NULL;
