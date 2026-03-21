import { useQuery } from '@tanstack/react-query';
import { getDailyHistory } from '@/shared/lib/api/my';

export function useDailyHistory(limit = 20, enabled = true) {
  return useQuery({
    queryKey: ['dailyHistory', limit],
    queryFn: () => getDailyHistory(limit),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}
