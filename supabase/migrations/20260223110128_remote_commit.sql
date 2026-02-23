drop policy "Only app_admin owner can delete own group" on "public"."groups";

revoke references on table "public"."app_admin" from "anon";

revoke trigger on table "public"."app_admin" from "anon";

revoke truncate on table "public"."app_admin" from "anon";

revoke references on table "public"."app_admin" from "authenticated";

revoke trigger on table "public"."app_admin" from "authenticated";

revoke truncate on table "public"."app_admin" from "authenticated";

revoke delete on table "public"."app_admin" from "service_role";

revoke insert on table "public"."app_admin" from "service_role";

revoke references on table "public"."app_admin" from "service_role";

revoke select on table "public"."app_admin" from "service_role";

revoke trigger on table "public"."app_admin" from "service_role";

revoke truncate on table "public"."app_admin" from "service_role";

revoke update on table "public"."app_admin" from "service_role";

revoke references on table "public"."boards" from "anon";

revoke trigger on table "public"."boards" from "anon";

revoke truncate on table "public"."boards" from "anon";

revoke references on table "public"."boards" from "authenticated";

revoke trigger on table "public"."boards" from "authenticated";

revoke truncate on table "public"."boards" from "authenticated";

revoke delete on table "public"."boards" from "service_role";

revoke insert on table "public"."boards" from "service_role";

revoke references on table "public"."boards" from "service_role";

revoke select on table "public"."boards" from "service_role";

revoke trigger on table "public"."boards" from "service_role";

revoke truncate on table "public"."boards" from "service_role";

revoke update on table "public"."boards" from "service_role";

revoke references on table "public"."comments" from "anon";

revoke trigger on table "public"."comments" from "anon";

revoke truncate on table "public"."comments" from "anon";

revoke references on table "public"."comments" from "authenticated";

revoke trigger on table "public"."comments" from "authenticated";

revoke truncate on table "public"."comments" from "authenticated";

revoke delete on table "public"."comments" from "service_role";

revoke insert on table "public"."comments" from "service_role";

revoke references on table "public"."comments" from "service_role";

revoke select on table "public"."comments" from "service_role";

revoke trigger on table "public"."comments" from "service_role";

revoke truncate on table "public"."comments" from "service_role";

revoke update on table "public"."comments" from "service_role";

revoke references on table "public"."group_members" from "anon";

revoke trigger on table "public"."group_members" from "anon";

revoke truncate on table "public"."group_members" from "anon";

revoke references on table "public"."group_members" from "authenticated";

revoke trigger on table "public"."group_members" from "authenticated";

revoke truncate on table "public"."group_members" from "authenticated";

revoke delete on table "public"."group_members" from "service_role";

revoke insert on table "public"."group_members" from "service_role";

revoke references on table "public"."group_members" from "service_role";

revoke select on table "public"."group_members" from "service_role";

revoke trigger on table "public"."group_members" from "service_role";

revoke truncate on table "public"."group_members" from "service_role";

revoke update on table "public"."group_members" from "service_role";

revoke references on table "public"."groups" from "anon";

revoke trigger on table "public"."groups" from "anon";

revoke truncate on table "public"."groups" from "anon";

revoke references on table "public"."groups" from "authenticated";

revoke trigger on table "public"."groups" from "authenticated";

revoke truncate on table "public"."groups" from "authenticated";

revoke delete on table "public"."groups" from "service_role";

revoke insert on table "public"."groups" from "service_role";

revoke references on table "public"."groups" from "service_role";

revoke select on table "public"."groups" from "service_role";

revoke trigger on table "public"."groups" from "service_role";

revoke truncate on table "public"."groups" from "service_role";

revoke update on table "public"."groups" from "service_role";

revoke references on table "public"."post_analysis" from "anon";

revoke trigger on table "public"."post_analysis" from "anon";

revoke truncate on table "public"."post_analysis" from "anon";

revoke references on table "public"."post_analysis" from "authenticated";

revoke trigger on table "public"."post_analysis" from "authenticated";

revoke truncate on table "public"."post_analysis" from "authenticated";

revoke delete on table "public"."post_analysis" from "service_role";

revoke insert on table "public"."post_analysis" from "service_role";

revoke references on table "public"."post_analysis" from "service_role";

