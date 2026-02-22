-- =============================================================================
-- 011_emotion_trend_rpc.sql — 최근 N일 감정 집계 RPC
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_emotion_trend(days INT DEFAULT 7)
RETURNS TABLE(emotion TEXT, cnt BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

COMMENT ON FUNCTION public.get_emotion_trend(integer) IS
  '최근 N일간 post_analysis에서 감정별 빈도를 집계해 상위 5개 반환. 기본 7일.';
