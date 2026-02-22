import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/shared/lib/storage';
import { logger } from '@/shared/utils/logger';

export function useAuthor() {
  const [author, setAuthor] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // 저장된 작성자 이름 불러오기
  useEffect(() => {
    const loadAuthor = async () => {
      try {
        const saved = await storage.getAuthor();
        if (saved) {
          setAuthor(saved);
        }
      } catch (error) {
        logger.error('작성자 불러오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthor();
  }, []);

  // 작성자 이름 저장
  const saveAuthor = useCallback(async (newAuthor: string) => {
    setAuthor(newAuthor);
    await storage.saveAuthor(newAuthor);
  }, []);

  return { author, setAuthor: saveAuthor, isLoading };
}
