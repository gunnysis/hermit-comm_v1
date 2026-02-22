import { createMMKV } from 'react-native-mmkv';
import { logger } from '@/shared/utils/logger';

const AUTHOR_KEY = 'hermit_author';

/** 앱 데이터용 MMKV (작성자, 정렬 등). Supabase Auth·TanStack persister는 AsyncStorage 유지. */
const appStorage = createMMKV({ id: 'hermit-app' });

/** 글 임시저장용 MMKV */
export const draftStorage = createMMKV({ id: 'hermit-drafts' });

const storageHelpers = {
  /** 작성자 이름 저장 (동기) */
  saveAuthor(author: string): void {
    try {
      appStorage.set(AUTHOR_KEY, author);
    } catch (error) {
      logger.error('작성자 저장 실패:', error);
    }
  },

  /** 작성자 이름 불러오기 (동기) */
  getAuthor(): string | null {
    try {
      const value = appStorage.getString(AUTHOR_KEY);
      return value ?? null;
    } catch (error) {
      logger.error('작성자 불러오기 실패:', error);
      return null;
    }
  },

  /** 작성자 이름 삭제 */
  clearAuthor(): void {
    try {
      appStorage.remove(AUTHOR_KEY);
    } catch (error) {
      logger.error('작성자 삭제 실패:', error);
    }
  },
};

/** 기존 async API 호환용 래퍼 (useAuthor 등). 이름은 storage로 export. */
export const storage = {
  async saveAuthor(author: string): Promise<void> {
    storageHelpers.saveAuthor(author);
  },

  async getAuthor(): Promise<string | null> {
    return storageHelpers.getAuthor();
  },

  async clearAuthor(): Promise<void> {
    storageHelpers.clearAuthor();
  },
};
