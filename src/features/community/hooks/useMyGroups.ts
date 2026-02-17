import { useQuery } from '@tanstack/react-query';
import { getMyGroups, type GroupSummary } from '../api/communityApi';

export function useMyGroups() {
  return useQuery<GroupSummary[], Error>({
    queryKey: ['myGroups'],
    queryFn: () => getMyGroups(),
    staleTime: 1000 * 60 * 5,
  });
}

