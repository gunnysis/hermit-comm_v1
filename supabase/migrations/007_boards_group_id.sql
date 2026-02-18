-- =============================================================================
-- 007_boards_group_id.sql — boards에 group_id 추가 (그룹 전용 게시판용)
-- =============================================================================

ALTER TABLE boards
  ADD COLUMN IF NOT EXISTS group_id BIGINT REFERENCES groups(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_boards_group_id ON boards(group_id);
