-- =============================================================================
-- 기존 DB 적용 여부 확인 (Supabase SQL Editor에서 실행)
-- 베이스라인 + 추가 마이그레이션의 핵심 객체 존재 여부를 조회합니다.
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

-- 뷰: security_invoker 확인
SELECT 'view' AS check,
       EXISTS (
         SELECT 1 FROM pg_class c
         JOIN pg_namespace n ON c.relnamespace = n.oid
         WHERE n.nspname = 'public' AND c.relname = 'posts_with_like_count'
           AND c.reloptions::text LIKE '%security_invoker=true%'
       ) AS security_invoker_ok;

-- RPC 함수 존재 (core_redesign + fix_group_members_recursion 포함)
SELECT 'functions' AS check,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_emotion_trend')                  AS get_emotion_trend_ok,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_recommended_posts_by_emotion')    AS get_recommended_posts_ok,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'toggle_reaction')                     AS toggle_reaction_ok,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_post_reactions')                  AS get_post_reactions_ok,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'soft_delete_post')                    AS soft_delete_post_ok,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'soft_delete_comment')                 AS soft_delete_comment_ok,
       EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'is_group_member')                     AS is_group_member_ok;

-- 트리거 존재
SELECT 'triggers' AS check,
       EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'analyze_post_on_insert' AND tgrelid = 'public.posts'::regclass)  AS analyze_trigger_ok,
       EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_daily_post_limit')                                     AS spam_trigger_ok;

-- 제약조건 (core_redesign 추가분)
SELECT 'constraints' AS check,
       EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_invite_code_unique')   AS invite_code_unique_ok,
       EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_title_length')          AS posts_title_length_ok,
       EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_content_length')        AS posts_content_length_ok,
       EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comments_content_length')     AS comments_content_length_ok,
       EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_name_length')          AS groups_name_length_ok,
       EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_description_length')   AS groups_description_length_ok;

-- Storage 버킷 (storage 스키마가 없으면 건너뜀)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    PERFORM 1 FROM storage.buckets WHERE id = 'post-images';
    RAISE NOTICE 'storage bucket post-images: %', CASE WHEN FOUND THEN 'OK' ELSE 'MISSING' END;
  ELSE
    RAISE NOTICE 'storage schema not found — skip bucket check';
  END IF;
END $$;

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
