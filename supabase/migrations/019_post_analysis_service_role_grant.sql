-- =============================================================================
-- 019_post_analysis_service_role_grant.sql — service_role에 post_analysis 쓰기 권한 부여
--
-- 배경:
--   003_grants.sql은 anon/authenticated에만 GRANT를 부여.
--   009_post_analysis.sql이 post_analysis 테이블 생성 후 SELECT 정책만 RLS에 추가.
--   Edge Function(analyze-post, analyze-post-on-demand)은 SUPABASE_SERVICE_ROLE_KEY로
--   post_analysis에 upsert하는데, service_role에 INSERT/UPDATE/DELETE 권한이 없어
--   "permission denied for table post_analysis" 오류 발생.
-- =============================================================================

-- post_analysis 테이블에 service_role 쓰기 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_analysis TO service_role;

-- 미래에 생성될 테이블에도 service_role 기본 권한 부여 (추후 테이블 추가 시 대비)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;
