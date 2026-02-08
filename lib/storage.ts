import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTHOR_KEY = 'hermit_author';

export const storage = {
  // 작성자 이름 저장
  async saveAuthor(author: string): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTHOR_KEY, author);
    } catch (error) {
      console.error('작성자 저장 실패:', error);
    }
  },

  // 작성자 이름 불러오기
  async getAuthor(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTHOR_KEY);
    } catch (error) {
      console.error('작성자 불러오기 실패:', error);
      return null;
    }
  },

  // 작성자 이름 삭제
  async clearAuthor(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTHOR_KEY);
    } catch (error) {
      console.error('작성자 삭제 실패:', error);
    }
  },
};
