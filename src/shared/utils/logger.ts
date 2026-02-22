/**
 * 개발/프로덕션 환경에 따라 로그를 제어하는 유틸리티
 *
 * 프로덕션에서는 logger.error 시 Sentry로 전송합니다.
 */

const IS_DEV = __DEV__;

function reportToSentry(args: unknown[]): void {
  if (IS_DEV) return;
  try {
    const Sentry = require('@sentry/react-native');
    if (args.length > 0 && args[0] instanceof Error) {
      Sentry.captureException(args[0], { extra: { args: args.slice(1) } });
    } else {
      Sentry.captureMessage(String(args[0] ?? 'Error'), { extra: { args: args.slice(1) } });
    }
  } catch {
    // Sentry 미설정 시 무시
  }
}

export const logger = {
  log: (...args: unknown[]) => {
    if (IS_DEV) console.log(...args);
  },
  error: (...args: unknown[]) => {
    if (IS_DEV) {
      console.error(...args);
    } else {
      reportToSentry(args);
    }
  },
  warn: (...args: unknown[]) => {
    if (IS_DEV) console.warn(...args);
  },
  info: (...args: unknown[]) => {
    if (IS_DEV) console.info(...args);
  },
};
