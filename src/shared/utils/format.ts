// 날짜 및 텍스트 포맷팅 유틸리티
import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  format,
  isThisYear,
} from 'date-fns';

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMins = differenceInMinutes(now, date);
  const diffHours = differenceInHours(now, date);
  const diffDays = differenceInDays(now, date);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  if (isThisYear(date)) {
    return format(date, 'MM.dd');
  }
  return format(date, 'yyyy.MM.dd');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function formatReactionCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  return `${Math.floor(count / 1000)}k`;
}
