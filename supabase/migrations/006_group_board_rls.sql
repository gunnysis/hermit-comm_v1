-- =============================================================================
-- 006_group_board_rls.sql — 그룹 게시판용 RLS 확장
-- - posts/comments 읽기 정책을 그룹 멤버십 기반으로 강화
-- =============================================================================

-- 기존 읽기 정책 제거 (idempotent)
DROP POLICY IF EXISTS "Everyone can read posts" ON posts;
DROP POLICY IF EXISTS "Everyone can read comments" ON comments;

-- posts: 공개 게시판은 모두 읽기 가능, 그룹 게시판은 그룹 멤버만 읽기 가능
CREATE POLICY "Everyone can read posts"
  ON posts
  FOR SELECT
  USING (
    -- 그룹이 없는 공개 게시판 글
    group_id IS NULL
    OR
    -- 그룹 게시판 글: 승인된 멤버만
    EXISTS (
      SELECT 1
      FROM group_members gm
      WHERE gm.group_id = posts.group_id
        AND gm.user_id = auth.uid()
        AND gm.status = 'approved'
    )
  );

-- comments: posts와 동일한 규칙 적용
CREATE POLICY "Everyone can read comments"
  ON comments
  FOR SELECT
  USING (
    group_id IS NULL
    OR
    EXISTS (
      SELECT 1
      FROM group_members gm
      WHERE gm.group_id = comments.group_id
        AND gm.user_id = auth.uid()
        AND gm.status = 'approved'
    )
  );

