import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';
import { ErrorView } from './ErrorView';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[AppErrorBoundary]', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-cream-50">
          <ErrorView
            message="문제가 발생했어요. 아래 버튼으로 다시 시도해주세요."
            onRetry={this.handleRetry}
          />
        </View>
      );
    }
    return this.props.children;
  }
}
