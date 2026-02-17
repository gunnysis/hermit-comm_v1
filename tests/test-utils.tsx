import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * 앱에서 사용하는 공통 프로바이더로 감싼 render 래퍼.
 * 통합 테스트에서 화면/컴포넌트를 실제와 유사한 환경에서 렌더링할 때 사용.
 */
function AllProviders({ children }: { children: React.ReactNode }) {
  return <SafeAreaProvider>{children}</SafeAreaProvider>;
}

function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: ({ children }) => <AllProviders>{children}</AllProviders>,
    ...options,
  });
}

export { renderWithProviders, AllProviders };
