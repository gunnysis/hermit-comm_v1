import { auth } from '@/features/auth/auth';
import { supabase } from '@/shared/lib/supabase';

jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    auth: {
      signInAnonymously: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
    },
  },
}));

describe('Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInAnonymously', () => {
    it('익명 로그인에 성공하면 사용자 정보를 반환한다', async () => {
      const mockUser = { id: 'anon-user-uuid', email: '' };
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      (supabase.auth.signInAnonymously as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await auth.signInAnonymously();

      expect(result.id).toBe('anon-user-uuid');
      expect(supabase.auth.signInAnonymously).toHaveBeenCalled();
    });

    it('기존 세션이 있으면 그 사용자를 반환한다', async () => {
      const mockUser = { id: 'existing-user-uuid', email: '' };
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null,
      });

      const result = await auth.signInAnonymously();

      expect(result.id).toBe('existing-user-uuid');
      expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled();
    });

    it('익명 로그인 실패 시 에러를 던진다', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      (supabase.auth.signInAnonymously as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Anonymous login failed' },
      });

      await expect(auth.signInAnonymously()).rejects.toEqual({
        message: 'Anonymous login failed',
      });
    });
  });
});
