
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Loader2, RefreshCw, FileX } from 'lucide-react';

interface LoadingStateProps {
  loading: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  isEmpty = false,
  emptyMessage = "لا توجد بيانات",
  onRetry,
  children,
}) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-medium mb-2 text-destructive">حدث خطأ</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RefreshCw className="w-4 h-4 ml-2" />
                إعادة المحاولة
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileX className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/20">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-medium mb-2 text-destructive">حدث خطأ غير متوقع</h3>
              <p className="text-muted-foreground mb-6">
                {this.state.error?.message || 'خطأ غير معروف'}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 ml-2" />
                إعادة تحميل الصفحة
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
