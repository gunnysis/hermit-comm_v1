-- 사용자별 반응 추적 테이블 (연타 방지·취소 기능용)
-- reactions 테이블은 집계 카운트 유지, user_reactions는 개인 반응 기록
CREATE TABLE IF NOT EXISTS user_reactions (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id       BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, post_id, reaction_type)
);

ALTER TABLE user_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_reactions_select"
  ON user_reactions FOR SELECT USING (true);

CREATE POLICY "user_reactions_insert"
  ON user_reactions FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "user_reactions_delete"
  ON user_reactions FOR DELETE USING ((SELECT auth.uid()) = user_id);

GRANT SELECT, INSERT, DELETE ON user_reactions TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_reactions_id_seq TO anon, authenticated;
