import { useQuery } from '@tanstack/react-query';
import { getMonthlyEmotionReport } from '@/shared/lib/api/my';

export function useMonthlyReport(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: ['monthlyReport', year, month],
    queryFn: () => getMonthlyEmotionReport(year, month),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
}
