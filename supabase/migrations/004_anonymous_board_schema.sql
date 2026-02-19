-- =============================================================================
-- 004_anonymous_board_schema.sql — 게시판/그룹/멤버십 + 익명 컬럼
-- =============================================================================

-- 1. boards 테이블
CREATE TABLE IF NOT EXISTS boards (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  visibility  TEXT NOT NULL DEFAULT 'public',
  anon_mode   TEXT NOT NULL DEFAULT 'allow_choice',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. groups 테이블
CREATE TABLE IF NOT EXISTS groups (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID REFERENCES auth.users(id),
  join_mode   TEXT NOT NULL DEFAULT 'invite_only',
  invite_code TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. group_members 테이블
CREATE TABLE IF NOT EXISTS group_members (
  group_id  BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT   NOT NULL DEFAULT 'member',
  status    TEXT   NOT NULL DEFAULT 'approved',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- 4. 인덱스
CREATE INDEX IF NOT EXISTS idx_boards_visibility       ON boards(visibility);
CREATE INDEX IF NOT EXISTS idx_groups_owner_id         ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code      ON groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id   ON group_members(user_id);

-- 5. RLS 활성화
ALTER TABLE boards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 6. 초기 RLS 정책 (008에서 boards/groups INSERT가 교체됨)
CREATE POLICY "Everyone can read boards"
  ON boards FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create boards"
  ON boards FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'anon'));

CREATE POLICY "Everyone can read groups"
  ON groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'anon'));

CREATE POLICY "Users can read own group_members"
  ON group_members FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. posts/comments 확장 컬럼
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS board_id      BIGINT REFERENCES boards(id),
  ADD COLUMN IF NOT EXISTS group_id      BIGINT REFERENCES groups(id),
  ADD COLUMN IF NOT EXISTS is_anonymous  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_name  TEXT NOT NULL DEFAULT '익명';

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS board_id      BIGINT REFERENCES boards(id),
  ADD COLUMN IF NOT EXISTS group_id      BIGINT REFERENCES groups(id),
  ADD COLUMN IF NOT EXISTS is_anonymous  BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_name  TEXT NOT NULL DEFAULT '익명';

-- 8. 조회 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_board_id    ON posts(board_id);
CREATE INDEX IF NOT EXISTS idx_posts_group_id    ON posts(group_id);
CREATE INDEX IF NOT EXISTS idx_comments_board_id ON comments(board_id);
CREATE INDEX IF NOT EXISTS idx_comments_group_id ON comments(group_id);
