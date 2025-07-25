import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Settings, LogOut } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';

interface TenantErrorBoundaryProps {
  children: React.ReactNode;
}

interface TenantErrorState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class TenantErrorBoundary extends React.Component<TenantErrorBoundaryProps, TenantErrorState> {
  constructor(props: TenantErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TenantErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Tenant Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return <TenantErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

interface TenantErrorFallbackProps {
  onRetry: () => void;
}

const TenantErrorFallback: React.FC<TenantErrorFallbackProps> = ({ onRetry }) => {
  const { error, loading, retryConnection, clearError } = useTenant();
  const { signOut, forceSessionRefresh } = useAuth();

  const handleRetry = async () => {
    try {
      clearError();
      await retryConnection();
      onRetry();
    } catch (err) {
      console.error('❌ خطأ في إعادة المحاولة:', err);
    }
  };

  const handleSessionRefresh = async () => {
    try {
      await forceSessionRefresh();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('❌ خطأ في تحديث الجلسة:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('❌ خطأ في تسجيل الخروج:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl">مشكلة في تحميل بيانات المؤسسة</CardTitle>
          <CardDescription>
            حدثت مشكلة في الاتصال أو تحميل بيانات المؤسسة
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>تفاصيل الخطأ</AlertTitle>
              <AlertDescription className="text-sm mt-2">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              disabled={loading}
              className="w-full"
              variant="default"
            >
              <RefreshCw className={`ml-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'جاري إعادة المحاولة...' : 'إعادة المحاولة'}
            </Button>

            <Button 
              onClick={handleSessionRefresh}
              variant="outline"
              className="w-full"
            >
              <Settings className="ml-2 h-4 w-4" />
              تحديث الجلسة
            </Button>

            <Button 
              onClick={handleSignOut}
              variant="ghost"
              className="w-full"
            >
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>

          <div className="pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};