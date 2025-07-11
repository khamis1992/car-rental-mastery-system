import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  Database,
  TrendingUp,
  Globe,
  Crown
} from "lucide-react";
import SuperAdminStats from "@/components/SuperAdmin/SuperAdminStats";
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';

const MainDashboard: React.FC = () => {
  const { currentUserRole } = useTenant();
  const { user } = useAuth();

  // التحقق من صلاحيات الوصول
  if (currentUserRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Crown className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2 text-destructive">غير مصرح بالوصول</h3>
            <p className="text-muted-foreground text-center">
              تحتاج إلى صلاحيات مدير النظام العام للوصول إلى هذه الصفحة
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
              <BarChart3 className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                لوحة التحكم الرئيسية
              </h1>
              <p className="text-muted-foreground">
                نظرة عامة شاملة على أداء النظام والإحصائيات الرئيسية
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground text-right">
            <Globe className="w-4 h-4" />
            <span>النظام العام</span>
          </div>
        </div>

        {/* Statistics Overview */}
        <SuperAdminStats />

        {/* Performance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <TrendingUp className="w-5 h-5 text-primary" />
                أداء النظام العام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-right">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">معدل الاستخدام</span>
                  <span className="font-medium">92%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">زمن الاستجابة</span>
                  <span className="font-medium">127ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">حالة الخوادم</span>
                  <span className="font-medium text-success">مستقرة</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الذاكرة المستخدمة</span>
                  <span className="font-medium">68%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right flex-row-reverse justify-end">
                <Database className="w-5 h-5 text-primary" />
                إحصائيات قاعدة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-right">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">حجم البيانات</span>
                  <span className="font-medium">2.3 GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">النسخ الاحتياطية</span>
                  <span className="font-medium text-success">محدثة</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الاتصالات النشطة</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الاستعلامات في الثانية</span>
                  <span className="font-medium">156</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <Crown className="w-5 h-5 text-primary" />
                نشاط المديرين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-right">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">المديرين المتصلين</span>
                  <span className="font-medium text-success">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">آخر نشاط</span>
                  <span className="font-medium">منذ 3 دقائق</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <TrendingUp className="w-5 h-5 text-primary" />
                الإيرادات الشهرية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-right">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">هذا الشهر</span>
                  <span className="font-medium text-success">15,240 ر.س</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الشهر السابق</span>
                  <span className="font-medium">12,850 ر.س</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <Globe className="w-5 h-5 text-primary" />
                حالة الأنظمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-right">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">خدمات الويب</span>
                  <span className="font-medium text-success">متاحة</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">قاعدة البيانات</span>
                  <span className="font-medium text-success">متاحة</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard; 