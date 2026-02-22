-- =============================================================================
-- 001_schema.sql — 통합 스키마
-- 테이블, 인덱스, CHECK 제약, updated_at 트리거, 소프트 삭제, 뷰, 스팸 방지·정리 함수
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 그룹·게시판·멤버십
-- -----------------------------------------------------------------------------

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
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_join_mode_check;
ALTER TABLE groups ADD CONSTRAINT groups_join_mode_check CHECK (join_mode IN ('invite_only', 'request_approve', 'code_join'));

CREATE TABLE IF NOT EXISTS boards (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  visibility  TEXT NOT NULL DEFAULT 'public',
  anon_mode   TEXT NOT NULL DEFAULT 'allow_choice',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE boards ADD COLUMN IF NOT EXISTS group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE boards DROP CONSTRAINT IF EXISTS boards_visibility_check;
ALTER TABLE boards ADD CONSTRAINT boards_visibility_check CHECK (visibility IN ('public', 'private'));
ALTER TABLE boards DROP CONSTRAINT IF EXISTS boards_anon_mode_check;
ALTER TABLE boards ADD CONSTRAINT boards_anon_mode_check CHECK (anon_mode IN ('always_anon', 'allow_choice', 'require_name'));

CREATE TABLE IF NOT EXISTS group_members (
  id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  group_id  BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT   NOT NULL DEFAULT 'member',
  status    TEXT   NOT NULL DEFAULT 'approved',
  nickname  TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at   TIMESTAMPTZ,
  PRIMARY KEY (group_id, user_id)
);
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_role_check;
ALTER TABLE group_members ADD CONSTRAINT group_members_role_check CHECK (role IN ('owner', 'member', 'moderator'));

-- group_members.id는 004/009에서 추가된 형태; 기존 테이블이 있으면 컬럼만 추가
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'id') THEN
    ALTER TABLE group_members ADD COLUMN id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'nickname') THEN
    ALTER TABLE group_members ADD COLUMN nickname TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'group_members' AND column_name = 'left_at') THEN
    ALTER TABLE group_members ADD COLUMN left_at TIMESTAMPTZ;
  END IF;
END $$;
-- status에 'left' 추가 (기존 제약이 있으면 교체)
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_status_check;
ALTER TABLE group_members ADD CONSTRAINT group_members_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'left'));

