import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useDiagnostics } from '@/hooks/useDiagnostics';
import { AlertCircle, CheckCircle, RefreshCw, User, Building, Shield, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const DiagnosticDashboard: React.FC = () => {
  const { diagnosticResult, loading, runDiagnostics, clearDiagnostics } = useDiagnostics();
  const { user, session, refreshSession, forceSessionRefresh, sessionTimeRemaining } = useAuth();

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'منتهية';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
    return `${minutes} دقيقة`;
  };

  const getStatusIcon = (hasError: boolean) => {
    return hasError ? (
      <AlertCircle className="h-5 w-5 text-destructive" />
    ) : (
      <CheckCircle className="h-5 w-5 text-success" />
    );
  };

  const getStatusBadge = (condition: boolean, successText: string, errorText: string) => {
    return (
      <Badge variant={condition ? "secondary" : "destructive"}>
        {condition ? successText : errorText}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="rtl-flex">
        <CardTitle className="rtl-title flex items-center gap-2">
          <Shield className="h-6 w-6" />
          لوحة تشخيص النظام
        </CardTitle>
        <CardDescription>
          فحص شامل لحالة المصادقة والأذونات في النظام
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={loading}
            className="rtl-flex"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            تشغيل التشخيص
          </Button>
          {diagnosticResult && (
            <Button variant="outline" onClick={clearDiagnostics}>
              مسح النتائج
            </Button>
          )}
          {session && (
            <Button 
              variant="secondary" 
              onClick={forceSessionRefresh}
              className="rtl-flex"
            >
              <RefreshCw className="h-4 w-4" />
              تحديث الجلسة
            </Button>
          )}
        </div>

        {diagnosticResult && (
          <div className="space-y-4">
            <Separator />
            
            {/* Summary Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm rtl-title flex items-center gap-2">
                    <User className="h-4 w-4" />
                    المصادقة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(!diagnosticResult.isAuthenticated)}
                    {getStatusBadge(
                      diagnosticResult.isAuthenticated,
                      'مصادق عليه',
                      'غير مصادق'
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm rtl-title flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    المؤسسة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(!diagnosticResult.tenantId)}
                    {getStatusBadge(
                      !!diagnosticResult.tenantId,
                      'محدد',
                      'غير محدد'
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm rtl-title flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    الصلاحيات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnosticResult.permissions.length === 0)}
                    <Badge variant={diagnosticResult.permissions.length > 0 ? "secondary" : "destructive"}>
                      {diagnosticResult.permissions.length} دور
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm rtl-title flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    الجلسة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(!diagnosticResult.sessionValid)}
                    {getStatusBadge(
                      diagnosticResult.sessionValid,
                      'صالحة',
                      'منتهية'
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg rtl-title">التفاصيل التقنية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">معرف المستخدم:</div>
                    <div className="text-sm font-mono bg-muted p-2 rounded mt-1">
                      {diagnosticResult.userId || 'غير متوفر'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">معرف المؤسسة:</div>
                    <div className="text-sm font-mono bg-muted p-2 rounded mt-1">
                      {diagnosticResult.tenantId || 'غير متوفر'}
                    </div>
                  </div>
                </div>

                {diagnosticResult.permissions.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">الأدوار والصلاحيات:</div>
                    <div className="flex flex-wrap gap-2">
                      {diagnosticResult.permissions.map((permission, index) => (
                        <Badge key={index} variant="secondary">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-muted-foreground">وقت التشخيص:</div>
                  <div className="text-sm text-muted-foreground">
                    {diagnosticResult.timestamp.toLocaleString('ar-KW')}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg rtl-title flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  معلومات الجلسة المحسنة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {session ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">البريد الإلكتروني: </span>
                      {user?.email || 'غير متوفر'}
                    </div>
                    <div>
                      <span className="font-medium">الوقت المتبقي: </span>
                      <span className={sessionTimeRemaining < 300 ? 'text-destructive font-medium' : ''}>
                        {formatTimeRemaining(sessionTimeRemaining)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">انتهاء الجلسة: </span>
                      {diagnosticResult?.sessionInfo.expiresAt ? 
                        new Date(diagnosticResult.sessionInfo.expiresAt).toLocaleString('ar-KW') : 
                        'غير متوفر'
                      }
                    </div>
                    <div>
                      <span className="font-medium">يمكن التحديث: </span>
                      <Badge variant={diagnosticResult?.sessionInfo.canRefresh ? "secondary" : "outline"}>
                        {diagnosticResult?.sessionInfo.canRefresh ? 'نعم' : 'لا'}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">آخر تحديث: </span>
                      {diagnosticResult?.sessionInfo.lastRefresh ? 
                        new Date(diagnosticResult.sessionInfo.lastRefresh).toLocaleString('ar-KW') : 
                        'غير متوفر'
                      }
                    </div>
                    <div>
                      <span className="font-medium">نوع المصادقة: </span>
                      {session.token_type || 'bearer'}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    لا توجد جلسة نشطة
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warnings */}
            {diagnosticResult.warnings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg rtl-title text-yellow-600 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    التحذيرات ({diagnosticResult.warnings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {diagnosticResult.warnings.map((warning, index) => (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-sm text-yellow-800">
                          {warning}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Errors */}
            {diagnosticResult.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg rtl-title text-destructive flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    الأخطاء والتحذيرات ({diagnosticResult.errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {diagnosticResult.errors.map((error, index) => (
                      <div key={index} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <div className="text-sm text-destructive">
                          {error}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!diagnosticResult && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            انقر على "تشغيل التشخيص" لبدء فحص النظام
          </div>
        )}
      </CardContent>
    </Card>
  );
};