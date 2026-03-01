-- =============================================================================
-- 20260301000003_infra.sql — 은둔마을 권한 및 Storage 베이스라인
--
-- public 스키마 권한(grants) + Storage 버킷·정책 정의.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. 권한 (grants)
-- ----------------------------------------------------------------------------

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT                  ON SEQUENCES TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Storage — post-images 버킷 (이미지 업로드)
-- ----------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-images', 'post-images', true, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "anyone can read post images"               ON storage.objects;
DROP POLICY IF EXISTS "users can delete own post images"          ON storage.objects;

CREATE POLICY "authenticated users can upload post images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "anyone can read post images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "users can delete own post images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);
