import React, { Component, ReactNode } from 'react';
import { ErrorInfo } from 'react';
import { UnifiedErrorDisplay } from './UnifiedErrorDisplay';
import { useErrorTracking } from '@/hooks/useErrorTracking';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  showRetry?: boolean;
  showHome?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class UnifiedErrorBoundaryComponent extends Component<Props, State> {
  private errorTracking: ReturnType<typeof useErrorTracking> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error using error tracking if available
    if (this.errorTracking) {
      this.errorTracking.logError(error, this.props.context || 'Component Error');
    } else {
      console.error('🚨 Error Boundary:', error, errorInfo);
    }

    // Call onError prop if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6">
          <UnifiedErrorDisplay
            error={this.state.error}
            title="خطأ في النظام"
            onRetry={this.handleRetry}
            showRetry={this.props.showRetry !== false}
            showDetails={this.props.showDetails}
            showHome={this.props.showHome}
            context={this.props.context}
            retryCount={this.state.retryCount}
            maxRetries={3}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC to inject error tracking
export const UnifiedErrorBoundary: React.FC<Props> = (props) => {
  const errorTracking = useErrorTracking();
  
  return React.createElement(
    UnifiedErrorBoundaryComponent,
    { 
      ...props,
      ref: (ref: UnifiedErrorBoundaryComponent | null) => {
        if (ref) {
          (ref as any).errorTracking = errorTracking;
        }
      }
    }
  );
};