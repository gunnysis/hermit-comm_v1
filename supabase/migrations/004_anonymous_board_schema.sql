-- =============================================================================
-- 004_anonymous_board_schema.sql — 익명 그룹 게시판용 스키마 확장
-- - 게시판/그룹/멤버십 테이블
-- - posts/comments에 익명·게시판 관련 컬럼 추가
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 게시판 / 그룹 / 멤버십 테이블
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS boards (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  -- 공개 범위: public(앱 전체), private(특정 그룹 전용 등)
  visibility  TEXT NOT NULL DEFAULT 'public',
  -- 익명 모드: always_anon | allow_choice | require_name
  anon_mode   TEXT NOT NULL DEFAULT 'allow_choice',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS groups (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID REFERENCES auth.users(id),
  -- 가입 방식: invite_only | request_approve | code_join
  join_mode   TEXT NOT NULL DEFAULT 'invite_only',
  invite_code TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id  UUID   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role     TEXT   NOT NULL DEFAULT 'member', -- owner | member | moderator
  status   TEXT   NOT NULL DEFAULT 'approved', -- pending | approved | rejected
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- 기본 인덱스
CREATE INDEX IF NOT EXISTS idx_boards_visibility ON boards(visibility);
CREATE INDEX IF NOT EXISTS idx_groups_owner_id   ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- RLS 활성화
ALTER TABLE boards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- boards: 읽기는 모두 허용, 생성은 인증 사용자만 (단순 정책)
CREATE POLICY "Everyone can read boards"
  ON boards FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create boards"
  ON boards FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'anon'));

-- groups: 읽기는 모두 허용(향후 조정 가능), 생성은 인증 사용자만
CREATE POLICY "Everyone can read groups"
  ON groups FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'anon'));

-- group_members: 자신의 멤버십만 조회/추가 가능 (단순 버전)
CREATE POLICY "Users can read own group_members"
  ON group_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 2. posts / comments 테이블 확장
-- -----------------------------------------------------------------------------

-- 게시판/그룹 연결 컬럼 (선택적)
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS board_id BIGINT REFERENCES boards(id),
  ADD COLUMN IF NOT EXISTS group_id BIGINT REFERENCES groups(id);

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS board_id BIGINT REFERENCES boards(id),
  ADD COLUMN IF NOT EXISTS group_id BIGINT REFERENCES groups(id);

-- 익명성 관련 컬럼: 기본값은 익명 + '익명' 표시
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT '익명';

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT '익명';

-- 조회 최적화를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_board_id   ON posts(board_id);
CREATE INDEX IF NOT EXISTS idx_posts_group_id   ON posts(group_id);
CREATE INDEX IF NOT EXISTS idx_comments_board_id ON comments(board_id);
CREATE INDEX IF NOT EXISTS idx_comments_group_id ON comments(group_id);

