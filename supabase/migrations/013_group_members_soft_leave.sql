-- =============================================================================
-- 013_group_members_soft_leave.sql — group_members 소프트 탈퇴·정리·인덱스
-- - status에 'left' 추가 (탈퇴 시 DELETE 대신 UPDATE)
-- - left_at 컬럼 추가
-- - status = 'approved' 부분 인덱스
-- - 오래된 익명 사용자 group_members 정리 함수
-- =============================================================================

-- 1. status CHECK에 'left' 추가
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_status_check;
ALTER TABLE group_members ADD CONSTRAINT group_members_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'left'));

-- 2. left_at 컬럼 추가 (탈퇴 시점 기록)
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS left_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_group_members_left_at
  ON group_members(left_at) WHERE left_at IS NOT NULL;

-- 3. status = 'approved' 부분 인덱스 (RLS·getMyGroups 최적화)
CREATE INDEX IF NOT EXISTS idx_group_members_approved
  ON group_members(group_id, user_id) WHERE status = 'approved';

-- 4. 오래된 익명 사용자 group_members 정리 함수
--    auth.users 중 is_anonymous=true 이고 last_sign_in_at이 180일 이전인 사용자의
--    group_members 행만 삭제 (auth.users는 건드리지 않음)
CREATE OR REPLACE FUNCTION public.cleanup_orphan_group_members(days_inactive integer DEFAULT 180)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  deleted_count integer;
  safe_days integer;
BEGIN
  -- 1일 미만·NULL·음수 방지 (의도치 않은 대량 삭제 방지)
  safe_days := GREATEST(COALESCE(NULLIF(days_inactive, 0), 180), 1);

  DELETE FROM public.group_members
  WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE is_anonymous = true
      AND (last_sign_in_at IS NULL OR last_sign_in_at < (now() - (safe_days || ' days')::interval))
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'cleanup_orphan_group_members: deleted % rows (days_inactive=%)', deleted_count, safe_days;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_orphan_group_members(integer) IS
  '오래 로그인하지 않은 익명 사용자의 group_members 행을 삭제합니다. 기본 180일. 대시보드 SQL 또는 Edge Function에서 주기적으로 호출하세요.';
