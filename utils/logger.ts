/**
 * 개발/프로덕션 환경에 따라 로그를 제어하는 유틸리티
 * 
 * 프로덕션 환경에서는 로그를 출력하지 않아 성능과 보안을 개선합니다.
 */

const IS_DEV = __DEV__;

export const logger = {
  log: (...args: unknown[]) => {
    if (IS_DEV) console.log(...args);
  },
  error: (...args: unknown[]) => {
    if (IS_DEV) console.error(...args);
  },
  warn: (...args: unknown[]) => {
    if (IS_DEV) console.warn(...args);
  },
  info: (...args: unknown[]) => {
    if (IS_DEV) console.info(...args);
  },
};
