/**
 * HTML/텍스트 유틸 — 목록 미리보기·글 보기 본문 분기용
 */

/** HTML 태그 제거, 순수 텍스트 반환 (O(n)) */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 텍스트를 maxLen 자로 자르고 말줄임 표시. strip 결과가 비어 있으면 "내용 없음" 반환 */
export function getExcerpt(text: string, maxLen: number): string {
  const plain = typeof text === 'string' ? stripHtml(text).trim() : '';
  if (plain.length === 0) return '내용 없음';
  if (plain.length <= maxLen) return plain;
  return plain.slice(0, maxLen).trim() + '…';
}

/** content가 HTML(리치)인지 여부 — PostBody에서 렌더 방식 분기용 */
export function isLikelyHtml(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  return /<(?:\w+|[\w-]+)[\s>]/.test(content);
}
