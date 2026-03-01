-- =============================================================================
-- 20260301000001_baseline.sql — 은둔마을 통합 스키마 베이스라인
--
-- 기존 마이그레이션 001~023, 20260223110128, 20260301000000을 단일 파일로 통합.
-- 멱등 패턴(IF NOT EXISTS, CREATE OR REPLACE, DROP IF EXISTS) 적용.
-- 원격 DB 실제 상태(2026-03-01) 기준.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 0. 확장
-- ----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------------------------------------------
-- 1. 함수
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path TO ''
AS $$
BEGIN
  new.updated_at := now();
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_daily_post_limit()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path TO ''
AS $$
DECLARE daily_count INT;
BEGIN
  SELECT COUNT(*) INTO daily_count
  FROM public.posts
  WHERE author_id = NEW.author_id AND created_at > now() - interval '1 day';
  IF daily_count >= 50 THEN
    RAISE EXCEPTION '일일 게시글 작성 한도(50건)를 초과했습니다.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_daily_comment_limit()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path TO ''
AS $$
DECLARE daily_count INT;
BEGIN
  SELECT COUNT(*) INTO daily_count
  FROM public.comments
  WHERE author_id = NEW.author_id AND created_at > now() - interval '1 day';
  IF daily_count >= 100 THEN
    RAISE EXCEPTION '일일 댓글 작성 한도(100건)를 초과했습니다.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_orphan_group_members(days_inactive integer DEFAULT 180)
  RETURNS integer LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'auth'
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
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_orphan_group_members(integer) IS
  '오래 로그인하지 않은 익명 사용자의 group_members 행을 삭제. 기본 180일. 주기적으로 호출하세요.';

CREATE OR REPLACE FUNCTION public.get_emotion_trend(days integer DEFAULT 7)
  RETURNS TABLE(emotion text, cnt bigint) LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(pa.emotions) AS emotion, COUNT(*)::BIGINT AS cnt
  FROM post_analysis pa
  WHERE pa.analyzed_at >= (now() - (days || ' days')::interval)
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT 5;
END;
$$;

COMMENT ON FUNCTION public.get_emotion_trend(integer) IS '최근 N일간 감정별 빈도 집계, 상위 5개 반환. 기본 7일.';

CREATE OR REPLACE FUNCTION public.get_recommended_posts_by_emotion(p_post_id bigint, p_limit integer DEFAULT 10)
  RETURNS TABLE(id bigint, title text, board_id bigint, like_count integer, comment_count integer, emotions text[], created_at timestamptz)
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE v_emotions TEXT[];
BEGIN
  SELECT COALESCE(pa.emotions, '{}') INTO v_emotions
  FROM post_analysis pa WHERE pa.post_id = p_post_id;
  IF array_length(v_emotions, 1) IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT v.id, v.title, v.board_id, v.like_count, v.comment_count, v.emotions, v.created_at
  FROM posts_with_like_count v
  WHERE v.id != p_post_id AND v.group_id IS NULL
    AND v.emotions IS NOT NULL AND v.emotions && v_emotions
  ORDER BY (SELECT COUNT(*) FROM unnest(v.emotions) e WHERE e = ANY(v_emotions)) DESC,
           v.like_count DESC, v.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_recommended_posts_by_emotion(bigint, integer) IS '지정 글과 감정이 겹치는 공개 글을 일치 수·좋아요·최신순으로 반환.';

-- ----------------------------------------------------------------------------
-- 2. 테이블 (의존 순서대로)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.groups (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  owner_id    UUID REFERENCES auth.users(id),
  join_mode   TEXT NOT NULL DEFAULT 'invite_only',
  invite_code TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT groups_join_mode_check CHECK (join_mode IN ('invite_only', 'request_approve', 'code_join'))
);

CREATE TABLE IF NOT EXISTS public.boards (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  visibility  TEXT NOT NULL DEFAULT 'public',
  anon_mode   TEXT NOT NULL DEFAULT 'allow_choice',
  group_id    BIGINT REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT boards_visibility_check CHECK (visibility IN ('public', 'private')),
  CONSTRAINT boards_anon_mode_check  CHECK (anon_mode IN ('always_anon', 'allow_choice', 'require_name'))
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id        BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  group_id  BIGINT NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id   UUID   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT   NOT NULL DEFAULT 'member',
  status    TEXT   NOT NULL DEFAULT 'approved',
  nickname  TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at   TIMESTAMPTZ,
  PRIMARY KEY (group_id, user_id),
  CONSTRAINT group_members_role_check   CHECK (role   IN ('owner', 'member', 'moderator')),
  CONSTRAINT group_members_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'left'))
);

