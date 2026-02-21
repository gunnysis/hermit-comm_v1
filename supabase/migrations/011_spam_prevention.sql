-- =============================================================================
-- 011_spam_prevention.sql — 스팸 방지 트리거
-- - 일일 게시글 작성 제한 (50건/일)
-- - 일일 댓글 작성 제한 (100건/일)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. 일일 게시글 제한 함수 (사용자당 하루 50건)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_daily_post_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  daily_count INT;
BEGIN
  SELECT COUNT(*) INTO daily_count
  FROM public.posts
  WHERE author_id = NEW.author_id
    AND created_at > now() - interval '1 day';

  IF daily_count >= 50 THEN
    RAISE EXCEPTION '일일 게시글 작성 한도(50건)를 초과했습니다.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_daily_post_limit') THEN
    CREATE TRIGGER trg_check_daily_post_limit
      BEFORE INSERT ON posts
      FOR EACH ROW EXECUTE FUNCTION public.check_daily_post_limit();
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. 일일 댓글 제한 함수 (사용자당 하루 100건)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.check_daily_comment_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  daily_count INT;
BEGIN
  SELECT COUNT(*) INTO daily_count
  FROM public.comments
  WHERE author_id = NEW.author_id
    AND created_at > now() - interval '1 day';

  IF daily_count >= 100 THEN
    RAISE EXCEPTION '일일 댓글 작성 한도(100건)를 초과했습니다.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_daily_comment_limit') THEN
    CREATE TRIGGER trg_check_daily_comment_limit
      BEFORE INSERT ON comments
      FOR EACH ROW EXECUTE FUNCTION public.check_daily_comment_limit();
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. 일일 제한 트리거 쿼리 최적화용 복합 인덱스 (author_id + created_at)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_posts_author_id_created_at
  ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author_id_created_at
  ON comments(author_id, created_at DESC);
