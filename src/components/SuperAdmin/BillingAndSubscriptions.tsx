import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign,
  Building2,
  CreditCard,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const BillingAndSubscriptions: React.FC = () => {
  const navigate = useNavigate();

  const billingStats = [
    {
      title: "إجمالي الإيرادات الشهرية",
      value: "15,750 د.ك",
      icon: DollarSign,
      trend: "+12.5%",
      trendUp: true
    },
    {
      title: "عدد المؤسسات النشطة",
      value: "24",
      icon: Building2,
      trend: "+3 هذا الشهر",
      trendUp: true
    },
    {
      title: "معدل التجديد",
      value: "94%",
      icon: TrendingUp,
      trend: "+2% من الشهر الماضي",
      trendUp: true
    },
    {
      title: "المدفوعات المعلقة",
      value: "2,350 د.ك",
      icon: CreditCard,
      trend: "4 فواتير",
      trendUp: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {billingStats.map((stat, index) => (
          <Card key={index} className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={`text-xs mt-1 ${stat.trendUp ? 'text-success' : 'text-warning'}`}>
                    {stat.trend}
                  </p>
                </div>
                <div className="bg-gradient-primary p-3 rounded-xl">
                  <stat.icon className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              إدارة الاشتراكات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              عرض وإدارة اشتراكات المؤسسات، تجديد الخطط، وتعديل الحدود
            </p>
            <Button 
              onClick={() => navigate('/billing')}
              className="w-full"
            >
              فتح إدارة الفوترة الكاملة
              <ArrowRight className="w-4 h-4 mr-2" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              الفواتير والمدفوعات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              متابعة الفواتير المرسلة، المدفوعات المستلمة، والمتأخرات
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="text-sm text-muted-foreground">فواتير مدفوعة</p>
                <p className="font-semibold text-success">22</p>
              </div>
              <div className="text-center p-3 bg-warning/10 rounded-lg">
                <p className="text-sm text-muted-foreground">فواتير معلقة</p>
                <p className="font-semibold text-warning">4</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            النشاط الأخير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">تم تجديد اشتراك شركة البشائر الخليجية</p>
                <p className="text-sm text-muted-foreground">خطة المؤسسة - 12 شهر</p>
              </div>
              <span className="text-success font-medium">+500 د.ك</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">دفعة جديدة من مؤسسة النقل الحديث</p>
                <p className="text-sm text-muted-foreground">فاتورة شهر يناير</p>
              </div>
              <span className="text-success font-medium">+150 د.ك</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium">تذكير دفع لشركة التوصيل السريع</p>
                <p className="text-sm text-muted-foreground">فاتورة متأخرة 5 أيام</p>
              </div>
              <span className="text-warning font-medium">75 د.ك</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingAndSubscriptions;