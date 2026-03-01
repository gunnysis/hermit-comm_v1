-- =============================================================================
-- 기존 DB 적용 여부 확인 (Supabase SQL Editor에서 실행)
-- 베이스라인(20260301000001_baseline.sql)의 핵심 객체 존재 여부를 조회합니다.
-- =============================================================================

-- 핵심 테이블 존재 여부
SELECT 'tables' AS check,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups')          AS groups_ok,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts')           AS posts_ok,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments')        AS comments_ok,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reactions')       AS reactions_ok,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_reactions')  AS user_reactions_ok,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_analysis')   AS post_analysis_ok,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_admin')       AS app_admin_ok;

-- 뷰: security_invoker + reaction_type='like'
SELECT 'view' AS check,
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

-- RPC 함수 존재
SELECT 'functions' AS check,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_emotion_trend')                  AS get_emotion_trend_ok,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_recommended_posts_by_emotion')    AS get_recommended_posts_ok;

-- 트리거 존재
SELECT 'triggers' AS check,
       EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'analyze_post_on_insert' AND tgrelid = 'public.posts'::regclass)  AS analyze_trigger_ok,
       EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_daily_post_limit')                                     AS spam_trigger_ok;

-- Storage 버킷
SELECT 'storage' AS check,
       EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'post-images') AS bucket_ok;

-- RLS 정책 수 (0이면 미적용)
SELECT 'rls_policy_count' AS check,
       (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'posts')         AS posts_policies,
       (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'comments')      AS comments_policies,
       (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'reactions')     AS reactions_policies,
       (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'groups')        AS groups_policies;

-- service_role 권한
SELECT 'service_role_grants' AS check,
       has_table_privilege('service_role', 'public.post_analysis', 'INSERT') AS post_analysis_ok,
       has_table_privilege('service_role', 'public.posts', 'INSERT')         AS posts_ok;
