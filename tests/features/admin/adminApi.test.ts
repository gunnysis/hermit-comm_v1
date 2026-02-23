import {
  createGroupWithBoard,
  getMyManagedGroups,
  deleteGroup,
} from '@/features/admin/api/adminApi';
import { supabase } from '@/shared/lib/supabase';
import { APIError } from '@/shared/lib/api/error';

jest.mock('@/shared/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { getUser: jest.fn() },
  },
}));

const mockChain = () => {
  const chain: Record<string, jest.Mock> = {};
  chain.select = jest.fn().mockReturnValue(chain);
  chain.order = jest.fn().mockReturnValue(chain);
  chain.eq = jest.fn().mockReturnValue(chain);
  chain.single = jest.fn();
  chain.maybeSingle = jest.fn();
  chain.insert = jest.fn().mockReturnValue(chain);
  chain.update = jest.fn().mockReturnValue(chain);
  chain.delete = jest.fn().mockReturnValue(chain);
  return chain;
};

describe('adminApi', () => {
  let chain: ReturnType<typeof mockChain>;

  beforeEach(() => {
    jest.clearAllMocks();
    chain = mockChain();
    (supabase.from as jest.Mock).mockReturnValue(chain);
  });

  describe('createGroupWithBoard', () => {
    it('로그인이 안 되어 있으면 APIError(401)를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });
      await expect(
        createGroupWithBoard({ name: '그룹', inviteCode: 'CODE' }),
      ).rejects.toMatchObject({ status: 401 });
    });

    it('그룹명이 없으면 APIError(400)를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
      await expect(createGroupWithBoard({ name: '  ', inviteCode: 'CODE' })).rejects.toMatchObject({
        status: 400,
      });
    });

    it('초대 코드가 없으면 APIError(400)를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
      await expect(createGroupWithBoard({ name: '그룹명', inviteCode: '' })).rejects.toMatchObject({
        status: 400,
      });
    });

    it('그룹·보드·멤버를 성공적으로 생성한다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
      chain.single.mockResolvedValue({ data: { id: 5 }, error: null });
      // 첫 번째 insert는 .select().single() 체인을 위해 chain을 반환, 이후는 직접 resolve
      chain.insert.mockReturnValueOnce(chain).mockResolvedValue({ error: null });

      const result = await createGroupWithBoard({ name: '새 그룹', inviteCode: 'NEWCODE' });
      expect(result.groupId).toBe(5);
      expect(result.inviteCode).toBe('NEWCODE');
    });

    it('groups INSERT 에러 시 APIError를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
      chain.single.mockResolvedValue({ data: null, error: { message: 'DB 에러', code: '23505' } });
      await expect(
        createGroupWithBoard({ name: '그룹', inviteCode: 'CODE' }),
      ).rejects.toBeInstanceOf(APIError);
    });
  });

  describe('getMyManagedGroups', () => {
    it('로그인이 안 되어 있으면 빈 배열을 반환한다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });
      const result = await getMyManagedGroups();
      expect(result).toEqual([]);
    });

    it('관리 그룹 목록을 반환한다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
      const mockGroups = [
        {
          id: 1,
          name: '내 그룹',
          description: null,
          invite_code: 'CODE1',
          created_at: '2025-01-01',
        },
      ];
      chain.order.mockResolvedValue({ data: mockGroups, error: null });

      const result = await getMyManagedGroups();
      expect(result).toHaveLength(1);
      expect(result[0].invite_code).toBe('CODE1');
    });

    it('에러 시 APIError를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
      chain.order.mockResolvedValue({ data: null, error: { message: 'DB 에러', code: '500' } });
      await expect(getMyManagedGroups()).rejects.toBeInstanceOf(APIError);
    });
  });

  describe('deleteGroup', () => {
    it('로그인이 안 되어 있으면 APIError(401)를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });
      await expect(deleteGroup(1)).rejects.toMatchObject({ status: 401 });
    });

    it('존재하지 않는 그룹은 APIError(404)를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
      chain.maybeSingle.mockResolvedValue({ data: null, error: null });
      await expect(deleteGroup(999)).rejects.toMatchObject({ status: 404 });
    });

    it('그룹 삭제에 성공한다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
      chain.maybeSingle.mockResolvedValue({ data: { id: 1 }, error: null });
      await expect(deleteGroup(1)).resolves.toBeUndefined();
    });

    it('DB 에러 시 APIError를 던진다', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'admin-1' } },
        error: null,
      });
      chain.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB 에러', code: '500' },
      });
      await expect(deleteGroup(1)).rejects.toBeInstanceOf(APIError);
    });
  });
});
