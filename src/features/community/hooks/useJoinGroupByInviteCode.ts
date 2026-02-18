import { useMutation, useQueryClient } from '@tanstack/react-query';
import { joinGroupByInviteCode, type JoinGroupByInviteCodeResult } from '../api/communityApi';

export function useJoinGroupByInviteCode() {
  const queryClient = useQueryClient();

  return useMutation<JoinGroupByInviteCodeResult, Error, string>({
    mutationFn: (code: string) => joinGroupByInviteCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myGroups'] });
    },
  });
}
