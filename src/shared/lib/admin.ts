import { supabase } from '@/shared/lib/supabase';

/**
 * 현재 사용자가 app_admin 테이블에 등록되어 있는지 조회
 * (관리자 페이지 진입·UI 노출용. DB 권한은 app_admin RLS로 제한)
 */
export async function checkAppAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('app_admin')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[admin] app_admin 조회 에러:', error);
    return false;
  }

  return data != null;
}
