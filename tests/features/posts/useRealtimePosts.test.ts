import { renderHook } from '@testing-library/react-native';
import { useRealtimePosts } from '@/features/posts/hooks/useRealtimePosts';

// jest.mock 팩토리 내부에서 모든 mock을 정의 (호이스팅 문제 방지)
jest.mock('@/shared/lib/supabase', () => {
  const mockSubscribe = jest.fn().mockReturnThis();
  const mockOn = jest.fn().mockReturnThis();
  const mockChannel = { on: mockOn, subscribe: mockSubscribe };
  return {
    supabase: {
      channel: jest.fn(() => mockChannel),
      removeChannel: jest.fn(() => Promise.resolve()),
    },
  };
});

import { supabase } from '@/shared/lib/supabase';

describe('useRealtimePosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // removeChannel이 .catch()를 호출할 수 있도록 Promise 반환
    (supabase.removeChannel as jest.Mock).mockReturnValue(Promise.resolve());
    const mockOn = jest.fn().mockReturnThis();
    const mockSubscribe = jest.fn().mockReturnThis();
    const mockChannel = { on: mockOn, subscribe: mockSubscribe };
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
  });

  it('마운트 시 Supabase 채널을 구독한다', () => {
    renderHook(() => useRealtimePosts({}));

    expect(supabase.channel).toHaveBeenCalledWith('posts_changes');
  });

  it('언마운트 시 채널을 제거한다', () => {
    const { unmount } = renderHook(() => useRealtimePosts({}));
    unmount();

    expect(supabase.removeChannel).toHaveBeenCalled();
  });

  it('enabled=false이면 구독하지 않는다', () => {
    renderHook(() => useRealtimePosts({ enabled: false }));
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('enabled=true이면 구독한다 (기본값)', () => {
    renderHook(() => useRealtimePosts({ enabled: true }));
    expect(supabase.channel).toHaveBeenCalled();
  });

  it('enabled=false 언마운트 시 removeChannel을 호출하지 않는다', () => {
    const { unmount } = renderHook(() => useRealtimePosts({ enabled: false }));
    unmount();
    expect(supabase.removeChannel).not.toHaveBeenCalled();
  });

  it('onInsert, onDelete, onUpdate 콜백을 전달해도 정상 구독된다', () => {
    const onInsert = jest.fn();
    const onDelete = jest.fn();
    const onUpdate = jest.fn();

    renderHook(() => useRealtimePosts({ onInsert, onDelete, onUpdate }));
    expect(supabase.channel).toHaveBeenCalledWith('posts_changes');
  });
});
