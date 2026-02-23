-- =============================================================================
-- 020_service_role_full_grant.sql — service_role에 public 스키마 전체 권한 부여
--
-- 배경:
--   019에서 post_analysis 테이블 GRANT만 추가했으나,
--   BIGSERIAL 시퀀스(post_analysis_id_seq)에 USAGE/SELECT 권한도 필요.
--   포괄적으로 public 스키마 전체를 service_role에 허용하여 재발 방지.
-- =============================================================================

-- 현재 존재하는 모든 테이블
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;

-- 현재 존재하는 모든 시퀀스
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
