-- =============================================================================
-- 005_board_enums_and_indexes.sql — CHECK 제약 + 복합 인덱스
-- =============================================================================

-- CHECK 제약 (멱등: 이미 존재하면 건너뜀)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boards_visibility_check') THEN
    ALTER TABLE boards ADD CONSTRAINT boards_visibility_check
      CHECK (visibility IN ('public', 'private'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'boards_anon_mode_check') THEN
    ALTER TABLE boards ADD CONSTRAINT boards_anon_mode_check
      CHECK (anon_mode IN ('always_anon', 'allow_choice', 'require_name'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_join_mode_check') THEN
    ALTER TABLE groups ADD CONSTRAINT groups_join_mode_check
      CHECK (join_mode IN ('invite_only', 'request_approve', 'code_join'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_members_role_check') THEN
    ALTER TABLE group_members ADD CONSTRAINT group_members_role_check
      CHECK (role IN ('owner', 'member', 'moderator'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_members_status_check') THEN
    ALTER TABLE group_members ADD CONSTRAINT group_members_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- 게시판별 최신순 조회 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_board_created_at
  ON posts(board_id, created_at DESC);
