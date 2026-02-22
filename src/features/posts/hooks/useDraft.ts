import { useCallback, useEffect, useRef, useState } from 'react';
import { draftStorage } from '@/shared/lib/storage';
import { logger } from '@/shared/utils/logger';

const DRAFT_PREFIX = 'draft_';
const DEBOUNCE_MS = 500;

export interface DraftData {
  title: string;
  content: string;
  author: string;
  updatedAt: number;
}

function draftKey(boardId: number): string {
  return `${DRAFT_PREFIX}${boardId}`;
}

function getDraftSync(boardId: number): DraftData | null {
  try {
    const raw = draftStorage.getString(draftKey(boardId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'title' in parsed &&
      'content' in parsed &&
      'author' in parsed
    ) {
      return {
        title: String((parsed as DraftData).title),
        content: String((parsed as DraftData).content),
        author: String((parsed as DraftData).author),
        updatedAt: Number((parsed as DraftData).updatedAt) || Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function setDraftSync(boardId: number, data: Omit<DraftData, 'updatedAt'>): void {
  try {
    const payload: DraftData = {
      ...data,
      updatedAt: Date.now(),
    };
    draftStorage.set(draftKey(boardId), JSON.stringify(payload));
  } catch (error) {
    logger.error('임시저장 실패:', error);
  }
}

function clearDraftSync(boardId: number): void {
  try {
    draftStorage.remove(draftKey(boardId));
  } catch (error) {
    logger.error('임시저장 삭제 실패:', error);
  }
}

export function useDraft(
  boardId: number,
  values: { title: string; content: string; author: string },
) {
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDraft = useCallback((): DraftData | null => {
    const draft = getDraftSync(boardId);
    setHasDraft(!!draft);
    return draft;
  }, [boardId]);

  const clearDraft = useCallback(() => {
    clearDraftSync(boardId);
    setHasDraft(false);
  }, [boardId]);

  const saveDraft = useCallback(
    (data: { title: string; content: string; author: string }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        const hasContent = data.title.trim() || data.content.trim();
        if (hasContent) {
          setDraftSync(boardId, data);
          setHasDraft(true);
        } else {
          clearDraftSync(boardId);
          setHasDraft(false);
        }
      }, DEBOUNCE_MS);
    },
    [boardId],
  );

  useEffect(() => {
    setHasDraft(!!getDraftSync(boardId));
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [boardId]);

  useEffect(() => {
    saveDraft(values);
    // 의도적으로 값 필드만 의존: values 객체 참조 변경 시마다 저장하지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.title, values.content, values.author, saveDraft]);

  return { loadDraft, clearDraft, hasDraft };
}

export { getDraftSync, clearDraftSync };
