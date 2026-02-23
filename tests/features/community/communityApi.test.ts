import {
  getBoards,
  getMyGroups,
  joinGroupByInviteCode,
  getGroupBoards,
  getBoardPosts,
  getGroupPosts,
  searchGroupPosts,
  leaveGroup,
} from '@/features/community/api/communityApi';
import { supabase } from '@/shared/lib/supabase';
import { APIError } from '@/shared/lib/api/error';

jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}));

jest.mock('@/shared/utils/sentryBreadcrumb', () => ({
  addBreadcrumb: jest.fn(),
}));

/** 완전한 메서드 체인을 가진 mock 객체를 반환 */
function makeMockChain() {
  const chain: Record<string, jest.Mock> = {};
  const self = () => chain;
  chain.select = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.range = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.or = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn();
  chain.maybeSingle = jest.fn();
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.delete = jest.fn().mockReturnValue(chain);
  return { chain, self };
}

describe('communityApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBoards', () => {
    it('보드 목록을 반환한다', async () => {
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      const mockBoards = [
        {
          id: 1,
          name: '공개 게시판',
          visibility: 'public',
          anon_mode: 'always_anon',
          created_at: '2025-01-01',
          updated_at: '2025-01-01',
        },
      ];
      chain.order.mockResolvedValue({ data: mockBoards, error: null });

      const result = await getBoards();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('공개 게시판');
    });

    it('에러 시 APIError를 던진다', async () => {
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.order.mockResolvedValue({ data: null, error: { message: 'DB 에러', code: '500' } });
      await expect(getBoards()).rejects.toBeInstanceOf(APIError);
    });
  });

  describe('getMyGroups', () => {
    it('사용자가 없으면 빈 배열을 반환한다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });
      const result = await getMyGroups();
      expect(result).toEqual([]);
    });

    it('소속 그룹 목록을 반환한다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      const mockData = [{ groups: { id: 1, name: '테스트 그룹', description: null } }];
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.eq.mockReturnValueOnce(chain).mockResolvedValue({ data: mockData, error: null });

      const result = await getMyGroups();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('테스트 그룹');
    });

    it('auth 에러 시 APIError를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth 에러' },
      });
      await expect(getMyGroups()).rejects.toBeInstanceOf(APIError);
    });
  });

  describe('joinGroupByInviteCode', () => {
    it('빈 코드는 APIError(400)를 던진다', async () => {
      await expect(joinGroupByInviteCode('')).rejects.toBeInstanceOf(APIError);
      await expect(joinGroupByInviteCode('  ')).rejects.toMatchObject({ status: 400 });
    });

    it('로그인이 안 되어 있으면 APIError(401)를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });
      await expect(joinGroupByInviteCode('TEST')).rejects.toMatchObject({ status: 401 });
    });

    it('존재하지 않는 코드는 APIError(404)를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });
      await expect(joinGroupByInviteCode('NOCODE')).rejects.toMatchObject({ status: 404 });
    });

    it('신규 멤버로 참여에 성공한다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 10, name: '테스트', description: null, invite_code: 'TEST' },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: null });
      chain.insert.mockResolvedValue({ error: null });

      const result = await joinGroupByInviteCode('TEST');
      expect(result.alreadyMember).toBe(false);
      expect(result.group.name).toBe('테스트');
    });

    it('이미 멤버인 경우 alreadyMember: true를 반환한다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.maybeSingle
        .mockResolvedValueOnce({
          data: { id: 10, name: '테스트', description: null, invite_code: 'TEST' },
          error: null,
        })
        .mockResolvedValueOnce({ data: { status: 'approved' }, error: null });

      const result = await joinGroupByInviteCode('TEST');
      expect(result.alreadyMember).toBe(true);
    });
  });

  describe('getGroupBoards', () => {
    it('그룹 보드 목록을 반환한다', async () => {
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.order.mockResolvedValue({ data: [{ id: 2, name: '그룹 게시판' }], error: null });
      const result = await getGroupBoards(1);
      expect(result).toHaveLength(1);
    });
  });

  describe('getBoardPosts', () => {
    it('게시글 목록을 반환한다', async () => {
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      const mockPosts = [
        {
          id: 1,
          title: '글',
          content: '내용',
          author: '익명',
          author_id: 'uid',
          created_at: '2025-01-01',
          is_anonymous: true,
          display_name: '따뜻한 고래 1',
        },
      ];
      chain.range.mockResolvedValue({ data: mockPosts, error: null });
      const result = await getBoardPosts(1);
      expect(result).toHaveLength(1);
    });

    it('에러 시 APIError를 던진다', async () => {
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.range.mockResolvedValue({ data: null, error: { message: '에러', code: '500' } });
      await expect(getBoardPosts(1)).rejects.toBeInstanceOf(APIError);
    });
  });

  describe('getGroupPosts', () => {
    it('그룹 게시글 목록을 반환한다', async () => {
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.range.mockResolvedValue({ data: [], error: null });
      const result = await getGroupPosts(1, 2);
      expect(result).toEqual([]);
    });

    it('에러 시 APIError를 던진다', async () => {
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.range.mockResolvedValue({ data: null, error: { message: '에러', code: '500' } });
      await expect(getGroupPosts(1, 2)).rejects.toBeInstanceOf(APIError);
    });
  });

  describe('searchGroupPosts', () => {
    it('빈 쿼리는 빈 배열을 반환한다', async () => {
      const result = await searchGroupPosts(1, 2, '');
      expect(result).toEqual([]);
    });

    it('검색 결과를 반환한다', async () => {
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.range.mockResolvedValue({ data: [{ id: 1 }], error: null });
      const result = await searchGroupPosts(1, 2, '검색어');
      expect(result).toHaveLength(1);
    });

    it('에러 시 APIError를 던진다', async () => {
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.range.mockResolvedValue({ data: null, error: { message: '에러', code: '500' } });
      await expect(searchGroupPosts(1, 2, '검색어')).rejects.toBeInstanceOf(APIError);
    });
  });

  describe('leaveGroup', () => {
    it('로그인이 안 되어 있으면 APIError(401)를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });
      await expect(leaveGroup(1)).rejects.toMatchObject({ status: 401 });
    });

    it('그룹 탈퇴에 성공한다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.eq.mockReturnValueOnce(chain).mockResolvedValue({ error: null });
      await expect(leaveGroup(1)).resolves.toBeUndefined();
    });

    it('에러 시 APIError를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      });
      const { chain } = makeMockChain();
      (supabase.from as jest.Mock).mockReturnValue(chain);
      chain.eq
        .mockReturnValueOnce(chain)
        .mockResolvedValue({ error: { message: '에러', code: '500' } });
      await expect(leaveGroup(1)).rejects.toBeInstanceOf(APIError);
    });
  });
});
