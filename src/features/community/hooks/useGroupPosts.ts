import { useQuery } from '@tanstack/react-query';
import type { BoardSortOrder } from '../api/communityApi';
import { getGroupPosts } from '../api/communityApi';
import type { Post } from '@/types';

export function useGroupPosts(
  groupId: number | null | undefined,
  boardId: number | null | undefined,
  sortOrder: BoardSortOrder,
) {
  return useQuery<Post[], Error>({
    queryKey: ['groupPosts', groupId, boardId, sortOrder],
    queryFn: () => {
      if (!groupId || !boardId) return Promise.resolve([]);
      return getGroupPosts(groupId, boardId, { sortOrder, limit: 20, offset: 0 });
    },
    enabled: !!groupId && !!boardId,
    staleTime: 1000 * 60,
  });
}

