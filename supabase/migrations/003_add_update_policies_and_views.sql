-- =============================================================================
-- 003_add_update_policies_and_views.sql — UPDATE 정책 + 인기순 뷰
-- 주의: 이 뷰는 009에서 전체 컬럼 포함하여 재생성됨
-- =============================================================================

-- 1. UPDATE 정책 (본인만 수정)
DROP POLICY IF EXISTS "Users can update own posts"    ON posts;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 2. 인기순 정렬용 뷰 (초기 버전 — 009에서 재생성됨)
CREATE OR REPLACE VIEW posts_with_like_count AS
SELECT
  p.id, p.title, p.content, p.author, p.author_id, p.created_at,
  COALESCE((
    SELECT SUM(r.count) FROM reactions r
    WHERE r.post_id = p.id AND r.reaction_type = 'like'
  ), 0)::INT AS like_count,
  (SELECT COUNT(*)::INT FROM comments c WHERE c.post_id = p.id) AS comment_count
FROM posts p;

GRANT SELECT ON posts_with_like_count TO anon;
GRANT SELECT ON posts_with_like_count TO authenticated;
