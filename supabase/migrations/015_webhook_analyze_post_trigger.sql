-- =============================================================================
-- 015_webhook_analyze_post_trigger.sql — posts INSERT 시 analyze-post Edge Function 호출
--
-- CONSOLE_SETUP.md §4 (DB Webhook)과 동일 동작: 게시글 작성 시 자동으로 감정 분석 호출.
-- Dashboard에서 Webhook을 만들지 않아도 이 트리거로 동작함.
-- =============================================================================

-- pg_net 확장 (호스트 프로젝트에 이미 있을 수 있음)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 트리거 함수: Webhook 페이로드 형식으로 analyze-post 호출
CREATE OR REPLACE FUNCTION public.notify_analyze_post_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  functions_base_url text := 'https://qwrjebpsjjdxhhhllqcw.supabase.co';
  target_url text;
  payload jsonb;
BEGIN
  target_url := functions_base_url || '/functions/v1/analyze-post';
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', 'posts',
    'schema', 'public',
    'record', to_jsonb(NEW),
    'old_record', null
  );

  PERFORM net.http_post(
    url := target_url,
    body := payload,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 30000
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_analyze_post_on_insert() IS
  'posts INSERT 시 analyze-post Edge Function을 pg_net으로 호출. CONSOLE_SETUP §4 Webhook 대체.';

-- 기존 트리거가 있으면 제거 후 재생성 (멱등)
DROP TRIGGER IF EXISTS trigger_analyze_post_on_insert ON public.posts;

CREATE TRIGGER trigger_analyze_post_on_insert
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_analyze_post_on_insert();

COMMENT ON TRIGGER trigger_analyze_post_on_insert ON public.posts IS
  '게시글 작성 시 analyze-post Edge Function 자동 호출 (감정 분석).';
