import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Loading } from './Loading';

describe('Loading', () => {
  it('message가 있으면 메시지를 렌더링한다', () => {
    render(<Loading message="불러오는 중..." />);
    expect(screen.getByText('불러오는 중...')).toBeTruthy();
  });

  it('message가 없으면 메시지 텍스트가 없다', () => {
    render(<Loading />);
    expect(screen.queryByText('불러오는 중...')).toBeNull();
  });

  it('skeleton이 true면 에러 없이 렌더링된다', () => {
    expect(() => render(<Loading skeleton />)).not.toThrow();
  });

  it('skeleton이 false면 일반 로딩이 렌더링된다', () => {
    render(<Loading message="로딩" />);
    expect(screen.getByText('로딩')).toBeTruthy();
  });
});
