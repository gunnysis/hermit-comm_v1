-- =============================================================================
-- 006_group_board_rls.sql — 그룹 멤버십 기반 읽기 RLS
-- 주의: 이 정책은 010에서 성능 최적화 버전으로 교체됨
-- =============================================================================

DROP POLICY IF EXISTS "Everyone can read posts"    ON posts;
DROP POLICY IF EXISTS "Everyone can read comments" ON comments;

CREATE POLICY "Everyone can read posts"
  ON posts FOR SELECT
  USING (
    group_id IS NULL
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = posts.group_id
        AND gm.user_id = auth.uid()
        AND gm.status = 'approved'
    )
  );

CREATE POLICY "Everyone can read comments"
  ON comments FOR SELECT
  USING (
    group_id IS NULL
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = comments.group_id
        AND gm.user_id = auth.uid()
        AND gm.status = 'approved'
    )
  );
