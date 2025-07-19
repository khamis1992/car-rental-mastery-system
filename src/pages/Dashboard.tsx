import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Car, 
  Users, 
  FileText, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  BarChart3,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const Dashboard = () => {
  // Mock data - في التطبيق الحقيقي سيأتي من قاعدة البيانات
  const kpiData = [
    {
      title: "إجمالي العقود",
      value: "156",
      change: "+12%",
      changeType: "positive",
      icon: <FileText className="w-5 h-5" />,
      description: "من الشهر الماضي"
    },
    {
      title: "الإيرادات الشهرية",
      value: "45,231 د.ك",
      change: "+8%",
      changeType: "positive",
      icon: <DollarSign className="w-5 h-5" />,
      description: "من الشهر الماضي"
    },
    {
      title: "العملاء النشطين",
      value: "89",
      change: "+3%",
      changeType: "positive",
      icon: <Users className="w-5 h-5" />,
      description: "من الشهر الماضي"
    },
    {
      title: "المركبات المؤجرة",
      value: "134",
      change: "-2%",
      changeType: "negative",
      icon: <Car className="w-5 h-5" />,
      description: "من الشهر الماضي"
    }
  ];

  const recentTransactions = [
    { id: 1, customer: "شركة الكويت التجارية", amount: "2,500 د.ك", type: "إيجار", status: "مكتمل", date: "2024-01-15" },
    { id: 2, customer: "محمد أحمد السالم", amount: "800 د.ك", type: "إيجار", status: "معلق", date: "2024-01-14" },
    { id: 3, customer: "شركة الخليج للنقل", amount: "4,200 د.ك", type: "إيجار", status: "مكتمل", date: "2024-01-13" },
    { id: 4, customer: "فاطمة العلي", amount: "650 د.ك", type: "إيجار", status: "مكتمل", date: "2024-01-12" },
  ];

  const alerts = [
    { id: 1, type: "warning", message: "5 مركبات تحتاج صيانة دورية", icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 2, type: "info", message: "3 عقود تنتهي هذا الأسبوع", icon: <Calendar className="w-4 h-4" /> },
    { id: 3, type: "success", message: "تم تحصيل 12,500 د.ك اليوم", icon: <CheckCircle className="w-4 h-4" /> },
  ];

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">لوحة القيادة</h1>
            <p className="text-muted-foreground mt-1">نظرة عامة على أداء الشركة</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 ml-2" />
              التقارير
            </Button>
            <Button>
              <Calendar className="w-4 h-4 ml-2" />
              عقد جديد
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <div className="text-muted-foreground">{kpi.icon}</div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {kpi.changeType === "positive" ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs ${
                    kpi.changeType === "positive" ? "text-green-500" : "text-red-500"
                  }`}>
                    {kpi.change}
                  </span>
                  <span className="text-xs text-muted-foreground">{kpi.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  المعاملات الأخيرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{transaction.customer}</div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.type} - {transaction.date}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-bold">{transaction.amount}</div>
                        <Badge variant={transaction.status === "مكتمل" ? "default" : "secondary"}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4">
                  عرض جميع المعاملات
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Alerts & Quick Stats */}
          <div className="space-y-6">
            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>التنبيهات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                    alert.type === "warning" ? "border-yellow-500 bg-yellow-50" :
                    alert.type === "info" ? "border-blue-500 bg-blue-50" :
                    "border-green-500 bg-green-50"
                  }`}>
                    <div className="flex items-center gap-2">
                      {alert.icon}
                      <span className="text-sm">{alert.message}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>إحصائيات سريعة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>معدل الإشغال</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>التحصيل المالي</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>رضا العملاء</span>
                    <span>95%</span>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;