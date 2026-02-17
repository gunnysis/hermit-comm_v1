import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ErrorView } from './ErrorView';

describe('ErrorView', () => {
  it('message를 렌더링한다', () => {
    render(<ErrorView message="오류가 발생했습니다." />);
    expect(screen.getByText('오류가 발생했습니다.')).toBeTruthy();
  });

  it('onRetry가 있으면 "다시 시도" 버튼을 보여준다', () => {
    const onRetry = jest.fn();
    render(<ErrorView message="에러" onRetry={onRetry} />);
    const retryBtn = screen.getByText('다시 시도');
    expect(retryBtn).toBeTruthy();
    fireEvent.press(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('onRetry가 없으면 "다시 시도" 버튼이 없다', () => {
    render(<ErrorView message="에러" />);
    expect(screen.queryByText('다시 시도')).toBeNull();
  });
});
