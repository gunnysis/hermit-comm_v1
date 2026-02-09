import { api } from './api';
import { supabase } from './supabase';

// Supabase 클라이언트 모킹
jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('게시글 목록을 조회할 수 있다', async () => {
      const mockPosts = [
        {
          id: 1,
          title: '테스트 게시글',
          content: '내용',
          author: '작성자',
          author_id: 'uuid-1',
          created_at: '2025-01-01T00:00:00.000Z',
          comments: [{ count: 5 }],
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockPosts,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await api.getPosts(20, 0, 'latest');

      expect(supabase.from).toHaveBeenCalledWith('posts');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.order).toHaveBeenCalled();
      expect(mockQuery.range).toHaveBeenCalledWith(0, 19);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('에러 발생 시 APIError를 throw한다', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      await expect(api.getPosts()).rejects.toThrow('Database error');
    });
  });

  describe('createPost', () => {
    it('인증된 사용자만 게시글을 생성할 수 있다', async () => {
      const mockUser = { id: 'user-uuid' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 1,
            title: '새 게시글',
            content: '내용',
            author: '작성자',
            author_id: 'user-uuid',
            created_at: '2025-01-01T00:00:00.000Z',
          },
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await api.createPost({
        title: '새 게시글',
        content: '내용',
        author: '작성자',
      });

      expect(result.id).toBe(1);
      expect(result.author_id).toBe('user-uuid');
    });

    it('인증되지 않은 경우 401 에러를 throw한다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
      });

      await expect(
        api.createPost({ title: '제목', content: '내용', author: '작성자' })
      ).rejects.toThrow('인증이 필요합니다.');
    });
  });

  describe('healthCheck', () => {
    it('Supabase 연결이 정상이면 ok를 반환한다', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await api.healthCheck();

      expect(result.status).toBe('ok');
    });

    it('Supabase 연결 실패 시 error를 반환한다', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection failed' },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQuery);

      const result = await api.healthCheck();

      expect(result.status).toBe('error');
    });
  });
});
