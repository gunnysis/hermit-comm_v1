import { useInfiniteQuery } from '@tanstack/react-query';
import type { BoardSortOrder } from '../api/communityApi';
import { getBoardPosts } from '../api/communityApi';
import type { Post } from '@/types';

const PAGE_SIZE = 20;

export function useBoardPosts(boardId: number, sortOrder: BoardSortOrder) {
  return useInfiniteQuery<Post[], Error>({
    queryKey: ['boardPosts', boardId, sortOrder],
    queryFn: ({ pageParam }) =>
      getBoardPosts(boardId, { sortOrder, limit: PAGE_SIZE, offset: Number(pageParam) }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    staleTime: 1000 * 60,
  });
}
