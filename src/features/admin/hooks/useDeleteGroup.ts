import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteGroup } from '@/features/admin/api/adminApi';

export const QUERY_KEY_MANAGED_GROUPS = ['admin', 'myManagedGroups'] as const;

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) => deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY_MANAGED_GROUPS });
    },
  });
}
