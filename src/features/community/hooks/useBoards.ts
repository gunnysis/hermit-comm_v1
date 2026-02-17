import { useQuery } from '@tanstack/react-query';
import { getBoards } from '../api/communityApi';
import type { Board } from '@/types';

export function useBoards() {
  return useQuery<Board[], Error>({
    queryKey: ['boards'],
    queryFn: () => getBoards(),
    staleTime: 1000 * 60 * 5,
  });
}

