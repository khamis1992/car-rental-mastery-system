import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Play, X } from 'lucide-react';
import { useDiagnostics } from '@/hooks/useDiagnostics';

interface DiagnosticPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({ isOpen, onClose }) => {
  const { diagnosticResult, loading, runDiagnostics, clearDiagnostics } = useDiagnostics();

  if (!isOpen) return null;

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="w-4 h-4 text-success" />
    ) : (
      <XCircle className="w-4 h-4 text-destructive" />
    );
  };

  const getStatusColor = (condition: boolean): "default" | "secondary" | "destructive" | "outline" => {
    return condition ? 'secondary' : 'destructive';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="rtl-title">لوحة التشخيص</CardTitle>
            <CardDescription>
              فحص حالة المصادقة والصلاحيات
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-row-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={runDiagnostics}
              disabled={loading}
              className="rtl-flex"
            >
              <Play className="w-4 h-4" />
              {loading ? 'جاري الفحص...' : 'تشغيل التشخيص'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rtl-flex"
            >
              <X className="w-4 h-4" />
              إغلاق
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {diagnosticResult && (
            <>
              {/* ملخص الحالة */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 rtl-flex">
                  {getStatusIcon(diagnosticResult.isAuthenticated)}
                  <span>حالة المصادقة</span>
                  <Badge variant={getStatusColor(diagnosticResult.isAuthenticated)}>
                    {diagnosticResult.isAuthenticated ? 'مصادق عليه' : 'غير مصادق'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 rtl-flex">
                  {getStatusIcon(diagnosticResult.sessionValid)}
                  <span>صلاحية الجلسة</span>
                  <Badge variant={getStatusColor(diagnosticResult.sessionValid)}>
                    {diagnosticResult.sessionValid ? 'صالحة' : 'منتهية'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 rtl-flex">
                  {getStatusIcon(!!diagnosticResult.userId)}
                  <span>معرف المستخدم</span>
                  <Badge variant={getStatusColor(!!diagnosticResult.userId)}>
                    {diagnosticResult.userId ? 'موجود' : 'غير موجود'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 rtl-flex">
                  {getStatusIcon(!!diagnosticResult.tenantId)}
                  <span>معرف المؤسسة</span>
                  <Badge variant={getStatusColor(!!diagnosticResult.tenantId)}>
                    {diagnosticResult.tenantId ? 'موجود' : 'غير موجود'}
                  </Badge>
                </div>
              </div>

              {/* معلومات تفصيلية */}
              <div className="space-y-2">
                <h4 className="font-medium rtl-title">المعلومات التفصيلية</h4>
                <div className="text-sm space-y-1">
                  <p><strong>معرف المستخدم:</strong> {diagnosticResult.userId || 'غير متوفر'}</p>
                  <p><strong>معرف المؤسسة:</strong> {diagnosticResult.tenantId || 'غير متوفر'}</p>
                  <p><strong>وقت الفحص:</strong> {diagnosticResult.timestamp.toLocaleString('ar-KW')}</p>
                </div>
              </div>

              {/* الصلاحيات */}
              <div className="space-y-2">
                <h4 className="font-medium rtl-title">الصلاحيات</h4>
                {diagnosticResult.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {diagnosticResult.permissions.map((permission, index) => (
                      <Badge key={index} variant="secondary">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      لا توجد صلاحيات مُعينة للمستخدم
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* الأخطاء */}
              {diagnosticResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium rtl-title text-destructive">الأخطاء المكتشفة</h4>
                  <div className="space-y-2">
                    {diagnosticResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              {/* توصيات الإصلاح */}
              {diagnosticResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium rtl-title text-blue-600">توصيات الإصلاح</h4>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    {!diagnosticResult.isAuthenticated && (
                      <p>• قم بتسجيل الدخول مرة أخرى</p>
                    )}
                    {!diagnosticResult.sessionValid && (
                      <p>• تحديث الصفحة وإعادة تسجيل الدخول</p>
                    )}
                    {!diagnosticResult.tenantId && (
                      <p>• تواصل مع المدير لتعيين مؤسسة للحساب</p>
                    )}
                    {diagnosticResult.permissions.length === 0 && (
                      <p>• تواصل مع المدير لتعيين صلاحيات للحساب</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {!diagnosticResult && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                اضغط على "تشغيل التشخيص" لبدء فحص حالة النظام
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};