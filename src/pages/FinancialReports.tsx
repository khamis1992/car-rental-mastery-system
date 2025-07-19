
import React from 'react';
import { FinancialReportsTab } from '@/components/Accounting/FinancialReportsTab';
import { GeneralLedgerReport } from '@/components/Accounting/GeneralLedgerReport';
import { AccountingDashboard } from '@/components/Accounting/AccountingDashboard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Calendar, TrendingUp, FileText, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

const FinancialReports = () => {
  const navigate = useNavigate();

  const reportTypes = [
    {
      title: "التحليل التقليدي",
      description: "تقرير شامل بالأرصدة الافتتاحية والختامية",
      icon: <TrendingUp className="w-5 h-5" />,
      action: "عرض التحليل التقليدي"
    },
    {
      title: "ميزان المراجعة المحسن",
      description: "ميزان شامل بحركة الفترة والأرصدة",
      icon: <TrendingUp className="w-5 h-5" />,
      action: "عرض الميزان المحسن"
    },
    {
      title: "قائمة الدخل",
      description: "تقرير الإيرادات والمصروفات",
      icon: <FileText className="w-5 h-5" />,
      action: "إنشاء التقرير"
    },
    {
      title: "الميزانية العمومية",
      description: "الأصول والخصوم وحقوق الملكية",
      icon: <FileText className="w-5 h-5" />,
      action: "إنشاء التقرير"
    },
    {
      title: "قائمة التدفقات النقدية",
      description: "حركة النقد والنقد المعادل",
      icon: <TrendingUp className="w-5 h-5" />,
      action: "إنشاء التقرير"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">التقارير المالية</h1>
          <p className="text-muted-foreground">إنشاء وعرض التقارير المالية والمحاسبية</p>
        </div>
        
        <div className="flex items-center gap-2 flex-row-reverse">
          <Button 
            variant="outline" 
            onClick={() => navigate('/chart-of-accounts')}
            className="rtl-flex"
          >
            <ArrowRight className="w-4 h-4" />
            العودة لدليل الحسابات
          </Button>
          <Button variant="outline" className="rtl-flex">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button variant="outline" className="rtl-flex">
            <Calendar className="w-4 h-4" />
            تخصيص الفترة
          </Button>
          <Button className="btn-primary rtl-flex">
            <Download className="w-4 h-4" />
            تصدير جميع التقارير
          </Button>
        </div>
      </div>

      {/* Quick Reports Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report, index) => (
          <Card key={index} className="card-elegant hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg rtl-flex">
                {report.icon}
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 text-right">{report.description}</p>
              <Button size="sm" className="w-full">
                {report.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">لوحة المعلومات</TabsTrigger>
          <TabsTrigger value="reports">التقارير المحاسبية</TabsTrigger>
          <TabsTrigger value="ledger">دفتر الأستاذ</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <AccountingDashboard />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FinancialReportsTab />
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          <GeneralLedgerReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;
