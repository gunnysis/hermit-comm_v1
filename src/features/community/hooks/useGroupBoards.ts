import { useQuery } from '@tanstack/react-query';
import { getGroupBoards, type GroupBoard } from '../api/communityApi';

export function useGroupBoards(groupId: number | null | undefined) {
  return useQuery<GroupBoard[], Error>({
    queryKey: ['groupBoards', groupId],
    queryFn: () => {
      if (!groupId) return Promise.resolve([]);
      return getGroupBoards(groupId);
    },
    enabled: !!groupId,
    staleTime: 1000 * 60 * 5,
  });
}

