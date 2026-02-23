-- =============================================================================
-- 016_analyze_post_trigger_auth.sql — 트리거 제거, Webhook 사용 권장
--
-- pg_net으로 Edge Function을 호출할 때 Authorization 헤더가 필요하나, DB 트리거에서
-- 시크릿을 안전히 보관할 방법이 제한적입니다(Vault 확장 미제공 등).
-- 따라서 트리거를 제거하고, Supabase Dashboard의 Database Webhook을 사용하세요.
-- Dashboard Webhook은 인증을 자동 처리합니다.
--
-- 적용 후 필수: Dashboard → Database → Webhooks → Create hook
--   Table: posts, Events: Insert, Type: Supabase Edge Functions, Function: analyze-post
-- =============================================================================

DROP TRIGGER IF EXISTS trigger_analyze_post_on_insert ON public.posts;
DROP FUNCTION IF EXISTS public.notify_analyze_post_on_insert();

COMMENT ON TABLE public.posts IS
  '게시글. 감정 분석 자동 호출은 Database Webhooks(posts INSERT → analyze-post)로 설정하세요.';
