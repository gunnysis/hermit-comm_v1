import { useCallback, useEffect, useRef, useState } from 'react';
import { draftStorage } from '@/shared/lib/storage';
import { logger } from '@/shared/utils/logger';

const DRAFT_PREFIX = 'draft_';
const DEBOUNCE_MS = 500;

export interface DraftData {
  title: string;
  content: string;
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
    if (typeof parsed === 'object' && parsed !== null && 'title' in parsed && 'content' in parsed) {
      return {
        title: String((parsed as DraftData).title),
        content: String((parsed as DraftData).content),
        updatedAt: Number((parsed as DraftData).updatedAt) || Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

function setDraftSync(boardId: number, data: { title: string; content: string }): void {
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

export type DraftStatus = 'idle' | 'saving' | 'saved';

export function useDraft(boardId: number, values: { title: string; content: string }) {
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [status, setStatus] = useState<DraftStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    (data: { title: string; content: string }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setStatus('saving');
      if (statusResetRef.current) clearTimeout(statusResetRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        const hasContent = data.title.trim() || data.content.trim();
        if (hasContent) {
          setDraftSync(boardId, data);
          setHasDraft(true);
          setStatus('saved');
          statusResetRef.current = setTimeout(() => setStatus('idle'), 3000);
        } else {
          clearDraftSync(boardId);
          setHasDraft(false);
          setStatus('idle');
        }
      }, DEBOUNCE_MS);
    },
    [boardId],
  );

  useEffect(() => {
    setHasDraft(!!getDraftSync(boardId));
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (statusResetRef.current) clearTimeout(statusResetRef.current);
    };
  }, [boardId]);

  useEffect(() => {
    saveDraft(values);
    // 의도적으로 값 필드만 의존: values 객체 참조 변경 시마다 저장하지 않음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.title, values.content, saveDraft]);

  return { loadDraft, clearDraft, hasDraft, status };
}

export { getDraftSync, clearDraftSync };
