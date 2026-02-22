import { useCallback } from 'react';
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { APIError } from '@/shared/lib/api';
import { logger } from '@/shared/utils/logger';

function isAPIError(err: unknown): err is APIError {
  return err instanceof APIError;
}

export function useErrorHandler(options?: {
  useToastForSuccess?: boolean;
  useAlertForErrors?: boolean;
}) {
  const { useToastForSuccess = true, useAlertForErrors = true } = options ?? {};

  const showError = useCallback(
    (err: unknown, fallbackMessage = '잠시 후 다시 시도해주세요.') => {
      if (!__DEV__ && err instanceof Error) {
        logger.error(err.message, err);
      }
      const message = isAPIError(err) ? err.userMessage : fallbackMessage;
      if (useAlertForErrors) {
        Alert.alert('오류', message);
      } else if (useToastForSuccess) {
        Toast.show({ type: 'error', text1: message });
      }
    },
    [useAlertForErrors, useToastForSuccess],
  );

  const showSuccess = useCallback((message: string) => {
    Toast.show({ type: 'success', text1: message });
  }, []);

  return { showError, showSuccess };
}
