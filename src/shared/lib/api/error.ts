export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'APIError';
  }

  get userMessage(): string {
    if (this.status === 401) return '인증이 필요합니다.';
    if (this.status === 403) return '권한이 없습니다.';
    if (this.status === 404) return '요청한 데이터를 찾을 수 없습니다.';
    if (this.status >= 500) return '서버 오류가 발생했습니다.';
    return this.message;
  }
}
