import React from 'react';
import { GeneralLedgerReport } from '@/components/Accounting/GeneralLedgerReport';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, FileText, Download, Calculator, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const GeneralLedger = () => {
  const navigate = useNavigate();

  const ledgerFeatures = [
    {
      title: "استعراض الحسابات",
      description: "عرض تفصيلي لحركة جميع الحسابات المحاسبية",
      icon: <BookOpen className="w-5 h-5" />,
      action: "عرض الحسابات"
    },
    {
      title: "تقارير دفتر الأستاذ",
      description: "طباعة وتصدير تقارير دفتر الأستاذ بصيغ مختلفة",
      icon: <FileText className="w-5 h-5" />,
      action: "إنشاء التقرير"
    },
    {
      title: "البحث والفلترة",
      description: "البحث في الحسابات وفلترة النتائج حسب الفترة والنوع",
      icon: <Search className="w-5 h-5" />,
      action: "فتح البحث"
    },
    {
      title: "تحليل الأرصدة",
      description: "تحليل أرصدة الحسابات وحركتها خلال فترة محددة",
      icon: <Calculator className="w-5 h-5" />,
      action: "تحليل الأرصدة"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">دفتر الأستاذ العام</h1>
          <p className="text-muted-foreground">عرض وإدارة حركة الحسابات المحاسبية</p>
        </div>
        
        <div className="flex items-center gap-2 flex-row-reverse">
          <Button 
            variant="outline" 
            onClick={() => navigate('/financial-reports')}
            className="rtl-flex"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للتقارير المالية
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/chart-of-accounts')}
            className="rtl-flex"
          >
            <BookOpen className="w-4 h-4" />
            دليل الحسابات
          </Button>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {ledgerFeatures.map((feature, index) => (
          <Card key={index} className="card-elegant hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg rtl-flex">
                {feature.icon}
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 text-right">{feature.description}</p>
              <Button size="sm" className="w-full">
                {feature.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Ledger Report */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            دفتر الأستاذ العام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GeneralLedgerReport />
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralLedger;