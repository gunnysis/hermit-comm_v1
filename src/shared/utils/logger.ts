/**
 * 개발/프로덕션 환경에 따라 로그를 제어하는 유틸리티
 *
 * 프로덕션에서는 logger.error 시 Sentry로 전송합니다.
 * - fingerprint로 API별 이슈 분리
 * - 같은 fingerprint는 30초에 1번만 전송 (throttle)
 */

const IS_DEV = __DEV__;

// 같은 fingerprint 에러는 30초에 1번만 Sentry 전송
const sentryThrottle = new Map<string, number>();
const THROTTLE_MS = 30_000;

function reportToSentry(args: unknown[]): void {
  if (IS_DEV) return;
  try {
    const Sentry = require('@sentry/react-native');

    const errors: Error[] = [];
    const parts: string[] = [];
    const extras: Record<string, unknown> = {};

    for (const arg of args) {
      if (arg instanceof Error) {
        errors.push(arg);
        parts.push(arg.message || arg.name);
      } else if (typeof arg === 'object' && arg !== null) {
        Object.assign(extras, arg);
        try {
          parts.push(JSON.stringify(arg));
        } catch {
          parts.push(String(arg));
        }
      } else if (arg !== undefined && arg !== null) {
        parts.push(String(arg));
      }
    }

    const message = parts.join(' ') || 'Unknown error';

    // 핑거프린트 추출: "[API] searchPosts 에러:" → "API-searchPosts"
    const tagMatch = message.match(/\[(\w+)\]\s*(\S+)/);
    const fingerprint = tagMatch ? `${tagMatch[1]}-${tagMatch[2]}` : 'unknown';

    // Throttle: 같은 fingerprint는 30초에 1번만
    const now = Date.now();
    const lastSent = sentryThrottle.get(fingerprint) ?? 0;
    if (now - lastSent < THROTTLE_MS) return;
    sentryThrottle.set(fingerprint, now);

    if (errors.length > 0) {
      Sentry.captureException(errors[0], {
        extra: { fullMessage: message, ...extras },
        fingerprint: ['{{ default }}', fingerprint],
      });
    } else {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: { args, ...extras },
        fingerprint: [fingerprint, message.slice(0, 80)],
      });
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
