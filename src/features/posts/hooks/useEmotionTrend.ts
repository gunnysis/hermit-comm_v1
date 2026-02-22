import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

const DEFAULT_DAYS = 7;

export function useEmotionTrend(days: number = DEFAULT_DAYS) {
  return useQuery({
    queryKey: ['emotionTrend', days],
    queryFn: () => api.getEmotionTrend(days),
    staleTime: 1000 * 60 * 5,
  });
}
