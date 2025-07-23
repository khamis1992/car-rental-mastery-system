import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  User,
  Shield,
  Database,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDiagnostics } from '@/hooks/useDiagnostics';

interface CustomerDiagnosticsProps {
  onClose: () => void;
}

const CustomerDiagnostics: React.FC<CustomerDiagnosticsProps> = ({ onClose }) => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { user, session, isAuthenticated } = useAuth();
  const { diagnosticResult, loading, runDiagnostics } = useDiagnostics();

  const runCustomerSpecificTests = async () => {
    setTesting(true);
    try {
      console.log('🔍 بدء اختبارات العملاء المخصصة...');
      
      const results = {
        timestamp: new Date(),
        authentication: {
          hasUser: !!user,
          hasSession: !!session,
          isAuthenticated,
          userId: user?.id || null
        },
        database: {
          canReadCustomers: false,
          canInsertCustomers: false,
          customerCount: 0,
          errors: []
        },
        functions: {
          canGenerateNumber: false,
          canGetUserInfo: false,
          errors: []
        }
      };

      // اختبار قراءة العملاء
      try {
        const { data: customers, error: readError } = await supabase
          .from('customers')
          .select('id, customer_number, name')
          .limit(5);
          
        if (readError) {
          results.database.errors.push(`خطأ في قراءة العملاء: ${readError.message}`);
        } else {
          results.database.canReadCustomers = true;
          results.database.customerCount = customers?.length || 0;
        }
      } catch (error) {
        results.database.errors.push(`خطأ في اختبار قراءة العملاء: ${error}`);
      }

      // اختبار دالة توليد رقم العميل
      try {
        const { data: generatedNumber, error: numberError } = await supabase
          .rpc('generate_customer_number_simple');
          
        if (numberError) {
          results.functions.errors.push(`خطأ في دالة توليد الرقم: ${numberError.message}`);
        } else {
          results.functions.canGenerateNumber = true;
          console.log('✅ تم توليد رقم العميل:', generatedNumber);
        }
      } catch (error) {
        results.functions.errors.push(`خطأ في اختبار دالة توليد الرقم: ${error}`);
      }

      // اختبار دالة معلومات المستخدم
      try {
        const { data: userInfo, error: userError } = await supabase
          .rpc('get_current_user_info');
          
        if (userError) {
          results.functions.errors.push(`خطأ في دالة معلومات المستخدم: ${userError.message}`);
        } else {
          results.functions.canGetUserInfo = true;
          console.log('✅ تم جلب معلومات المستخدم:', userInfo);
        }
      } catch (error) {
        results.functions.errors.push(`خطأ في اختبار دالة معلومات المستخدم: ${error}`);
      }

      // محاولة اختبار إدخال العميل (بدون تنفيذ فعلي)
      try {
        const testCustomerData = {
          customer_type: 'individual' as const,
          name: 'اختبار العميل',
          phone: '99999999',
          customer_number: 'TEST999999',
          created_by: user?.id
        };

        // تحقق من البيانات فقط بدون إدخال
        const { error: insertError } = await supabase
          .from('customers')
          .insert(testCustomerData)
          .select()
          .limit(0); // لا ندخل البيانات فعلياً

        if (!insertError) {
          results.database.canInsertCustomers = true;
        } else {
          results.database.errors.push(`اختبار الإدخال فشل: ${insertError.message}`);
        }
      } catch (error) {
        results.database.errors.push(`خطأ في اختبار الإدخال: ${error}`);
      }

      setTestResults(results);
      console.log('📊 نتائج اختبار العملاء:', results);
      
    } catch (error) {
      console.error('💥 خطأ في اختبارات العملاء:', error);
      setTestResults({
        timestamp: new Date(),
        error: `خطأ عام في الاختبارات: ${error}`
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean, text: string) => {
    return (
      <Badge variant={status ? "default" : "destructive"} className="text-xs">
        {status ? "✅" : "❌"} {text}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            تشخيص مشاكل العملاء
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={runDiagnostics}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              تشخيص عام
            </Button>
            
            <Button
              onClick={runCustomerSpecificTests}
              disabled={testing}
              variant="outline"
              size="sm"
            >
              {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
              اختبار العملاء
            </Button>
            
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              إغلاق
            </Button>
          </div>

          {/* نتائج التشخيص العام */}
          {diagnosticResult && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">نتائج التشخيص العام:</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>المصادقة: {getStatusBadge(diagnosticResult.isAuthenticated, "مصادق")}</div>
                    <div>معرف المستخدم: {diagnosticResult.userId ? "✅ موجود" : "❌ غائب"}</div>
                    <div>معرف المؤسسة: {diagnosticResult.tenantId ? "✅ موجود" : "❌ غائب"}</div>
                    <div>الصلاحيات: {diagnosticResult.permissions.length > 0 ? `✅ ${diagnosticResult.permissions.join(', ')}` : "❌ لا توجد"}</div>
                  </div>
                  {diagnosticResult.errors.length > 0 && (
                    <div>
                      <div className="font-medium text-red-600">الأخطاء:</div>
                      <ul className="text-sm text-red-600 list-disc list-inside">
                        {diagnosticResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* نتائج اختبارات العملاء */}
          {testResults && (
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">اختبارات العملاء</span>
                    <span className="text-xs text-muted-foreground">
                      {testResults.timestamp.toLocaleTimeString('ar-KW')}
                    </span>
                  </div>

                  {testResults.error ? (
                    <div className="text-red-600">{testResults.error}</div>
                  ) : (
                    <div className="space-y-3">
                      {/* حالة المصادقة */}
                      <div>
                        <div className="font-medium mb-1">المصادقة:</div>
                        <div className="grid grid-cols-2 gap-1 text-sm">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(testResults.authentication.hasUser)}
                            <span>وجود المستخدم</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(testResults.authentication.hasSession)}
                            <span>وجود الجلسة</span>
                          </div>
                        </div>
                      </div>

                      {/* قاعدة البيانات */}
                      <div>
                        <div className="font-medium mb-1">قاعدة البيانات:</div>
                        <div className="grid grid-cols-2 gap-1 text-sm">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(testResults.database.canReadCustomers)}
                            <span>قراءة العملاء</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(testResults.database.canInsertCustomers)}
                            <span>إضافة العملاء</span>
                          </div>
                        </div>
                        {testResults.database.canReadCustomers && (
                          <div className="text-xs text-muted-foreground mt-1">
                            عدد العملاء المقروءة: {testResults.database.customerCount}
                          </div>
                        )}
                        {testResults.database.errors.length > 0 && (
                          <div className="mt-1">
                            <ul className="text-xs text-red-600 list-disc list-inside">
                              {testResults.database.errors.map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* الدوال */}
                      <div>
                        <div className="font-medium mb-1">دوال النظام:</div>
                        <div className="grid grid-cols-2 gap-1 text-sm">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(testResults.functions.canGenerateNumber)}
                            <span>توليد رقم العميل</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(testResults.functions.canGetUserInfo)}
                            <span>معلومات المستخدم</span>
                          </div>
                        </div>
                        {testResults.functions.errors.length > 0 && (
                          <div className="mt-1">
                            <ul className="text-xs text-red-600 list-disc list-inside">
                              {testResults.functions.errors.map((error: string, index: number) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* توصيات للإصلاح */}
          {(diagnosticResult || testResults) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">توصيات للإصلاح:</div>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {(!diagnosticResult?.isAuthenticated || !testResults?.authentication?.hasUser) && (
                      <li>تسجيل الخروج والدخول مرة أخرى</li>
                    )}
                    {(!diagnosticResult?.tenantId) && (
                      <li>التواصل مع المدير لضبط إعدادات المؤسسة</li>
                    )}
                    {diagnosticResult?.permissions.length === 0 && (
                      <li>طلب الصلاحيات المناسبة من المدير</li>
                    )}
                    {testResults?.database?.errors.length > 0 && (
                      <li>فحص سياسات الأمان في قاعدة البيانات</li>
                    )}
                    {testResults?.functions?.errors.length > 0 && (
                      <li>التأكد من تفعيل دوال النظام المطلوبة</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDiagnostics;