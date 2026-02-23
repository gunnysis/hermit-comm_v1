-- =============================================================================
-- 014_recommend_posts_by_emotion.sql — 감정 기반 비슷한 글 추천 RPC
--
-- 용도: 글 상세/목록에서 "이런 감정의 다른 글" 추천.
--       post_analysis.emotions 배열이 겹치는 다른 글을 일치 개수·인기순으로 반환.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_recommended_posts_by_emotion(
  p_post_id BIGINT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  id BIGINT,
  title TEXT,
  board_id BIGINT,
  like_count INT,
  comment_count INT,
  emotions TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_emotions TEXT[];
BEGIN
  -- 해당 글의 감정 배열 조회 (없으면 빈 배열)
  SELECT COALESCE(pa.emotions, '{}')
    INTO v_emotions
    FROM post_analysis pa
   WHERE pa.post_id = p_post_id;

  -- 감정이 없으면 빈 결과 반환
  IF array_length(v_emotions, 1) IS NULL OR array_length(v_emotions, 1) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v.id,
    v.title,
    v.board_id,
    v.like_count,
    v.comment_count,
    v.emotions,
    v.created_at
  FROM posts_with_like_count v
  WHERE v.id != p_post_id
    AND v.emotions IS NOT NULL
    AND v.emotions && v_emotions  -- 배열 겹침
  ORDER BY
    (SELECT COUNT(*) FROM unnest(v.emotions) e WHERE e = ANY(v_emotions)) DESC,  -- 일치 감정 수
    v.like_count DESC,
    v.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_recommended_posts_by_emotion(bigint, integer) IS
  '지정한 글과 감정이 겹치는 다른 글을 일치 수·좋아요·최신순으로 반환. 추천 목록용.';
