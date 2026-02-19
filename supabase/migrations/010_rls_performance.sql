-- =============================================================================
-- 010_rls_performance.sql — RLS 성능 최적화 (최종 정책)
-- - (select auth.uid()) 캐싱 패턴
-- - 복합 인덱스
-- - 소프트 삭제 반영
-- - group_members UPDATE 정책 추가
-- =============================================================================

-- 1. 그룹 멤버십 확인용 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_group_members_lookup
  ON group_members(group_id, user_id, status);

-- =============================================================================
-- 2. posts RLS (최종)
-- =============================================================================

DROP POLICY IF EXISTS "Everyone can read posts" ON posts;
CREATE POLICY "Everyone can read posts"
  ON posts FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      group_id IS NULL
      OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = posts.group_id
          AND gm.user_id = (select auth.uid())
          AND gm.status = 'approved'
      )
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING ((select auth.uid()) = author_id AND deleted_at IS NULL)
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING ((select auth.uid()) = author_id);

-- =============================================================================
-- 3. comments RLS (최종)
-- =============================================================================

DROP POLICY IF EXISTS "Everyone can read comments" ON comments;
CREATE POLICY "Everyone can read comments"
  ON comments FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      group_id IS NULL
      OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = comments.group_id
          AND gm.user_id = (select auth.uid())
          AND gm.status = 'approved'
      )
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING ((select auth.uid()) = author_id AND deleted_at IS NULL)
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING ((select auth.uid()) = author_id);

-- =============================================================================
-- 4. reactions RLS (최종)
-- =============================================================================

DROP POLICY IF EXISTS "Everyone can read reactions" ON reactions;
CREATE POLICY "Everyone can read reactions"
  ON reactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reactions" ON reactions;
CREATE POLICY "Authenticated users can create reactions"
  ON reactions FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'anon'));

DROP POLICY IF EXISTS "Authenticated users can update reactions" ON reactions;
CREATE POLICY "Authenticated users can update reactions"
  ON reactions FOR UPDATE
  USING (auth.role() IN ('authenticated', 'anon'));

-- =============================================================================
-- 5. group_members RLS (최종)
-- =============================================================================

DROP POLICY IF EXISTS "Users can read own group_members" ON group_members;
CREATE POLICY "Users can read own group_members"
  ON group_members FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can join groups" ON group_members;
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own group_members" ON group_members;
CREATE POLICY "Users can update own group_members"
  ON group_members FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
