import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export function useBlockedAliases() {
  return useQuery({
    queryKey: ['blockedAliases'],
    queryFn: api.getBlockedAliases,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.blockUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blockedAliases'] }),
  });
}
