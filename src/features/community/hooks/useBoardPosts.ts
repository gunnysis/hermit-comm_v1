import { useQuery } from '@tanstack/react-query';
import type { BoardSortOrder } from '../api/communityApi';
import { getBoardPosts } from '../api/communityApi';
import type { Post } from '@/types';

export function useBoardPosts(boardId: number, sortOrder: BoardSortOrder) {
  return useQuery<Post[], Error>({
    queryKey: ['boardPosts', boardId, sortOrder],
    queryFn: () => getBoardPosts(boardId, { sortOrder, limit: 20, offset: 0 }),
    staleTime: 1000 * 60,
  });
}

