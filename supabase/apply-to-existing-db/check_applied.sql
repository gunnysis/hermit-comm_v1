-- =============================================================================
-- 기존 DB 적용 여부 확인 (Supabase SQL Editor에서 실행)
-- 각 마이그레이션에서 추가하는 대표 객체 존재 여부를 조회합니다.
-- =============================================================================

-- 001_schema
SELECT '001_schema' AS migration,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups')     AS groups_exists,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_admin')   AS app_admin_exists;

-- 002_rls (groups 정책 개수)
SELECT '002_rls' AS migration,
       (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'groups') AS groups_policy_count;

-- 003_grants (뷰 존재)
SELECT '003_grants' AS migration,
       EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'posts_with_like_count') AS view_exists;

-- 009_post_analysis
SELECT '009_post_analysis' AS migration,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_analysis') AS post_analysis_exists;

-- 010_image_attachment
SELECT '010_image_attachment' AS migration,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'image_url') AS image_url_exists;

-- 011_emotion_trend_rpc
SELECT '011_emotion_trend_rpc' AS migration,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_emotion_trend') AS get_emotion_trend_exists;

-- 012_group_delete_rls (groups DELETE 정책)
SELECT '012_group_delete_rls' AS migration,
       EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'groups' AND policyname = 'Only app_admin owner can delete own group') AS group_delete_policy_exists;

-- 013_fix_view_image_url (뷰에 image_url 컬럼 존재)
SELECT '013_fix_view_image_url' AS migration,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts_with_like_count' AND column_name = 'image_url') AS view_has_image_url;

-- 014_recommend_posts_by_emotion (RPC 존재)
SELECT '014_recommend_posts_by_emotion' AS migration,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_recommended_posts_by_emotion') AS rpc_exists;

-- 015_webhook_analyze_post_trigger (트리거 존재 — 016에서 제거되므로 false가 정상)
SELECT '015_webhook_analyze_post_trigger' AS migration,
       EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_analyze_post_on_insert' AND tgrelid = 'public.posts'::regclass) AS trigger_exists;

-- 016_analyze_post_trigger_auth (015 트리거 제거 여부: false=제거됨=정상)
SELECT '016_analyze_post_trigger_auth' AS migration,
       NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_analyze_post_on_insert' AND tgrelid = 'public.posts'::regclass) AS trigger_removed;

-- 017_storage_post_images (버킷 존재)
SELECT '017_storage_post_images' AS migration,
       EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'post-images') AS bucket_exists;

-- 018_posts_webhook_trigger (트리거 존재)
SELECT '018_posts_webhook_trigger' AS migration,
       EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'analyze_post_on_insert' AND tgrelid = 'public.posts'::regclass) AS trigger_exists;

-- 019_post_analysis_service_role_grant (service_role INSERT 권한 — has_table_privilege 사용)
SELECT '019_post_analysis_service_role_grant' AS migration,
       has_table_privilege('service_role', 'public.post_analysis', 'INSERT') AS service_role_can_insert;

-- 020_service_role_full_grant (020은 019 포함 전체 권한, 동일 확인)
SELECT '020_service_role_full_grant' AS migration,
       has_table_privilege('service_role', 'public.posts', 'INSERT') AS service_role_full_grant;

-- 021_user_reactions (테이블 존재)
SELECT '021_user_reactions' AS migration,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_reactions') AS user_reactions_exists;

-- 022_reactions_delete_policy (reactions DELETE 정책 존재)
SELECT '022_reactions_delete_policy' AS migration,
       EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reactions' AND policyname = 'Authenticated users can delete reactions') AS delete_policy_exists;
