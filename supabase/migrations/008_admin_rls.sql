-- =============================================================================
-- 008_admin_rls.sql — app_admin 테이블 + groups/boards INSERT 관리자 제한
-- 관리자 추가: SQL Editor에서 INSERT INTO app_admin (user_id) VALUES ('uuid');
-- =============================================================================

-- 1. app_admin 테이블
CREATE TABLE IF NOT EXISTS app_admin (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE app_admin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own app_admin row" ON app_admin;
CREATE POLICY "Users can read own app_admin row"
  ON app_admin FOR SELECT
  USING ((select auth.uid()) = user_id);

-- 2. groups INSERT → 관리자만
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
DROP POLICY IF EXISTS "Only app_admin can create groups as owner" ON groups;

CREATE POLICY "Only app_admin can create groups as owner"
  ON groups FOR INSERT
  WITH CHECK (
    (select auth.uid()) IN (SELECT user_id FROM app_admin)
    AND owner_id = (select auth.uid())
  );

-- 3. boards INSERT → 관리자만
DROP POLICY IF EXISTS "Authenticated users can create boards" ON boards;
DROP POLICY IF EXISTS "Only app_admin can create boards" ON boards;

CREATE POLICY "Only app_admin can create boards"
  ON boards FOR INSERT
  WITH CHECK ((select auth.uid()) IN (SELECT user_id FROM app_admin));
