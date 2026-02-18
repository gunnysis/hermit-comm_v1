export function toFriendlyErrorMessage(e: unknown, fallback: string): string {
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
