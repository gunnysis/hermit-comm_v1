-- post-images 버킷 생성 (public 읽기)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  52428800,  -- 50MiB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 인증된 사용자: 본인 폴더에만 업로드
CREATE POLICY "authenticated users can upload post images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 모든 사용자: 읽기 허용
CREATE POLICY "anyone can read post images"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- 본인 이미지 삭제 허용
CREATE POLICY "users can delete own post images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
