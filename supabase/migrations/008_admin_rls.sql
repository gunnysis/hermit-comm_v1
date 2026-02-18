-- =============================================================================
-- 008_admin_rls.sql — app_admin 테이블 및 그룹/보드 생성 RLS 제한
-- - app_admin에 등록된 사용자만 groups/boards INSERT 가능
-- - 관리자 등록 방법: docs/supabase_setup.md §8.4 참고
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. app_admin 테이블
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_admin (
  user_id  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE app_admin ENABLE ROW LEVEL SECURITY;

-- 본인 행만 조회 가능 (RLS 서브쿼리에서 "auth.uid() IN (SELECT user_id FROM app_admin)" 사용 시 필요)
CREATE POLICY "Users can read own app_admin row"
  ON app_admin FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE는 anon/authenticated 정책 없음 → 서비스 롤 또는 SQL 편집기로만 관리
-- 관리자 추가: Supabase 대시보드 SQL Editor에서
--   INSERT INTO app_admin (user_id) VALUES ('uuid-here');

-- -----------------------------------------------------------------------------
-- 2. groups INSERT 정책 교체
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;

CREATE POLICY "Only app_admin can create groups as owner"
  ON groups FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM app_admin)
    AND owner_id = auth.uid()
  );

-- -----------------------------------------------------------------------------
-- 3. boards INSERT 정책 교체
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can create boards" ON boards;

CREATE POLICY "Only app_admin can create boards"
  ON boards FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM app_admin));
