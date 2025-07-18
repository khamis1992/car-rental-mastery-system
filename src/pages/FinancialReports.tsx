import React from 'react';
import { FinancialReportsTab } from '@/components/Accounting/FinancialReportsTab';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Calendar, TrendingUp, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FinancialReports = () => {
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
          <h1 className="text-3xl font-bold text-foreground">التقارير المالية</h1>
          <p className="text-muted-foreground">إنشاء وعرض التقارير المالية والمحاسبية</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            تخصيص الفترة
          </Button>
          <Button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            تصدير جميع التقارير
          </Button>
        </div>
      </div>

      {/* Quick Reports Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report, index) => (
          <Card key={index} className="card-elegant hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {report.icon}
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              <Button size="sm" className="w-full">
                {report.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Reports Interface */}
      <FinancialReportsTab />
    </div>
  );
};

export default FinancialReports;