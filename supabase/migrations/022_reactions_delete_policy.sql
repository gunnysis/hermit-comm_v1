-- reactions 테이블 DELETE RLS 정책 추가
-- toggleReaction에서 count=0 시 행 삭제에 필요
CREATE POLICY "Authenticated users can delete reactions"
  ON reactions FOR DELETE USING (auth.role() IN ('authenticated', 'anon'));