CREATE TABLE IF NOT EXISTS public.posts (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  author       TEXT NOT NULL,
  author_id    UUID NOT NULL REFERENCES auth.users(id),
  board_id     BIGINT REFERENCES public.boards(id),
  group_id     BIGINT REFERENCES public.groups(id),
  member_id    BIGINT REFERENCES public.group_members(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT    NOT NULL DEFAULT '익명',
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

COMMENT ON TABLE public.posts IS '게시글. 감정 분석 자동 호출은 Database Webhooks(posts INSERT → analyze-post)로 설정하세요.';

CREATE TABLE IF NOT EXISTS public.comments (
  id           BIGSERIAL PRIMARY KEY,
  post_id      BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  author       TEXT NOT NULL,
  author_id    UUID NOT NULL REFERENCES auth.users(id),
  board_id     BIGINT REFERENCES public.boards(id),
  group_id     BIGINT REFERENCES public.groups(id),
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT    NOT NULL DEFAULT '익명',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.reactions (
  id            BIGSERIAL PRIMARY KEY,
  post_id       BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reaction_type TEXT   NOT NULL,
  count         INT    NOT NULL DEFAULT 0,
  UNIQUE (post_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS public.app_admin (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_analysis (
  id          BIGSERIAL PRIMARY KEY,
  post_id     BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE UNIQUE,
  emotions    TEXT[] NOT NULL DEFAULT '{}',
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_reactions (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id       BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reaction_type TEXT   NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, post_id, reaction_type)
);

-- ----------------------------------------------------------------------------
-- 3. 인덱스
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_posts_created_at           ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_board_id             ON public.posts(board_id);
CREATE INDEX IF NOT EXISTS idx_posts_group_id             ON public.posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id            ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_member_id            ON public.posts(member_id);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at           ON public.posts(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_board_created_at     ON public.posts(board_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author_id_created_at ON public.posts(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_post_id           ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_board_id          ON public.comments(board_id);
CREATE INDEX IF NOT EXISTS idx_comments_group_id          ON public.comments(group_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id         ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_deleted_at        ON public.comments(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_author_id_created_at ON public.comments(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reactions_post_id          ON public.reactions(post_id);

CREATE INDEX IF NOT EXISTS idx_boards_visibility          ON public.boards(visibility);
CREATE INDEX IF NOT EXISTS idx_boards_group_id            ON public.boards(group_id);

CREATE INDEX IF NOT EXISTS idx_groups_owner_id            ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code         ON public.groups(invite_code);

CREATE INDEX IF NOT EXISTS idx_group_members_user_id      ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_lookup       ON public.group_members(group_id, user_id, status);
CREATE INDEX IF NOT EXISTS idx_group_members_approved     ON public.group_members(group_id, user_id) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_group_members_left_at      ON public.group_members(left_at) WHERE left_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_post_analysis_post_id      ON public.post_analysis(post_id);

-- ----------------------------------------------------------------------------
-- 4. 뷰
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.posts_with_like_count
  WITH (security_invoker = true)
AS
SELECT
  p.id, p.title, p.content, p.author, p.author_id, p.created_at,
  p.board_id, p.group_id, p.is_anonymous, p.display_name, p.member_id, p.image_url,
  (COALESCE(
    (SELECT SUM(r.count) FROM public.reactions r WHERE r.post_id = p.id AND r.reaction_type = 'like'),
    0
  ))::integer AS like_count,
  (SELECT COUNT(*)::integer FROM public.comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count,
  pa.emotions
FROM public.posts p
LEFT JOIN public.post_analysis pa ON pa.post_id = p.id
WHERE p.deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 5. 트리거
-- ----------------------------------------------------------------------------

-- updated_at 자동 갱신
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_posts_updated_at') THEN
    CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_comments_updated_at') THEN
    CREATE TRIGGER trg_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_boards_updated_at') THEN
    CREATE TRIGGER trg_boards_updated_at BEFORE UPDATE ON public.boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_groups_updated_at') THEN
    CREATE TRIGGER trg_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- 일일 작성 한도 (게시글 50건 / 댓글 100건)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_daily_post_limit') THEN
    CREATE TRIGGER trg_check_daily_post_limit BEFORE INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.check_daily_post_limit();
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_daily_comment_limit') THEN
    CREATE TRIGGER trg_check_daily_comment_limit BEFORE INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.check_daily_comment_limit();
  END IF;
END $$;

-- posts INSERT 시 analyze-post Edge Function 자동 호출
CREATE OR REPLACE TRIGGER analyze_post_on_insert
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://qwrjebpsjjdxhhhllqcw.supabase.co/functions/v1/analyze-post',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );

-- ----------------------------------------------------------------------------
-- 6. RLS 활성화 및 정책
-- ----------------------------------------------------------------------------

ALTER TABLE public.posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_admin     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reactions ENABLE ROW LEVEL SECURITY;

-- posts
DROP POLICY IF EXISTS "Everyone can read posts"             ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts"          ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts"          ON public.posts;

CREATE POLICY "Everyone can read posts" ON public.posts FOR SELECT
  USING (deleted_at IS NULL AND (group_id IS NULL OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = posts.group_id AND gm.user_id = (SELECT auth.uid()) AND gm.status = 'approved'
  )));
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = author_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE
  USING ((SELECT auth.uid()) = author_id AND deleted_at IS NULL)
  WITH CHECK ((SELECT auth.uid()) = author_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE
  USING ((SELECT auth.uid()) = author_id);

-- comments
DROP POLICY IF EXISTS "Everyone can read comments"              ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments"          ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments"          ON public.comments;

CREATE POLICY "Everyone can read comments" ON public.comments FOR SELECT
  USING (deleted_at IS NULL AND (group_id IS NULL OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = comments.group_id AND gm.user_id = (SELECT auth.uid()) AND gm.status = 'approved'
  )));
CREATE POLICY "Authenticated users can create comments" ON public.comments FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = author_id);
CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE
  USING ((SELECT auth.uid()) = author_id AND deleted_at IS NULL)
  WITH CHECK ((SELECT auth.uid()) = author_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE
  USING ((SELECT auth.uid()) = author_id);

-- reactions
DROP POLICY IF EXISTS "Everyone can read reactions"            ON public.reactions;
DROP POLICY IF EXISTS "Authenticated users can create reactions" ON public.reactions;
DROP POLICY IF EXISTS "Authenticated users can update reactions" ON public.reactions;
DROP POLICY IF EXISTS "Authenticated users can delete reactions" ON public.reactions;

CREATE POLICY "Everyone can read reactions"             ON public.reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reactions" ON public.reactions FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'anon'));
CREATE POLICY "Authenticated users can update reactions" ON public.reactions FOR UPDATE
  USING (auth.role() IN ('authenticated', 'anon'));
CREATE POLICY "Authenticated users can delete reactions" ON public.reactions FOR DELETE
  USING (auth.role() IN ('authenticated', 'anon'));

-- boards
DROP POLICY IF EXISTS "Everyone can read boards"       ON public.boards;
DROP POLICY IF EXISTS "Only app_admin can create boards" ON public.boards;

CREATE POLICY "Everyone can read boards"        ON public.boards FOR SELECT USING (true);
CREATE POLICY "Only app_admin can create boards" ON public.boards FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admin));

-- groups
DROP POLICY IF EXISTS "Everyone can read groups"                   ON public.groups;
DROP POLICY IF EXISTS "Only app_admin can create groups as owner"  ON public.groups;

CREATE POLICY "Everyone can read groups"                  ON public.groups FOR SELECT USING (true);
CREATE POLICY "Only app_admin can create groups as owner" ON public.groups FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IN (SELECT user_id FROM public.app_admin) AND owner_id = (SELECT auth.uid()));

-- group_members
DROP POLICY IF EXISTS "Users can read own group_members"   ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups"              ON public.group_members;
DROP POLICY IF EXISTS "Users can update own group_members" ON public.group_members;

CREATE POLICY "Users can read own group_members"   ON public.group_members FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can join groups"              ON public.group_members FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own group_members" ON public.group_members FOR UPDATE
  USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- app_admin
DROP POLICY IF EXISTS "Users can read own app_admin row" ON public.app_admin;
CREATE POLICY "Users can read own app_admin row" ON public.app_admin FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- post_analysis
DROP POLICY IF EXISTS "post_analysis_select" ON public.post_analysis;
CREATE POLICY "post_analysis_select" ON public.post_analysis FOR SELECT USING (true);

-- user_reactions
DROP POLICY IF EXISTS "user_reactions_select" ON public.user_reactions;
DROP POLICY IF EXISTS "user_reactions_insert" ON public.user_reactions;
DROP POLICY IF EXISTS "user_reactions_delete" ON public.user_reactions;

CREATE POLICY "user_reactions_select" ON public.user_reactions FOR SELECT USING (true);
CREATE POLICY "user_reactions_insert" ON public.user_reactions FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "user_reactions_delete" ON public.user_reactions FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- 7. 권한
-- ----------------------------------------------------------------------------

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT                  ON SEQUENCES TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 8. Storage — post-images 버킷 (이미지 업로드)
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-images', 'post-images', true, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "anyone can read post images"               ON storage.objects;
DROP POLICY IF EXISTS "users can delete own post images"          ON storage.objects;

CREATE POLICY "authenticated users can upload post images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "anyone can read post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "users can delete own post images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
