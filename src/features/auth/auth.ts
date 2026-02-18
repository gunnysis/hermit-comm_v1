import { supabase } from '@/shared/lib/supabase';
import { User } from '@supabase/supabase-js';

/**
 * Supabase 익명 인증 레이어
 *
 * 앱의 익명 커뮤니티 컨셉을 유지하면서도
 * 각 사용자에게 고유한 UUID를 부여하여 작성자 식별 가능
 */
export const auth = {
  /**
   * 익명 로그인
   * 앱 시작 시 자동으로 호출되어 사용자에게 고유 UUID 부여
   */
  signInAnonymously: async (): Promise<User> => {
    console.log('[Auth] 익명 로그인 시도');

    // 기존 세션이 있는지 확인
    const { data: sessionData } = await supabase.auth.getSession();

    if (sessionData.session?.user) {
      console.log('[Auth] 기존 세션 발견:', sessionData.session.user.id);
      return sessionData.session.user;
    }

    // 새로운 익명 세션 생성
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      console.error('[Auth] 익명 로그인 실패:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('익명 로그인 성공했으나 사용자 정보가 없습니다.');
    }

    console.log('[Auth] 익명 로그인 성공:', data.user.id);
    return data.user;
  },

  /**
   * 이메일/비밀번호 로그인 (관리자 로그인용)
   * 세션이 있으면 해당 사용자로 교체됨.
   */
  signInWithPassword: async (email: string, password: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[Auth] 이메일 로그인 실패:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('로그인 성공했으나 사용자 정보가 없습니다.');
    }

    return data.user;
  },

  /**
   * 현재 사용자 정보 조회
   */
  getCurrentUser: async (): Promise<User | null> => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('[Auth] 사용자 정보 조회 실패:', error);
      return null;
    }

    return data.user;
  },

  /**
   * 현재 세션 조회
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[Auth] 세션 조회 실패:', error);
      return null;
    }

    return data.session;
  },

  /**
   * 로그아웃 (테스트용)
   * 주의: 익명 사용자를 로그아웃하면 새로운 UUID가 부여되어
   * 기존에 작성한 게시글을 삭제할 수 없게 됩니다.
   */
  signOut: async (): Promise<void> => {
    console.log('[Auth] 로그아웃');
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth] 로그아웃 실패:', error);
      throw error;
    }
  },
};
