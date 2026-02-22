import { supabase } from './supabase';
import { logger } from '@/shared/utils/logger';

const BUCKET = 'post-images';

/**
 * 이미지 URI를 Supabase Storage에 업로드하고 public URL을 반환합니다.
 * 버킷 'post-images'가 존재하고, 인증된 사용자 업로드·공개 읽기가 허용되어 있어야 합니다.
 */
export async function uploadPostImage(uri: string): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('인증이 필요합니다.');
  }

  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  const path = `${user.id}/${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType,
    upsert: false,
  });

  if (error) {
    logger.error('[uploadPostImage]', error.message);
    throw new Error('이미지 업로드에 실패했습니다.');
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return publicUrl;
}
