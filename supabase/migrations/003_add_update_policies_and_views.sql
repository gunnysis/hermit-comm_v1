-- =============================================================================
-- 003_add_update_policies_and_views.sql — 수정 정책 + 인기순 정렬용 뷰
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. RLS UPDATE 정책 (본인만 수정)
-- -----------------------------------------------------------------------------

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- -----------------------------------------------------------------------------
-- 2. 인기순 정렬용 뷰 (like_count)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW posts_with_like_count AS
SELECT
  p.id,
  p.title,
  p.content,
  p.author,
  p.author_id,
  p.created_at,
  COALESCE((
    SELECT SUM(r.count)
    FROM reactions r
    WHERE r.post_id = p.id AND r.reaction_type = 'like'
  ), 0)::INT AS like_count,
  (SELECT COUNT(*)::INT FROM comments c WHERE c.post_id = p.id) AS comment_count
FROM posts p;

-- 뷰 읽기 권한 (RLS는 기반 테이블 posts 기준으로 적용됨)
GRANT SELECT ON posts_with_like_count TO anon;
GRANT SELECT ON posts_with_like_count TO authenticated;
