-- =============================================================================
-- 013_fix_view_image_url.sql — posts_with_like_count 뷰에 image_url 추가
--
-- 배경:
--   009_post_analysis.sql에서 뷰를 재생성할 때 image_url 컬럼을 포함하지 않음.
--   010_image_attachment.sql이 posts 테이블에 image_url을 추가했지만 뷰는 갱신되지 않아
--   목록 조회(communityApi.getBoardPosts, getPosts popular 정렬) 시 image_url이 누락됨.
-- =============================================================================

DROP VIEW IF EXISTS posts_with_like_count;
CREATE VIEW posts_with_like_count AS
SELECT
  p.id, p.title, p.content, p.author, p.author_id, p.created_at,
  p.board_id, p.group_id, p.is_anonymous, p.display_name, p.member_id,
  p.image_url,
  COALESCE(
    (SELECT SUM(r.count) FROM reactions r
     WHERE r.post_id = p.id AND r.reaction_type = 'like'), 0
  )::INT AS like_count,
  (SELECT COUNT(*)::INT FROM comments c
   WHERE c.post_id = p.id AND c.deleted_at IS NULL) AS comment_count,
  pa.emotions AS emotions
FROM posts p
LEFT JOIN post_analysis pa ON pa.post_id = p.id
WHERE p.deleted_at IS NULL;
