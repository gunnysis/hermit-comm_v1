-- =============================================================================
-- 기존 DB 적용 여부 확인 (Supabase SQL Editor에서 실행)
-- 각 마이그레이션에서 추가·변경하는 대표 객체 존재 여부를 조회합니다.
-- =============================================================================

-- 001_schema: 핵심 테이블 존재 여부
SELECT '001_schema' AS migration,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups')     AS groups_ok,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_admin') AS app_admin_ok,
       EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_daily_post_limit')                               AS spam_trigger_ok;

-- 002_rls: RLS 정책 수
SELECT '002_rls' AS migration,
       (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'posts') AS posts_policy_count;

-- 003_grants: 뷰 존재
SELECT '003_grants' AS migration,
       EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'posts_with_like_count') AS view_ok;

-- 009_post_analysis: 테이블 존재
SELECT '009_post_analysis' AS migration,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_analysis') AS post_analysis_ok;

-- 010_image_attachment: 컬럼 존재
SELECT '010_image_attachment' AS migration,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'image_url') AS image_url_ok;

-- 011_emotion_trend_rpc: 함수 존재
SELECT '011_emotion_trend_rpc' AS migration,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_emotion_trend') AS fn_ok;

-- 012_group_delete_rls: board_id FK ON DELETE CASCADE (posts 테이블)
SELECT '012_group_delete_rls' AS migration,
       EXISTS (
         SELECT 1 FROM information_schema.referential_constraints rc
         JOIN information_schema.key_column_usage kcu ON rc.constraint_name = kcu.constraint_name
         WHERE kcu.table_schema = 'public' AND kcu.table_name = 'posts'
           AND kcu.column_name = 'board_id' AND rc.delete_rule = 'NO ACTION'
       ) IS FALSE AS board_id_cascade_ok;

-- 013_fix_view_image_url: 뷰에 image_url 컬럼
SELECT '013_fix_view_image_url' AS migration,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'posts_with_like_count' AND column_name = 'image_url') AS view_image_url_ok;

-- 014_recommend_posts_by_emotion: RPC 존재
SELECT '014_recommend_posts_by_emotion' AS migration,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_recommended_posts_by_emotion') AS rpc_ok;

-- 015: pg_net 트리거 (016에서 제거됨 → false가 정상)
-- 016_analyze_post_trigger_auth: notify 트리거 제거 확인 (false=제거=정상)
SELECT '015+016_trigger' AS migration,
       NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_analyze_post_on_insert') AS old_trigger_removed;

-- 017_storage_post_images: Storage 버킷
SELECT '017_storage_post_images' AS migration,
       EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'post-images') AS bucket_ok;

-- 018_posts_webhook_trigger: http_request 트리거
SELECT '018_posts_webhook_trigger' AS migration,
       EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'analyze_post_on_insert' AND tgrelid = 'public.posts'::regclass) AS trigger_ok;

-- 019+020_grants: service_role 권한
SELECT '019+020_service_role_grants' AS migration,
       has_table_privilege('service_role', 'public.post_analysis', 'INSERT') AS post_analysis_ok,
       has_table_privilege('service_role', 'public.posts', 'INSERT')         AS posts_ok;

-- 021_user_reactions: 테이블 존재
SELECT '021_user_reactions' AS migration,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_reactions') AS table_ok;

-- 022_reactions_delete_policy: DELETE 정책
SELECT '022_reactions_delete_policy' AS migration,
       EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reactions' AND policyname = 'Authenticated users can delete reactions') AS delete_policy_ok;

-- 023 + 20260301000000: 뷰 security_invoker 및 reaction_type='like'
SELECT '023+20260301_view_fix' AS migration,
       EXISTS (
         SELECT 1 FROM pg_class c
         JOIN pg_namespace n ON c.relnamespace = n.oid
         WHERE n.nspname = 'public' AND c.relname = 'posts_with_like_count'
           AND c.reloptions::text LIKE '%security_invoker=true%'
       ) AS security_invoker_ok,
       (
         SELECT definition LIKE '%reaction_type = ''like''%'
         FROM pg_views
         WHERE schemaname = 'public' AND viewname = 'posts_with_like_count'
       ) AS reaction_type_like_ok;
