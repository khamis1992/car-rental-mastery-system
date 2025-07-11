import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign,
  Building2,
  CreditCard,
  TrendingUp,
  ArrowRight,
  Settings,
  Users,
  Receipt,
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBillingStats } from '@/hooks/useSaasData';
import SubscriptionPlansManager from './SubscriptionPlansManager';
import { SubscriptionPlan } from '@/types/unified-saas';

const BillingAndSubscriptions: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useBillingStats();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);

  // دالة تنسيق العملة
  const formatCurrency = (amount: number) => `${amount.toFixed(3)} د.ك`;

  const billingStats = [
    {
      title: "إجمالي الإيرادات",
      value: stats ? formatCurrency(stats.total_revenue) : "0.000 د.ك",
      icon: DollarSign,
      trend: `${stats?.growth_rate || 0}%`,
      trendUp: (stats?.growth_rate || 0) >= 0
    },
    {
      title: "الاشتراكات النشطة",
      value: stats?.active_subscriptions?.toString() || "0",
      icon: Building2,
      trend: `${stats?.trial_subscriptions || 0} تجريبي`,
      trendUp: true
    },
    {
      title: "الإيرادات الشهرية",
      value: stats ? formatCurrency(stats.monthly_revenue) : "0.000 د.ك",
      icon: TrendingUp,
      trend: "هذا الشهر",
      trendUp: true
    },
    {
      title: "الفواتير المتأخرة",
      value: stats?.overdue_invoices?.toString() || "0",
      icon: CreditCard,
      trend: "تحتاج متابعة",
      trendUp: false
    }
  ];

  const handleCreatePlan = () => {
    setIsCreatePlanOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الفوترة والاشتراكات</h1>
          <p className="text-muted-foreground">
            نظرة شاملة على جميع جوانب الفوترة وإدارة اشتراكات العملاء
          </p>
        </div>
      </div>

      {/* الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {billingStats.map((stat, index) => (
          <Card key={index} className="border-primary/20 hover:shadow-md transition-shadow">
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

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            خطط الاشتراك
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            الاشتراكات
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            الفواتير
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* الإجراءات السريعة */}
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
                    <p className="font-semibold text-warning">{stats?.overdue_invoices || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* النشاط الأخير */}
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
                  <span className="text-success font-medium">+500.000 د.ك</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">دفعة جديدة من مؤسسة النقل الحديث</p>
                    <p className="text-sm text-muted-foreground">فاتورة شهر يناير</p>
                  </div>
                  <span className="text-success font-medium">+150.000 د.ك</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">تذكير دفع لشركة التوصيل السريع</p>
                    <p className="text-sm text-muted-foreground">فاتورة متأخرة 5 أيام</p>
                  </div>
                  <span className="text-warning font-medium">75.000 د.ك</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <SubscriptionPlansManager 
            onCreatePlan={handleCreatePlan}
            onEditPlan={handleEditPlan}
          />
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>إدارة اشتراكات العملاء</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                هذا القسم قيد التطوير. سيتم إضافة إدارة اشتراكات العملاء قريباً.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>إدارة الفواتير</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                هذا القسم قيد التطوير. سيتم إضافة إدارة الفواتير والمدفوعات قريباً.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingAndSubscriptions;