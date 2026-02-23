-- =============================================================================
-- 018_posts_webhook_trigger.sql — posts INSERT 시 analyze-post Edge Function 호출 트리거
--
-- 배경:
--   016_analyze_post_trigger_auth.sql에서 pg_net 기반 트리거가 제거되었으나,
--   Dashboard Webhook(수동 설정)이 누락된 경우 자동 감정 분석이 동작하지 않음.
--   analyze-post 함수가 verify_jwt=false로 배포되어 있으므로,
--   Authorization 헤더 없이 supabase_functions.http_request를 통해 안전하게 호출 가능.
--
-- 대체: Dashboard → Database → Webhooks에 이미 설정된 경우 이 트리거와 중복될 수 있음.
--       Dashboard Webhook을 먼저 확인하고, 없는 경우에만 적용.
-- =============================================================================

CREATE OR REPLACE TRIGGER "analyze_post_on_insert"
  AFTER INSERT ON "public"."posts"
  FOR EACH ROW
  EXECUTE FUNCTION "supabase_functions"."http_request"(
    'https://qwrjebpsjjdxhhhllqcw.supabase.co/functions/v1/analyze-post',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );
