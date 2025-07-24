import React from 'react';
import { DiagnosticDashboard } from '@/components/diagnostics/DiagnosticDashboard';
import { AuthRepairTool } from '@/components/auth/AuthRepairTool';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Wrench, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const SystemDiagnostics: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold rtl-title">تشخيص النظام</h1>
        <p className="text-muted-foreground">
          أدوات شاملة لتشخيص وإصلاح مشاكل المصادقة والأذونات
        </p>
      </div>

      <Tabs defaultValue="diagnostics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diagnostics" className="rtl-flex">
            <Shield className="h-4 w-4 me-2" />
            التشخيص
          </TabsTrigger>
          <TabsTrigger value="repair" className="rtl-flex">
            <Wrench className="h-4 w-4 me-2" />
            الإصلاح
          </TabsTrigger>
          <TabsTrigger value="info" className="rtl-flex">
            <Info className="h-4 w-4 me-2" />
            معلومات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics" className="space-y-6">
          <DiagnosticDashboard />
        </TabsContent>

        <TabsContent value="repair" className="space-y-6">
          <AuthRepairTool />
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <Info className="h-5 w-5" />
                معلومات النظام
              </CardTitle>
              <CardDescription>
                معلومات مفيدة حول النظام والمشاكل الشائعة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2 rtl-title">المشاكل الشائعة وحلولها</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>مشكلة:</strong> "لا يمكن تحديد معرف المؤسسة"
                      <br />
                      <strong>الحل:</strong> استخدم أداة الإصلاح لإنشاء ارتباط المستخدم بالمؤسسة
                    </div>
                    <div>
                      <strong>مشكلة:</strong> "سياسات الأمان تمنع الوصول للحسابات"
                      <br />
                      <strong>الحل:</strong> تأكد من تسجيل الدخول وارتباط المستخدم بمؤسسة نشطة
                    </div>
                    <div>
                      <strong>مشكلة:</strong> "المستخدم لا يملك أي صلاحيات"
                      <br />
                      <strong>الحل:</strong> تحقق من جدول tenant_users وتأكد من تعيين دور مناسب
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2 rtl-title">الأدوار والصلاحيات</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <strong>super_admin:</strong> صلاحيات كاملة لكافة المؤسسات
                    </div>
                    <div>
                      <strong>tenant_admin:</strong> إدارة كاملة للمؤسسة
                    </div>
                    <div>
                      <strong>manager:</strong> إدارة العمليات والموظفين
                    </div>
                    <div>
                      <strong>accountant:</strong> إدارة المحاسبة والأصول
                    </div>
                    <div>
                      <strong>receptionist:</strong> إدارة العملاء والعقود
                    </div>
                    <div>
                      <strong>user:</strong> صلاحيات قراءة أساسية
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2 rtl-title">الوصول إلى قاعدة البيانات</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    يمكنك الوصول إلى قاعدة البيانات مباشرة لاستكشاف البيانات وحل المشاكل
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <a 
                      href="https://supabase.com/dashboard/project/rtottdvuftbqktzborvv/sql/new" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="rtl-flex"
                    >
                      <ExternalLink className="h-4 w-4 me-2" />
                      فتح محرر SQL
                    </a>
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2 rtl-title">نصائح للتطوير</h3>
                  <ul className="text-sm space-y-2 list-disc list-inside">
                    <li>استخدم أداة التشخيص بانتظام للتأكد من سلامة النظام</li>
                    <li>تحقق من جدول tenant_users للتأكد من ارتباط المستخدمين</li>
                    <li>راقب الأخطاء في وحدة التحكم للحصول على تفاصيل أكثر</li>
                    <li>استخدم get_current_user_info() للحصول على معلومات المستخدم الحالي</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};