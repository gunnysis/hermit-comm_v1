import React from 'react';
import { View, Text } from 'react-native';
import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils';
import { PostList } from '@/features/posts/components/PostList';
import type { Post } from '@/types';

const mockPost: Post = {
  id: 1,
  title: '은둔마을 첫 게시글',
  content: '따뜻한 이야기가 있는 곳입니다.',
  author: '테스터',
  author_id: 'test-uuid',
  created_at: '2025-01-01T00:00:00Z',
  comment_count: 0,
  is_anonymous: true,
  display_name: '익명',
};

describe('통합: 프로바이더 + 컴포넌트 트리', () => {
  it('renderWithProviders로 프로바이더가 적용된 상태에서 컴포넌트가 렌더된다', () => {
    renderWithProviders(
      <View>
        <Text>은둔마을</Text>
        <Text>따뜻한 이야기가 있는 곳</Text>
      </View>,
    );

    expect(screen.getByText('은둔마을')).toBeTruthy();
    expect(screen.getByText('따뜻한 이야기가 있는 곳')).toBeTruthy();
  });

  it('PostList가 게시글 목록과 로딩/에러 상태를 올바르게 표시한다', () => {
    const onRefresh = jest.fn();

    renderWithProviders(
      <PostList
        posts={[mockPost]}
        loading={false}
        error={null}
        onRefresh={onRefresh}
        hasMore={false}
      />,
    );

    expect(screen.getByText('은둔마을 첫 게시글')).toBeTruthy();
    expect(screen.getByText('따뜻한 이야기가 있는 곳입니다.')).toBeTruthy();
    expect(screen.getByText('익명')).toBeTruthy();
  });

  it('PostList가 에러 시 에러 메시지를 표시한다', () => {
    const onRefresh = jest.fn();

    renderWithProviders(
      <PostList posts={[]} loading={false} error="네트워크 오류" onRefresh={onRefresh} />,
    );

    expect(screen.getByText('네트워크 오류')).toBeTruthy();
  });
});
