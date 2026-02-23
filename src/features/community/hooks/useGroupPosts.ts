import { useInfiniteQuery } from '@tanstack/react-query';
import type { BoardSortOrder } from '../api/communityApi';
import { getGroupPosts } from '../api/communityApi';
import type { Post } from '@/types';

const PAGE_SIZE = 20;

export function useGroupPosts(
  groupId: number | null | undefined,
  boardId: number | null | undefined,
  sortOrder: BoardSortOrder,
) {
  return useInfiniteQuery<Post[], Error>({
    queryKey: ['groupPosts', groupId, boardId, sortOrder],
    queryFn: ({ pageParam }) => {
      if (!groupId || !boardId) return Promise.resolve([]);
      return getGroupPosts(groupId, boardId, {
        sortOrder,
        limit: PAGE_SIZE,
        offset: (pageParam as number) ?? 0,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
    enabled: !!groupId && !!boardId,
    staleTime: 1000 * 60,
  });
}
