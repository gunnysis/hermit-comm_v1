import { createMMKV } from 'react-native-mmkv';

/** 글 임시저장용 MMKV */
export const draftStorage = createMMKV({ id: 'hermit-drafts' });
