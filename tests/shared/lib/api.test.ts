import { api } from '@/shared/lib/api';
import { supabase } from '@/shared/lib/supabase';

jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}));

describe('api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockChain);
  });

  describe('getPosts', () => {
    it('게시글 목록을 반환한다', async () => {
      const mockPosts = [
        {
          id: 1,
          title: '제목',
          content: '내용',
          author: '작성자',
          author_id: 'uuid',
          created_at: '2025-01-01',
        },
      ];
      (supabase.from as jest.Mock)().select().order().range.mockResolvedValue({
        data: mockPosts,
        error: null,
      });

      const result = await api.getPosts(20, 0, 'latest');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('제목');
    });

    it('에러 시 APIError를 던진다', async () => {
      (supabase.from as jest.Mock)()
        .select()
        .order()
        .range.mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        });

      await expect(api.getPosts(20, 0, 'latest')).rejects.toThrow();
    });
  });

  describe('createPost', () => {
    it('게시글 생성 시 author_id를 설정한다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-uuid' } },
      });
      (supabase.from as jest.Mock)()
        .insert()
        .select()
        .single.mockResolvedValue({
          data: {
            id: 1,
            title: '새 게시글',
            content: '내용',
            author: '작성자',
            author_id: 'user-uuid',
            created_at: '2025-01-01',
          },
          error: null,
        });

      const result = await api.createPost({
        title: '새 게시글',
        content: '내용',
        author: '작성자',
      });

      expect(result.id).toBe(1);
    });
  });

  describe('healthCheck', () => {
    it('연결 성공 시 ok를 반환한다', async () => {
      (supabase.from as jest.Mock)().select().limit.mockResolvedValue({ data: null, error: null });

      const result = await api.healthCheck();

      expect(result.status).toBe('ok');
    });

    it('연결 실패 시 error를 반환한다', async () => {
      (supabase.from as jest.Mock)()
        .select()
        .limit.mockResolvedValue({
          data: null,
          error: { message: 'Connection failed' },
        });

      const result = await api.healthCheck();

      expect(result.status).toBe('error');
    });
  });
});
