import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export function useEmotionTimeline(days = 7) {
  return useQuery({
    queryKey: ['emotionTimeline', days],
    queryFn: () => api.getEmotionTimeline(days),
    staleTime: 5 * 60 * 1000,
  });
}
