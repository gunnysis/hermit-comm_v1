-- =============================================================================
-- 002_rls.sql — RLS 정책 (최종)
-- (select auth.uid()) 캐싱 패턴, 그룹 멤버십·소프트 삭제·관리자 반영
-- =============================================================================

-- -----------------------------------------------------------------------------
-- posts
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
DROP POLICY IF EXISTS "Anyone can create posts" ON posts;
DROP POLICY IF EXISTS "Anyone can delete posts" ON posts;
DROP POLICY IF EXISTS "Everyone can read posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;

CREATE POLICY "Everyone can read posts"
  ON posts FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      group_id IS NULL
      OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = posts.group_id
          AND gm.user_id = (SELECT auth.uid())
          AND gm.status = 'approved'
      )
    )
  );

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING ((SELECT auth.uid()) = author_id AND deleted_at IS NULL)
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING ((SELECT auth.uid()) = author_id);

-- -----------------------------------------------------------------------------
-- comments
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
DROP POLICY IF EXISTS "Anyone can delete comments" ON comments;
DROP POLICY IF EXISTS "Everyone can read comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;

CREATE POLICY "Everyone can read comments"
  ON comments FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      group_id IS NULL
      OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = comments.group_id
          AND gm.user_id = (SELECT auth.uid())
          AND gm.status = 'approved'
      )
    )
  );

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING ((SELECT auth.uid()) = author_id AND deleted_at IS NULL)
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE USING ((SELECT auth.uid()) = author_id);

-- -----------------------------------------------------------------------------
-- reactions
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can read reactions" ON reactions;
DROP POLICY IF EXISTS "Anyone can insert reactions" ON reactions;
DROP POLICY IF EXISTS "Anyone can update reactions" ON reactions;
DROP POLICY IF EXISTS "Everyone can read reactions" ON reactions;
DROP POLICY IF EXISTS "Authenticated users can create reactions" ON reactions;
DROP POLICY IF EXISTS "Authenticated users can update reactions" ON reactions;

CREATE POLICY "Everyone can read reactions"
  ON reactions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reactions"
  ON reactions FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'anon'));

CREATE POLICY "Authenticated users can update reactions"
  ON reactions FOR UPDATE USING (auth.role() IN ('authenticated', 'anon'));

-- -----------------------------------------------------------------------------
-- boards (관리자만 생성)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Everyone can read boards" ON boards;
DROP POLICY IF EXISTS "Authenticated users can create boards" ON boards;
DROP POLICY IF EXISTS "Only app_admin can create boards" ON boards;

CREATE POLICY "Everyone can read boards"
  ON boards FOR SELECT USING (true);

CREATE POLICY "Only app_admin can create boards"
  ON boards FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IN (SELECT user_id FROM app_admin));

-- -----------------------------------------------------------------------------
-- groups (관리자만 생성, owner_id = 본인)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Everyone can read groups" ON groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Only app_admin can create groups as owner" ON groups;

CREATE POLICY "Everyone can read groups"
  ON groups FOR SELECT USING (true);

CREATE POLICY "Only app_admin can create groups as owner"
  ON groups FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) IN (SELECT user_id FROM app_admin)
    AND owner_id = (SELECT auth.uid())
  );

-- -----------------------------------------------------------------------------
-- group_members
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can read own group_members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can update own group_members" ON group_members;

CREATE POLICY "Users can read own group_members"
  ON group_members FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own group_members"
  ON group_members FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- app_admin
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can read own app_admin row" ON app_admin;

CREATE POLICY "Users can read own app_admin row"
  ON app_admin FOR SELECT USING ((SELECT auth.uid()) = user_id);
