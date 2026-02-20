// 입력 검증 유틸리티

import { stripHtml } from './html';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validatePostTitle(title: string): ValidationResult {
  if (!title.trim()) {
    return { isValid: false, error: '제목을 입력해주세요.' };
  }
  if (title.length > 100) {
    return { isValid: false, error: '제목은 100자 이내로 입력해주세요.' };
  }
  return { isValid: true };
}

export function validatePostContent(content: string): ValidationResult {
  if (!content.trim()) {
    return { isValid: false, error: '내용을 입력해주세요.' };
  }
  const plain = stripHtml(content).trim();
  if (plain.length < 1) {
    return { isValid: false, error: '내용을 입력해주세요.' };
  }
  if (content.length > 5000) {
    return { isValid: false, error: '내용은 5000자 이내로 입력해주세요.' };
  }
  return { isValid: true };
}

export function validateAuthor(author: string): ValidationResult {
  if (!author.trim()) {
    return { isValid: false, error: '작성자 이름을 입력해주세요.' };
  }
  if (author.length > 50) {
    return { isValid: false, error: '작성자 이름은 50자 이내로 입력해주세요.' };
  }
  return { isValid: true };
}

export function validateCommentContent(content: string): ValidationResult {
  if (!content.trim()) {
    return { isValid: false, error: '댓글을 입력해주세요.' };
  }
  if (content.length > 1000) {
    return { isValid: false, error: '댓글은 1000자 이내로 입력해주세요.' };
  }
  return { isValid: true };
}
