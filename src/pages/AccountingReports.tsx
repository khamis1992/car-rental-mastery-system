import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, TrendingUp, FileBarChart, Building2, DollarSign, Calculator, ChartBar } from 'lucide-react';
import { toast } from 'sonner';
import CustomerStatementReport from '@/components/Accounting/CustomerStatementReport';
import CustomerAnalyticsReport from '@/components/Accounting/CustomerAnalyticsReport';
import CustomersOverviewReport from '@/components/Accounting/CustomersOverviewReport';
import FixedAssetsReport from '@/components/Accounting/FixedAssetsReport';
import AccountingDashboard from '@/components/Accounting/AccountingDashboard';

const AccountingReports = () => {
  const [selectedTab, setSelectedTab] = useState('dashboard');

  const reportStats = [
    {
      title: 'إجمالي العملاء',
      value: '247',
      icon: Users,
      color: 'bg-blue-500',
      description: 'عدد العملاء النشطين'
    },
    {
      title: 'الإيرادات الشهرية',
      value: '125,430 د.ك',
      icon: DollarSign,
      color: 'bg-green-500',
      description: 'إيرادات الشهر الحالي'
    },
    {
      title: 'نسبة التحصيل',
      value: '89.2%',
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: 'معدل تحصيل الفواتير'
    },
    {
      title: 'الأصول الثابتة',
      value: '2,847,500 د.ك',
      icon: Building2,
      color: 'bg-orange-500',
      description: 'إجمالي قيمة الأصول'
    }
  ];

  const reportTabs = [
    {
      id: 'dashboard',
      title: 'لوحة المعلومات',
      icon: ChartBar,
      description: 'نظرة عامة على جميع التقارير'
    },
    {
      id: 'customer-statement',
      title: 'كشف حساب العميل',
      icon: FileBarChart,
      description: 'تفاصيل العمليات المالية للعملاء'
    },
    {
      id: 'customer-analytics',
      title: 'التحليل التفصيلي للعميل',
      icon: Calculator,
      description: 'التحليلات المالية المتقدمة'
    },
    {
      id: 'customers-overview',
      title: 'التقرير المجمع للعملاء',
      icon: Users,
      description: 'ملخص شامل لجميع العملاء'
    },
    {
      id: 'fixed-assets',
      title: 'تقرير الأصول الثابتة',
      icon: Building2,
      description: 'إدارة ومتابعة الأصول والإهلاك'
    }
  ];

  const handleExportAll = () => {
    toast.success('جاري تصدير جميع التقارير...');
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">التقارير المحاسبية والتحليلية</h1>
          <p className="text-gray-600 mt-2">
            وحدة التقارير المحاسبية المتقدمة - متكاملة مع شجرة الحسابات والعقود
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportAll} className="bg-green-600 hover:bg-green-700">
            <FileBarChart className="w-4 h-4 mr-2" />
            تصدير جميع التقارير
          </Button>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('ar-SA')}
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5" />
            التقارير والتحليلات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
              {reportTabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab Descriptions */}
            <div className="mt-4 mb-6">
              {reportTabs.map((tab) => (
                selectedTab === tab.id && (
                  <div key={tab.id} className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-1">{tab.title}</h3>
                    <p className="text-sm text-gray-600">{tab.description}</p>
                  </div>
                )
              ))}
            </div>

            {/* Tab Contents */}
            <TabsContent value="dashboard" className="space-y-4">
              <AccountingDashboard />
            </TabsContent>

            <TabsContent value="customer-statement" className="space-y-4">
              <CustomerStatementReport />
            </TabsContent>

            <TabsContent value="customer-analytics" className="space-y-4">
              <CustomerAnalyticsReport />
            </TabsContent>

            <TabsContent value="customers-overview" className="space-y-4">
              <CustomersOverviewReport />
            </TabsContent>

            <TabsContent value="fixed-assets" className="space-y-4">
              <FixedAssetsReport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Integration Notice */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">التكامل المحاسبي</h3>
              <p className="text-sm text-gray-600 mb-3">
                جميع التقارير مرتبطة بشجرة الحسابات المحاسبية الموجودة ويتم تطبيق القيود المحاسبية تلقائياً:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">112</Badge>
                  <span>الذمم المدينة - العملاء</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">121</Badge>
                  <span>الأصول الثابتة - المركبات</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">411</Badge>
                  <span>إيرادات التأجير</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">513</Badge>
                  <span>مصروف الإهلاك</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountingReports; 