import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  User,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export const SessionStatus: React.FC = () => {
  const { 
    sessionValid, 
    sessionTimeRemaining, 
    refreshSession, 
    forceSessionRefresh,
    user,
    session 
  } = useAuth();
  
  const { currentTenant, error: tenantError } = useTenant();
  const [refreshing, setRefreshing] = useState(false);

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'منتهية الصلاحية';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
    return `${minutes} دقيقة`;
  };

  const getStatusColor = (): string => {
    if (!sessionValid) return 'text-red-500';
    if (sessionTimeRemaining < 300) return 'text-yellow-500'; // أقل من 5 دقائق
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (!sessionValid) return XCircle;
    if (sessionTimeRemaining < 300) return AlertTriangle;
    return CheckCircle;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await forceSessionRefresh();
    } catch (error) {
      console.error('❌ خطأ في تحديث الجلسة:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          حالة الجلسة
        </CardTitle>
        <CardDescription>
          معلومات الجلسة الحالية والمصادقة
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Session Status */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${getStatusColor()}`} />
            <span className="font-medium">حالة الجلسة</span>
          </div>
          <Badge variant={sessionValid ? 'default' : 'destructive'}>
            {sessionValid ? 'نشطة' : 'منتهية'}
          </Badge>
        </div>

        {/* Time Remaining */}
        {sessionValid && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">الوقت المتبقي</span>
            </div>
            <span className={`text-sm font-mono ${getStatusColor()}`}>
              {formatTimeRemaining(sessionTimeRemaining)}
            </span>
          </div>
        )}

        {/* User Info */}
        {user && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">المستخدم</span>
            </div>
            <span className="text-sm text-muted-foreground truncate max-w-32">
              {user.email}
            </span>
          </div>
        )}

        {/* Tenant Info */}
        {currentTenant && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">المؤسسة</span>
            </div>
            <span className="text-sm text-muted-foreground truncate max-w-32">
              {currentTenant.name}
            </span>
          </div>
        )}

        {/* Session Warnings */}
        {!sessionValid && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              انتهت صلاحية الجلسة. يرجى تحديث الجلسة أو تسجيل الدخول مرة أخرى.
            </AlertDescription>
          </Alert>
        )}

        {sessionValid && sessionTimeRemaining < 300 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ستنتهي صلاحية الجلسة قريباً. سيتم التحديث التلقائي.
            </AlertDescription>
          </Alert>
        )}

        {tenantError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              {tenantError}
            </AlertDescription>
          </Alert>
        )}

        {/* Refresh Button */}
        <Button 
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className={`ml-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'جاري التحديث...' : 'تحديث الجلسة'}
        </Button>
      </CardContent>
    </Card>
  );
};