import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('title을 렌더링한다', () => {
    render(<Button title="확인" onPress={() => {}} />);
    expect(screen.getByText('확인')).toBeTruthy();
  });

  it('onPress 호출 시 콜백이 실행된다', () => {
    const onPress = jest.fn();
    render(<Button title="클릭" onPress={onPress} />);
    fireEvent.press(screen.getByText('클릭'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled일 때도 렌더링된다', () => {
    const onPress = jest.fn();
    render(<Button title="클릭" onPress={onPress} disabled />);
    expect(screen.getByText('클릭')).toBeTruthy();
  });

  it('loading일 때 렌더링해도 에러가 나지 않는다', () => {
    expect(() =>
      render(<Button title="제출" onPress={() => {}} loading />)
    ).not.toThrow();
  });

  it('variant primary가 기본값이다', () => {
    render(<Button title="기본" onPress={() => {}} />);
    expect(screen.getByText('기본')).toBeTruthy();
  });

  it('variant secondary로 렌더링할 수 있다', () => {
    render(<Button title="취소" onPress={() => {}} variant="secondary" />);
    expect(screen.getByText('취소')).toBeTruthy();
  });
});
