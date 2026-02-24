import { supabase } from './supabase';
import { logger } from '@/shared/utils/logger';

const BUCKET = 'post-images';

/**
 * 이미지 URI를 Supabase Storage에 업로드하고 public URL을 반환합니다.
 * React Native의 FormData 파일 객체를 이용해 Storage REST API를 직접 호출합니다.
 */
export async function uploadPostImage(uri: string): Promise<string> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('인증이 필요합니다.');
  }

  const extMatch = uri.match(/\.([a-zA-Z0-9]+)(?:[?#].*)?$/);
  const rawExt = extMatch?.[1]?.toLowerCase() ?? 'jpg';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  const ext = rawExt in mimeMap ? rawExt : 'jpg';
  const contentType = mimeMap[ext];
  const path = `${session.user.id}/${Date.now()}.${ext}`;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const formData = new FormData();
  formData.append('', { uri, name: `upload.${ext}`, type: contentType } as unknown as Blob);

  const res = await fetch(`${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: supabaseAnonKey!,
      'x-upsert': 'false',
    },
    body: formData,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const json = await res.json();
      msg = json?.message ?? json?.error ?? msg;
    } catch {
      // JSON 응답이 아닐 수 있음 - msg는 statusText 유지
    }
    logger.error('[uploadPostImage]', msg);
    throw new Error(`이미지 업로드에 실패했습니다: ${msg}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}
