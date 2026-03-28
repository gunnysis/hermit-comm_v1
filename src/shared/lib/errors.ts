export function toFriendlyErrorMessage(e: unknown, fallback: string): string {
  // 네트워크 에러 구분
  if (e instanceof TypeError && e.message === 'Failed to fetch') {
    return '네트워크 연결을 확인해주세요.';
  }
  if (e instanceof Error && e.message.toLowerCase().includes('network')) {
    return '네트워크 연결을 확인해주세요.';
  }

  if (e instanceof Error) {
    return e.message || fallback;
  }

  if (e && typeof e === 'object' && 'message' in e) {
    const message = (e as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return fallback;
}
