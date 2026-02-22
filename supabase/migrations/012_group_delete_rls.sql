-- =============================================================================
-- 012_group_delete_rls.sql — 그룹 삭제 RLS + 보드 삭제 시 글·댓글 CASCADE
-- 관리자만 본인이 소유한 그룹(owner_id) 삭제 가능. 그룹 삭제 시 boards CASCADE,
-- boards 삭제 시 해당 보드의 posts/comments CASCADE로 정리.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. groups DELETE 정책 (본인 소유 + app_admin만)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Only app_admin owner can delete own group" ON groups;
CREATE POLICY "Only app_admin owner can delete own group"
  ON groups FOR DELETE
  USING (
    owner_id = (SELECT auth.uid())
    AND (SELECT auth.uid()) IN (SELECT user_id FROM app_admin)
  );

-- -----------------------------------------------------------------------------
-- 2. posts.board_id ON DELETE CASCADE (보드 삭제 시 해당 보드 글 삭제)
-- -----------------------------------------------------------------------------

ALTER TABLE posts
  DROP CONSTRAINT IF EXISTS posts_board_id_fkey;

ALTER TABLE posts
  ADD CONSTRAINT posts_board_id_fkey
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- 3. comments.board_id ON DELETE CASCADE (보드 삭제 시 해당 보드 댓글 삭제)
-- -----------------------------------------------------------------------------

ALTER TABLE comments
  DROP CONSTRAINT IF EXISTS comments_board_id_fkey;

ALTER TABLE comments
  ADD CONSTRAINT comments_board_id_fkey
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;
