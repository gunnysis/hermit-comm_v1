import { auth } from './auth';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({
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

    it('익명 로그인 실패 시 에러를 throw한다', async () => {
      const mockError = { message: 'Anonymous login failed' };
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      (supabase.auth.signInAnonymously as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      await expect(auth.signInAnonymously()).rejects.toEqual(mockError);
    });

    it('사용자 정보가 없으면 에러를 throw한다', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      (supabase.auth.signInAnonymously as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(auth.signInAnonymously()).rejects.toThrow(
        '익명 로그인 성공했으나 사용자 정보가 없습니다.'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('현재 사용자 정보를 반환한다', async () => {
      const mockUser = { id: 'current-user-uuid', email: 'user@example.com' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });

      const result = await auth.getCurrentUser();

      expect(result?.id).toBe('current-user-uuid');
    });

    it('사용자가 없으면 null을 반환한다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      const result = await auth.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});
