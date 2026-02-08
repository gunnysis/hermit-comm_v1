import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Supabase 프로젝트 설정
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
  Constants.expoConfig?.extra?.supabaseUrl;

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL과 Anon Key가 설정되지 않았습니다. ' +
    '.env 파일을 확인하거나 app.config.js에서 설정하세요.'
  );
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 익명 인증을 위해 세션 유지 필요
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // 실시간 이벤트 제한
    },
  },
});

// 데이터베이스 타입 정의 (Supabase에서 자동 생성 가능하지만 수동으로 정의)
export type Database = {
  public: {
    Tables: {
      posts: {
        Row: {
          id: number;
          title: string;
          content: string;
          author: string;
          author_id: string;  // UUID
          created_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          content: string;
          author: string;
          author_id?: string;  // RLS에서 자동 설정
          created_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          content?: string;
          author?: string;
          author_id?: string;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: number;
          post_id: number;
          content: string;
          author: string;
          author_id: string;  // UUID
          created_at: string;
        };
        Insert: {
          id?: number;
          post_id: number;
          content: string;
          author: string;
          author_id?: string;  // RLS에서 자동 설정
          created_at?: string;
        };
        Update: {
          id?: number;
          post_id?: number;
          content?: string;
          author?: string;
          author_id?: string;
          created_at?: string;
        };
      };
      reactions: {
        Row: {
          id: number;
          post_id: number;
          reaction_type: string;
          count: number;
        };
        Insert: {
          id?: number;
          post_id: number;
          reaction_type: string;
          count?: number;
        };
        Update: {
          id?: number;
          post_id?: number;
          reaction_type?: string;
          count?: number;
        };
      };
    };
  };
};
