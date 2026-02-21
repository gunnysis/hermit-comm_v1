-- =============================================================================
-- 009_schema_improvements.sql — 스키마 정합성 수정
-- - posts/comments에 updated_at 보장
-- - group_members에 id + nickname 추가
-- - posts에 member_id FK 추가
-- - updated_at 자동 갱신 트리거
-- - 소프트 삭제 (deleted_at) 컬럼
-- - posts_with_like_count 뷰 재생성 (전체 컬럼 + 소프트 삭제 반영)
-- =============================================================================

-- 1. posts/comments에 updated_at 보장 (001 이전 DB에 없을 수 있음)
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. group_members 확장: id + nickname
ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS id BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE;
ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 3. posts에 member_id FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'member_id'
  ) THEN
    ALTER TABLE posts ADD COLUMN member_id BIGINT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND constraint_name = 'posts_member_id_fkey' AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts
      ADD CONSTRAINT posts_member_id_fkey
      FOREIGN KEY (member_id) REFERENCES group_members(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_posts_member_id ON posts(member_id);

-- 4. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_posts_updated_at') THEN
    CREATE TRIGGER trg_posts_updated_at
      BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_comments_updated_at') THEN
    CREATE TRIGGER trg_comments_updated_at
      BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_boards_updated_at') THEN
    CREATE TRIGGER trg_boards_updated_at
      BEFORE UPDATE ON boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_groups_updated_at') THEN
    CREATE TRIGGER trg_groups_updated_at
      BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- 5. 소프트 삭제
ALTER TABLE posts    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_posts_deleted_at    ON posts(deleted_at)    WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_deleted_at ON comments(deleted_at) WHERE deleted_at IS NOT NULL;

-- 6. posts_with_like_count 뷰 재생성 (컬럼 변경이 있으므로 DROP 후 재생성)
--    규모 확대 시 materialized view 또는 별도 집계 테이블 검토 가능
DROP VIEW IF EXISTS posts_with_like_count;
CREATE VIEW posts_with_like_count AS
SELECT
  p.id, p.title, p.content, p.author, p.author_id, p.created_at,
  p.board_id, p.group_id, p.is_anonymous, p.display_name, p.member_id,
  COALESCE((
    SELECT SUM(r.count) FROM reactions r
    WHERE r.post_id = p.id AND r.reaction_type = 'like'
  ), 0)::INT AS like_count,
  (SELECT COUNT(*)::INT FROM comments c
    WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count
FROM posts p
WHERE p.deleted_at IS NULL;

GRANT SELECT ON posts_with_like_count TO anon;
GRANT SELECT ON posts_with_like_count TO authenticated;
