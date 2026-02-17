-- =============================================================================
-- 005_board_enums_and_indexes.sql — boards/groups enum-style 제약 및 인덱스
-- =============================================================================

-- visibility: public | private
ALTER TABLE boards
  ADD CONSTRAINT boards_visibility_check
  CHECK (visibility IN ('public', 'private'));

-- anon_mode: always_anon | allow_choice | require_name
ALTER TABLE boards
  ADD CONSTRAINT boards_anon_mode_check
  CHECK (anon_mode IN ('always_anon', 'allow_choice', 'require_name'));

-- groups.join_mode: invite_only | request_approve | code_join
ALTER TABLE groups
  ADD CONSTRAINT groups_join_mode_check
  CHECK (join_mode IN ('invite_only', 'request_approve', 'code_join'));

-- group_members.role: owner | member | moderator
ALTER TABLE group_members
  ADD CONSTRAINT group_members_role_check
  CHECK (role IN ('owner', 'member', 'moderator'));

-- group_members.status: pending | approved | rejected
ALTER TABLE group_members
  ADD CONSTRAINT group_members_status_check
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- 게시판별 최신순 조회 최적화용 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_board_created_at
  ON posts(board_id, created_at DESC);

