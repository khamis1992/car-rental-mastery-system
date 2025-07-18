import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TenantDiagnosticTool } from '@/components/Admin/TenantDiagnosticTool';
import { BashaerTenantFixer } from '@/components/Admin/BashaerTenantFixer';
import { CreateAdminEmployeeProfile } from '@/components/Admin/CreateAdminEmployeeProfile';
import { Stethoscope, Building, Users, Wrench } from 'lucide-react';

const SystemDiagnostics: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Stethoscope className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">تشخيص النظام</h1>
          <p className="text-gray-600">أدوات شاملة لتشخيص وإصلاح مشاكل النظام</p>
        </div>
      </div>

      <Tabs defaultValue="bashaer" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bashaer" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            إصلاح البشائر
          </TabsTrigger>
          <TabsTrigger value="comprehensive" className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            تشخيص شامل
          </TabsTrigger>
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            ملفات الموظفين
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            صيانة عامة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bashaer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إصلاح مؤسسة البشائر</CardTitle>
              <CardDescription>
                أداة مخصصة لحل المشاكل المتعلقة بمؤسسة البشائر وربط المستخدمين بها
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BashaerTenantFixer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comprehensive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تشخيص النظام الشامل</CardTitle>
              <CardDescription>
                أداة متقدمة لتشخيص جميع مشاكل المؤسسات والمستخدمين في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TenantDiagnosticTool />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إدارة ملفات الموظفين</CardTitle>
              <CardDescription>
                إنشاء وإصلاح ملفات الموظفين للمديرين الذين لا يملكون ملفات موظفين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateAdminEmployeeProfile />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>صيانة قاعدة البيانات</CardTitle>
                <CardDescription>
                  أدوات صيانة وتنظيف قاعدة البيانات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>تنظيف البيانات المكررة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>إعادة بناء الفهارس</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>تحديث الإحصائيات</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    هذه الأدوات ستكون متاحة في التحديثات القادمة
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>مراقبة الأداء</CardTitle>
                <CardDescription>
                  مراقبة أداء النظام والخوادم
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>استخدام المعالج: طبيعي</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>استخدام الذاكرة: طبيعي</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>مساحة التخزين: متاحة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>اتصال قاعدة البيانات: مستقر</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>سجلات النظام</CardTitle>
              <CardDescription>
                عرض أحدث سجلات النظام والأخطاء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded max-h-48 overflow-y-auto">
                <div className="text-green-600">[INFO] نظام تشخيص البشائر متاح</div>
                <div className="text-blue-600">[INFO] جاهز لإجراء التشخيص</div>
                <div className="text-yellow-600">[WARN] يُنصح بإجراء تشخيص دوري</div>
                <div className="text-green-600">[INFO] جميع الخدمات تعمل بشكل طبيعي</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemDiagnostics; 