revoke select on table "public"."post_analysis" from "service_role";

revoke trigger on table "public"."post_analysis" from "service_role";

revoke truncate on table "public"."post_analysis" from "service_role";

revoke update on table "public"."post_analysis" from "service_role";

revoke references on table "public"."posts" from "anon";

revoke trigger on table "public"."posts" from "anon";

revoke truncate on table "public"."posts" from "anon";

revoke references on table "public"."posts" from "authenticated";

revoke trigger on table "public"."posts" from "authenticated";

revoke truncate on table "public"."posts" from "authenticated";

revoke delete on table "public"."posts" from "service_role";

revoke insert on table "public"."posts" from "service_role";

revoke references on table "public"."posts" from "service_role";

revoke select on table "public"."posts" from "service_role";

revoke trigger on table "public"."posts" from "service_role";

revoke truncate on table "public"."posts" from "service_role";

revoke update on table "public"."posts" from "service_role";

revoke references on table "public"."reactions" from "anon";

revoke trigger on table "public"."reactions" from "anon";

revoke truncate on table "public"."reactions" from "anon";

revoke references on table "public"."reactions" from "authenticated";

revoke trigger on table "public"."reactions" from "authenticated";

revoke truncate on table "public"."reactions" from "authenticated";

revoke delete on table "public"."reactions" from "service_role";

revoke insert on table "public"."reactions" from "service_role";

revoke references on table "public"."reactions" from "service_role";

revoke select on table "public"."reactions" from "service_role";

revoke trigger on table "public"."reactions" from "service_role";

revoke truncate on table "public"."reactions" from "service_role";

revoke update on table "public"."reactions" from "service_role";

alter table "public"."comments" drop constraint "comments_board_id_fkey";

alter table "public"."posts" drop constraint "posts_board_id_fkey";

drop view if exists "public"."posts_with_like_count";

alter table "public"."comments" add constraint "comments_board_id_fkey" FOREIGN KEY (board_id) REFERENCES public.boards(id) not valid;

alter table "public"."comments" validate constraint "comments_board_id_fkey";

alter table "public"."posts" add constraint "posts_board_id_fkey" FOREIGN KEY (board_id) REFERENCES public.boards(id) not valid;

alter table "public"."posts" validate constraint "posts_board_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_daily_comment_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_daily_post_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_orphan_group_members(days_inactive integer DEFAULT 180)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  deleted_count integer;
  safe_days integer;
BEGIN
  -- 1일 미만·NULL·음수 방지 (의도치 않은 대량 삭제 방지)
  safe_days := GREATEST(COALESCE(NULLIF(days_inactive, 0), 180), 1);

  DELETE FROM public.group_members
  WHERE user_id IN (
    SELECT id FROM auth.users
    WHERE is_anonymous = true
      AND (last_sign_in_at IS NULL OR last_sign_in_at < (now() - (safe_days || ' days')::interval))
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'cleanup_orphan_group_members: deleted % rows (days_inactive=%)', deleted_count, safe_days;
  RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_emotion_trend(days integer DEFAULT 7)
 RETURNS TABLE(emotion text, cnt bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    unnest(pa.emotions) AS emotion,
    COUNT(*)::BIGINT AS cnt
  FROM post_analysis pa
  WHERE pa.analyzed_at >= (now() - (days || ' days')::interval)
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT 5;
END;
$function$
;

create or replace view "public"."posts_with_like_count" as  SELECT p.id,
    p.title,
    p.content,
    p.author,
    p.author_id,
    p.created_at,
    p.board_id,
    p.group_id,
    p.is_anonymous,
    p.display_name,
    p.member_id,
    p.image_url,
    (COALESCE(( SELECT sum(r.count) AS sum
           FROM public.reactions r
          WHERE ((r.post_id = p.id) AND (r.reaction_type = 'like'::text))), (0)::bigint))::integer AS like_count,
    ( SELECT (count(*))::integer AS count
           FROM public.comments c
          WHERE ((c.post_id = p.id) AND (c.deleted_at IS NULL))) AS comment_count,
    pa.emotions
   FROM (public.posts p
     LEFT JOIN public.post_analysis pa ON ((pa.post_id = p.id)))
  WHERE (p.deleted_at IS NULL);


CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  new.updated_at := now();
  RETURN new;
END;
$function$
;

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


