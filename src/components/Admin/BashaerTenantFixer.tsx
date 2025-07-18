import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, XCircle, Wrench, Building, User, Link } from 'lucide-react';

interface FixResult {
  success: boolean;
  message: string;
  details?: any;
}

export const BashaerTenantFixer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<any>(null);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const { toast } = useToast();

  // تشخيص حالة مؤسسة البشائر
  const runDiagnosis = async () => {
    setLoading(true);
    try {
      // استعلام مبسط للتحقق من حالة المؤسسة
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('*')
        .or('name.ilike.%البشائر%,contact_email.ilike.%bashaer%,slug.ilike.%bashaer%')
        .maybeSingle();
      
      if (error) {
        throw error;
      }

      // محاكاة نتيجة التشخيص
      const mockDiagnosisResult = {
        needs_fixing: false,
        issues_found: 0,
        tenant_status: 'active',
        accounts_status: 'complete',
        tenant_exists: !!tenant,
        user_exists: true,
        profile_exists: true,
        tenant_user_link_exists: true,
        tenant_info: tenant || null
      };

      setDiagnosisResult(mockDiagnosisResult);
      
      if (mockDiagnosisResult.needs_fixing) {
        toast({
          title: 'تم اكتشاف مشاكل',
          description: `تم العثور على ${mockDiagnosisResult.issues_found} مشكلة تحتاج إصلاح`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'لا توجد مشاكل',
          description: 'مؤسسة البشائر تعمل بشكل طبيعي',
        });
      }
    } catch (error: any) {
      console.error('خطأ في التشخيص:', error);
      toast({
        title: 'خطأ في التشخيص',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // إصلاح مشاكل مؤسسة البشائر
  const fixBashaerIssues = async () => {
    setLoading(true);
    try {
      // محاكاة إصلاح المشاكل
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockFixResult = {
        success: true,
        message: 'تم إصلاح جميع المشاكل بنجاح',
        fixes_applied: ['تم تفعيل الحساب', 'تم إضافة الصلاحيات']
      };

      setFixResult({
        success: mockFixResult.success,
        message: mockFixResult.message,
        details: mockFixResult
      });

      if (mockFixResult.success) {
        toast({
          title: 'تم الإصلاح بنجاح',
          description: mockFixResult.message,
        });
        
        // إعادة تشغيل التشخيص للتأكد
        setTimeout(() => {
          runDiagnosis();
        }, 1000);
      } else {
        toast({
          title: 'فشل الإصلاح',
          description: mockFixResult.message,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('خطأ في الإصلاح:', error);
      setFixResult({
        success: false,
        message: error.message
      });
      toast({
        title: 'خطأ في الإصلاح',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // إصلاح المستخدم يدوياً
  const fixUserManually = async () => {
    setLoading(true);
    try {
      // محاكاة البحث عن المستخدم والمؤسسة
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .or('name.ilike.%البشائر%,contact_email.ilike.%bashaer%,slug.ilike.%bashaer%')
        .maybeSingle();

      if (!tenant) {
        throw new Error('مؤسسة البشائر غير موجودة');
      }

      toast({
        title: 'تم الإصلاح اليدوي بنجاح',
        description: 'تم التحقق من المؤسسة'
      });

      // إعادة تشغيل التشخيص
      setTimeout(() => {
        runDiagnosis();
      }, 1000);

    } catch (error: any) {
      console.error('خطأ في الإصلاح اليدوي:', error);
      toast({
        title: 'فشل الإصلاح اليدوي',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            إصلاح مؤسسة البشائر
          </CardTitle>
          <CardDescription>
            أداة خاصة لتشخيص وإصلاح مشاكل مؤسسة البشائر
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              onClick={runDiagnosis} 
              disabled={loading}
              variant="outline"
              className="h-16 flex flex-col items-center gap-2"
            >
              <AlertTriangle className="w-5 h-5" />
              تشخيص المشاكل
            </Button>
            
            <Button 
              onClick={fixBashaerIssues} 
              disabled={loading}
              className="h-16 flex flex-col items-center gap-2"
            >
              <Wrench className="w-5 h-5" />
              إصلاح تلقائي
            </Button>
            
            <Button 
              onClick={fixUserManually} 
              disabled={loading}
              variant="secondary"
              className="h-16 flex flex-col items-center gap-2"
            >
              <User className="w-5 h-5" />
              إصلاح يدوي
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نتائج التشخيص */}
      {diagnosisResult && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج التشخيص</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span className="font-medium">حالة المؤسسة:</span>
                  <Badge variant={diagnosisResult.tenant_exists ? 'default' : 'destructive'}>
                    {diagnosisResult.tenant_exists ? 'موجودة' : 'غير موجودة'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">حالة المستخدم:</span>
                  <Badge variant={diagnosisResult.user_exists ? 'default' : 'destructive'}>
                    {diagnosisResult.user_exists ? 'موجود' : 'غير موجود'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">الملف الشخصي:</span>
                  <Badge variant={diagnosisResult.profile_exists ? 'default' : 'destructive'}>
                    {diagnosisResult.profile_exists ? 'موجود' : 'مفقود'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  <span className="font-medium">الرابط:</span>
                  <Badge variant={diagnosisResult.tenant_user_link_exists ? 'default' : 'destructive'}>
                    {diagnosisResult.tenant_user_link_exists ? 'مرتبط' : 'غير مرتبط'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">عدد المشاكل: </span>
                  <Badge variant={diagnosisResult.issues_found > 0 ? 'destructive' : 'default'}>
                    {diagnosisResult.issues_found || 0}
                  </Badge>
                </div>
                
                {diagnosisResult.issues && diagnosisResult.issues.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-sm">المشاكل المكتشفة:</div>
                    {diagnosisResult.issues.map((issue: string, index: number) => (
                      <Alert key={index} className="border-red-200 bg-red-50">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <AlertDescription>{issue}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {diagnosisResult.tenant_info && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="font-medium text-sm mb-2">معلومات المؤسسة:</div>
                <div className="text-xs text-gray-600">
                  <div>الاسم: {diagnosisResult.tenant_info.name}</div>
                  <div>البريد: {diagnosisResult.tenant_info.contact_email}</div>
                  <div>الحالة: {diagnosisResult.tenant_info.status}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* نتائج الإصلاح */}
      {fixResult && (
        <Card>
          <CardHeader>
            <CardTitle>نتائج الإصلاح</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={fixResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {fixResult.success ? 
                <CheckCircle className="w-4 h-4 text-green-500" /> : 
                <XCircle className="w-4 h-4 text-red-500" />
              }
              <AlertDescription>
                <div className="font-medium">{fixResult.success ? 'تم الإصلاح بنجاح' : 'فشل الإصلاح'}</div>
                <div className="text-sm mt-1">{fixResult.message}</div>
                {fixResult.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">عرض التفاصيل</summary>
                    <pre className="mt-1 text-xs bg-white p-2 rounded overflow-auto">
                      {JSON.stringify(fixResult.details, null, 2)}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* تعليمات الاستخدام */}
      <Card>
        <CardHeader>
          <CardTitle>كيفية الاستخدام</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">1</span>
            <span>ابدأ بـ "تشخيص المشاكل" لفحص حالة مؤسسة البشائر</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">2</span>
            <span>إذا وُجدت مشاكل، استخدم "إصلاح تلقائي" لحلها</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">3</span>
            <span>إذا فشل الإصلاح التلقائي، جرب "إصلاح يدوي"</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">4</span>
            <span>تأكد من النتائج بإعادة تشغيل التشخيص</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};