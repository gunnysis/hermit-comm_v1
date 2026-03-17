import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';
import { logger } from '@/shared/utils/logger';

export function useBlockedAliases(enabled = true) {
  return useQuery({
    queryKey: ['blockedAliases'],
    queryFn: api.getBlockedAliases,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useBlockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.blockUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blockedAliases'] });
      qc.invalidateQueries({ queryKey: ['boardPosts'] });
    },
    onError: (error) => {
      logger.error('[useBlockUser]', error);
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.unblockUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blockedAliases'] });
      qc.invalidateQueries({ queryKey: ['boardPosts'] });
    },
    onError: (error) => {
      logger.error('[useUnblockUser]', error);
    },
  });
}
