import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  Database,
  TrendingUp,
  Globe,
  Activity,
  AlertCircle
} from "lucide-react";
import SuperAdminStats from "@/components/SuperAdmin/SuperAdminStats";

const MainDashboard: React.FC = () => {
  return (
    <div className="h-full p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-row-reverse">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground text-right flex-row-reverse">
            <Globe className="w-4 h-4" />
            <span>النظام العام</span>
          </div>
        </div>

        {/* Statistics Overview */}
        <SuperAdminStats />

        {/* Quick Actions Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right flex-row-reverse justify-end">
                <Activity className="w-5 h-5 text-primary" />
                مراقبة النظام الفورية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-right">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الخوادم النشطة</span>
                  <span className="font-medium text-success">3/3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">زمن الاستجابة</span>
                  <span className="font-medium">127ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">استخدام المعالج</span>
                  <span className="font-medium">45%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right flex-row-reverse justify-end">
                <Database className="w-5 h-5 text-primary" />
                حالة قاعدة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-right">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">حجم البيانات</span>
                  <span className="font-medium">2.3 GB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الاتصالات النشطة</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">آخر نسخة احتياطية</span>
                  <span className="font-medium text-success">منذ ساعة</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right flex-row-reverse justify-end">
                <AlertCircle className="w-5 h-5 text-primary" />
                التنبيهات الهامة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-right">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">تنبيهات عالية</span>
                  <span className="font-medium text-destructive">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">تنبيهات متوسطة</span>
                  <span className="font-medium text-warning">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">إشعارات عامة</span>
                  <span className="font-medium text-info">5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-right flex-row-reverse justify-end">
              <Activity className="w-5 h-5 text-primary" />
              النشاطات الأخيرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-right">
              <div className="flex items-center gap-3 p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">تم إنشاء مؤسسة جديدة</p>
                  <p className="text-xs text-muted-foreground">منذ 15 دقيقة</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">تحديث إعدادات النظام</p>
                  <p className="text-xs text-muted-foreground">منذ 45 دقيقة</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-2 h-2 bg-info rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">نسخ احتياطي مجدول</p>
                  <p className="text-xs text-muted-foreground">منذ ساعتين</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MainDashboard; 