import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePostDetailAnalysis } from '@/features/posts/hooks/usePostDetailAnalysis';

const mockInvokeSmartService = jest.fn().mockResolvedValue([]);
const mockGetPostAnalysis = jest.fn().mockResolvedValue(null);

jest.mock('@/shared/lib/api', () => ({
  api: {
    getPostAnalysis: (...args: unknown[]) => mockGetPostAnalysis(...args),
    invokeSmartService: (...args: unknown[]) => mockInvokeSmartService(...args),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
    },
  });
  return {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
    queryClient,
  };
}

describe('usePostDetailAnalysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('postId가 유효하면 감정 분석을 조회한다', async () => {
    const mockAnalysis = { id: 1, post_id: 1, emotions: ['슬픔'], analyzed_at: '2025-01-01' };
    mockGetPostAnalysis.mockResolvedValue(mockAnalysis);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePostDetailAnalysis(1), { wrapper });

    await waitFor(() => {
      expect(result.current.postAnalysis).toEqual(mockAnalysis);
    });
    expect(result.current.analysisLoading).toBe(false);
  });

  it('postId가 0 이하이면 조회하지 않는다', () => {
    const { wrapper } = createWrapper();
    renderHook(() => usePostDetailAnalysis(0), { wrapper });
    expect(mockGetPostAnalysis).not.toHaveBeenCalled();
  });

  it('분석 결과 없으면 postAnalysis가 null이다', async () => {
    mockGetPostAnalysis.mockResolvedValue(null);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePostDetailAnalysis(1), { wrapper });

    await waitFor(() => {
      expect(result.current.analysisLoading).toBe(false);
    });
    expect(result.current.postAnalysis).toBeNull();
  });

  it('14초 fallback 타이머가 등록된다', () => {
    jest.useFakeTimers();
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    try {
      const { wrapper } = createWrapper();
      renderHook(() => usePostDetailAnalysis(1), { wrapper });

      const calls = setTimeoutSpy.mock.calls;
      const fallbackTimer = calls.find((call) => call[1] === 14000);
      expect(fallbackTimer).toBeDefined();
    } finally {
      jest.useRealTimers();
      setTimeoutSpy.mockRestore();
    }
  });

  it('언마운트 시 타이머를 클리어한다', () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    try {
      const { wrapper } = createWrapper();
      const { unmount } = renderHook(() => usePostDetailAnalysis(1), { wrapper });

      unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
      clearTimeoutSpy.mockRestore();
    }
  });

  it('캐시가 null이고 게시글 콘텐츠가 있으면 fallback을 호출한다', async () => {
    mockGetPostAnalysis.mockResolvedValue(null);
    mockInvokeSmartService.mockResolvedValue(['슬픔']);

    jest.useFakeTimers();
    try {
      const { wrapper, queryClient } = createWrapper();
      queryClient.setQueryData(['post', 1], { content: '오늘 너무 힘들었다', title: '제목' });
      queryClient.setQueryData(['postAnalysis', 1], null);

      renderHook(() => usePostDetailAnalysis(1), { wrapper });

      // 14초 타이머 발동 + async 콜백 완료 대기
      await act(async () => {
        jest.advanceTimersByTime(14001);
        await Promise.resolve(); // async callback microtask flush
      });

      expect(mockInvokeSmartService).toHaveBeenCalledWith(1, '오늘 너무 힘들었다', '제목');
    } finally {
      jest.useRealTimers();
    }
  });

  it('분석 결과가 이미 있으면 fallback을 호출하지 않는다', async () => {
    const mockAnalysis = { id: 1, post_id: 1, emotions: ['안도감'], analyzed_at: '2025-01-01' };
    mockGetPostAnalysis.mockResolvedValue(mockAnalysis);

    jest.useFakeTimers();
    try {
      const { wrapper, queryClient } = createWrapper();
      queryClient.setQueryData(['postAnalysis', 1], mockAnalysis);
      queryClient.setQueryData(['post', 1], { content: '내용', title: '제목' });

      renderHook(() => usePostDetailAnalysis(1), { wrapper });

      await act(async () => {
        jest.advanceTimersByTime(14001);
        await Promise.resolve(); // async callback microtask flush
      });

      expect(mockInvokeSmartService).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });
});
