import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export function useDailyInsights(days = 30, enabled = true) {
  return useQuery({
    queryKey: ['dailyInsights', days],
    queryFn: () => api.getDailyInsights(days),
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