-- -----------------------------------------------------------------------------
-- 2. 게시글·댓글·반응
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS posts (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  author       TEXT NOT NULL,
  author_id    UUID NOT NULL REFERENCES auth.users(id),
  board_id     BIGINT REFERENCES boards(id),
  group_id     BIGINT REFERENCES groups(id),
  member_id    BIGINT REFERENCES group_members(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT NOT NULL DEFAULT '익명',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

-- 기존 DB 호환: author_id/board_id/group_id 등 없으면 추가
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS board_id BIGINT REFERENCES boards(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS group_id BIGINT REFERENCES groups(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS member_id BIGINT REFERENCES group_members(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT '익명';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
DO $$
DECLARE
  placeholder UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  UPDATE posts SET author_id = placeholder WHERE author_id IS NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
ALTER TABLE posts ALTER COLUMN author_id SET NOT NULL;

CREATE TABLE IF NOT EXISTS comments (
  id           BIGSERIAL PRIMARY KEY,
  post_id      BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  author       TEXT NOT NULL,
  author_id    UUID NOT NULL REFERENCES auth.users(id),
  board_id     BIGINT REFERENCES boards(id),
  group_id     BIGINT REFERENCES groups(id),
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT NOT NULL DEFAULT '익명',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS board_id BIGINT REFERENCES boards(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS group_id BIGINT REFERENCES groups(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT '익명';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
DO $$
DECLARE
  placeholder UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  UPDATE comments SET author_id = placeholder WHERE author_id IS NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
ALTER TABLE comments ALTER COLUMN author_id SET NOT NULL;

CREATE TABLE IF NOT EXISTS reactions (
  id            BIGSERIAL PRIMARY KEY,
  post_id       BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  count         INT NOT NULL DEFAULT 0,
  UNIQUE (post_id, reaction_type)
);

-- -----------------------------------------------------------------------------
-- 3. 관리자
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app_admin (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. 인덱스
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_posts_created_at          ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_board_id            ON posts(board_id);
CREATE INDEX IF NOT EXISTS idx_posts_group_id            ON posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id           ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_member_id           ON posts(member_id);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at          ON posts(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_board_created_at    ON posts(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id_created_at ON posts(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_post_id          ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_board_id         ON comments(board_id);
CREATE INDEX IF NOT EXISTS idx_comments_group_id         ON comments(group_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id        ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_at       ON comments(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_author_id_created_at ON comments(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reactions_post_id         ON reactions(post_id);

CREATE INDEX IF NOT EXISTS idx_boards_visibility         ON boards(visibility);
CREATE INDEX IF NOT EXISTS idx_boards_group_id           ON boards(group_id);

CREATE INDEX IF NOT EXISTS idx_groups_owner_id           ON groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code        ON groups(invite_code);

CREATE INDEX IF NOT EXISTS idx_group_members_user_id     ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_lookup      ON group_members(group_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_group_members_approved    ON group_members(group_id, user_id) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_group_members_left_at     ON group_members(left_at) WHERE left_at IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. RLS 활성화
-- -----------------------------------------------------------------------------

ALTER TABLE posts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards       ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_admin    ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 6. updated_at 트리거
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$ BEGIN new.updated_at := now(); RETURN new; END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_posts_updated_at') THEN
    CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_comments_updated_at') THEN
    CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_boards_updated_at') THEN
    CREATE TRIGGER trg_boards_updated_at BEFORE UPDATE ON boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_groups_updated_at') THEN
    CREATE TRIGGER trg_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 7. 인기순 뷰 (소프트 삭제 반영)
-- -----------------------------------------------------------------------------

DROP VIEW IF EXISTS posts_with_like_count;
CREATE VIEW posts_with_like_count AS
SELECT
  p.id, p.title, p.content, p.author, p.author_id, p.created_at,
  p.board_id, p.group_id, p.is_anonymous, p.display_name, p.member_id,
  COALESCE((SELECT SUM(r.count) FROM reactions r WHERE r.post_id = p.id AND r.reaction_type = 'like'), 0)::INT AS like_count,
  (SELECT COUNT(*)::INT FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count
FROM posts p
WHERE p.deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 8. 스팸 방지 트리거
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_daily_post_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE daily_count INT;
BEGIN
  SELECT COUNT(*) INTO daily_count FROM public.posts
  WHERE author_id = NEW.author_id AND created_at > now() - interval '1 day';
  IF daily_count >= 50 THEN
    RAISE EXCEPTION '일일 게시글 작성 한도(50건)를 초과했습니다.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_daily_post_limit') THEN
    CREATE TRIGGER trg_check_daily_post_limit BEFORE INSERT ON posts FOR EACH ROW EXECUTE FUNCTION public.check_daily_post_limit();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.check_daily_comment_limit()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE daily_count INT;
BEGIN
  SELECT COUNT(*) INTO daily_count FROM public.comments
  WHERE author_id = NEW.author_id AND created_at > now() - interval '1 day';
  IF daily_count >= 100 THEN
    RAISE EXCEPTION '일일 댓글 작성 한도(100건)를 초과했습니다.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END; $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_daily_comment_limit') THEN
    CREATE TRIGGER trg_check_daily_comment_limit BEFORE INSERT ON comments FOR EACH ROW EXECUTE FUNCTION public.check_daily_comment_limit();
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 9. 오래된 익명 사용자 group_members 정리 함수
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cleanup_orphan_group_members(days_inactive integer DEFAULT 180)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE deleted_count integer; safe_days integer;
BEGIN
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
END; $$;

COMMENT ON FUNCTION public.cleanup_orphan_group_members(integer) IS
  '오래 로그인하지 않은 익명 사용자의 group_members 행을 삭제합니다. 기본 180일. 대시보드 SQL 또는 Edge Function에서 주기적으로 호출하세요.';
