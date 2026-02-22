/**
 * Sentry breadcrumb 헬퍼 (초기화 여부와 무관하게 안전 호출)
 * 에러 재현 경로 파악을 위해 핵심 플로우에서만 사용합니다.
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
): void {
  try {
    const Sentry = require('@sentry/react-native');
    Sentry.addBreadcrumb({ category, message, data: data ?? {} });
  } catch {
    // Sentry 미설정/미초기화 시 무시
  }
}
