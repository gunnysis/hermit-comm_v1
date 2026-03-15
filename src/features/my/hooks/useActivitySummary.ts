import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export function useActivitySummary(enabled = true) {
  return useQuery({
    queryKey: ['activitySummary'],
    queryFn: api.getActivitySummary,
    enabled,
    staleTime: 60 * 1000,
  });
}
