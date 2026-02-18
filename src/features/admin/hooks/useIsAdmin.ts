import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { checkAppAdmin } from '@/shared/lib/admin';

export function useIsAdmin() {
  const { user } = useAuth();
  const userId = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['app_admin', userId],
    queryFn: () => checkAppAdmin(userId ?? undefined),
    enabled: !!userId,
    staleTime: 1000 * 60, // 1분
  });

  const isAdmin = userId == null ? false : (data ?? null);

  return {
    isAdmin,
    isLoading,
  };
}
