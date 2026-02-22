import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { auth } from '../auth';
import { supabase } from '@/shared/lib/supabase';
import { logger } from '@/shared/utils/logger';

/**
 * 인증 상태 관리 훅
 *
 * 앱 시작 시 자동으로 익명 로그인을 수행하고
 * 사용자 인증 상태를 관리합니다.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const initAuth = async () => {
      try {
        logger.log('[useAuth] 인증 초기화 시작');

        // 1. 기존 세션 확인
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user && mounted) {
          logger.log('[useAuth] 기존 세션 발견:', sessionData.session.user.id);
          setUser(sessionData.session.user);
          setLoading(false);
          return;
        }

        // 2. 새 익명 세션 생성
        const user = await auth.signInAnonymously();
        if (mounted) {
          setUser(user);
          setError(null);
          logger.log('[useAuth] 인증 초기화 완료:', user.id);
        }
      } catch (err) {
        logger.error('[useAuth] 인증 초기화 실패:', err);

        if (mounted && retryCount < MAX_RETRIES) {
          retryCount++;
          logger.log(`[useAuth] 재시도 ${retryCount}/${MAX_RETRIES}`);
          setTimeout(() => initAuth(), 1000 * retryCount);
        } else if (mounted) {
          setError('인증에 실패했습니다. 앱을 재시작해주세요.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // 인증 상태 변화 감지 (무한 루프 방지)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      logger.log('[useAuth] 인증 상태 변경:', event);

      if (!mounted) return;

      // SIGNED_IN 또는 TOKEN_REFRESHED만 처리
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // 클린업
    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []); // 빈 의존성 배열 - 한 번만 실행

  return { user, loading, error };
}
