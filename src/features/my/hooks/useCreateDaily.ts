import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export function useCreateDaily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createDailyPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayDaily'] });
      queryClient.invalidateQueries({ queryKey: ['boardPosts'] });
    },
  });
}

export function useUpdateDaily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateDailyPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayDaily'] });
      queryClient.invalidateQueries({ queryKey: ['boardPosts'] });
    },
  });
}
