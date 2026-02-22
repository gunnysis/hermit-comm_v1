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
