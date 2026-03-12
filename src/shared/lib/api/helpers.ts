/** Supabase 에러에서 메시지 추출 (빈 message 방지) */
export function extractErrorMessage(error: {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}): string {
  return (
    error.message ||
    error.code ||
    (error.details ? `details: ${error.details}` : '') ||
    (error.hint ? `hint: ${error.hint}` : '') ||
    'unknown_supabase_error'
  );
}
