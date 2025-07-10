import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign,
  Building2,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard
} from "lucide-react";

const BillingOverview: React.FC = () => {
  const stats = [
    {
      title: "إجمالي الإيرادات الشهرية",
      value: "15,750 د.ك",
      change: "+12.5%",
      isPositive: true,
      icon: DollarSign
    },
    {
      title: "عدد المؤسسات النشطة",
      value: "24",
      change: "+3 هذا الشهر",
      isPositive: true,
      icon: Building2
    },
    {
      title: "متوسط القيمة لكل مؤسسة",
      value: "656 د.ك",
      change: "+8.2%",
      isPositive: true,
      icon: Users
    },
    {
      title: "المدفوعات المعلقة",
      value: "2,350 د.ك",
      change: "-15.3%",
      isPositive: false,
      icon: CreditCard
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1">
                    {stat.isPositive ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                    <span className={`text-sm ${stat.isPositive ? 'text-success' : 'text-destructive'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-primary p-3 rounded-xl">
                  <stat.icon className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>الإيرادات الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
            <p className="text-muted-foreground">سيتم إضافة مخطط الإيرادات هنا</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>المدفوعات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                <div>
                  <p className="font-medium">شركة البشائر الخليجية</p>
                  <p className="text-sm text-muted-foreground">خطة المؤسسة - شهر يناير</p>
                </div>
                <span className="text-success font-medium">+500 د.ك</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                <div>
                  <p className="font-medium">مؤسسة النقل الحديث</p>
                  <p className="text-sm text-muted-foreground">خطة المتقدمة - شهر يناير</p>
                </div>
                <span className="text-success font-medium">+300 د.ك</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                <div>
                  <p className="font-medium">شركة التوصيل السريع</p>
                  <p className="text-sm text-muted-foreground">خطة الأساسية - شهر يناير</p>
                </div>
                <span className="text-success font-medium">+150 د.ك</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>الفواتير المعلقة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                <div>
                  <p className="font-medium">شركة الخدمات اللوجستية</p>
                  <p className="text-sm text-muted-foreground">متأخرة 5 أيام</p>
                </div>
                <span className="text-warning font-medium">250 د.ك</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                <div>
                  <p className="font-medium">مؤسسة النقل التجاري</p>
                  <p className="text-sm text-muted-foreground">متأخرة 2 أيام</p>
                </div>
                <span className="text-warning font-medium">400 د.ك</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                <div>
                  <p className="font-medium">شركة المواصلات</p>
                  <p className="text-sm text-muted-foreground">متأخرة 15 يوم</p>
                </div>
                <span className="text-destructive font-medium">180 د.ك</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingOverview;