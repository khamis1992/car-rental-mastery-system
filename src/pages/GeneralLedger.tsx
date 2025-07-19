
import React, { useRef } from 'react';
import { GeneralLedgerReport } from '@/components/Accounting/GeneralLedgerReport';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, FileText, Download, Calculator, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const GeneralLedger = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  const handleViewAccounts = () => {
    if (reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth' });
      toast({
        title: "عرض الحسابات",
        description: "تم التمرير إلى تقرير دفتر الأستاذ العام",
      });
    }
  };

  const handleGenerateReport = () => {
    const content = document.getElementById('general-ledger-report');
    if (content) {
      window.print();
      toast({
        title: "إنشاء التقرير",
        description: "تم فتح نافذة الطباعة لطباعة التقرير",
      });
    } else {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على محتوى التقرير",
        variant: "destructive",
      });
    }
  };

  const handleOpenSearch = () => {
    // Focus on search functionality within the report
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) {
      (searchInput as HTMLInputElement).focus();
      toast({
        title: "فتح البحث",
        description: "تم تفعيل خاصية البحث",
      });
    } else {
      toast({
        title: "البحث والفلترة",
        description: "استخدم خيارات الفلترة المتاحة في التقرير أدناه",
      });
    }
  };

  const handleAnalyzeBalances = () => {
    navigate('/financial-reports');
    toast({
      title: "تحليل الأرصدة",
      description: "تم التنقل إلى صفحة التقارير المالية لتحليل الأرصدة",
    });
  };

  const ledgerFeatures = [
    {
      title: "استعراض الحسابات",
      description: "عرض تفصيلي لحركة جميع الحسابات المحاسبية",
      icon: <BookOpen className="w-5 h-5" />,
      action: "عرض الحسابات",
      onClick: handleViewAccounts
    },
    {
      title: "تقارير دفتر الأستاذ",
      description: "طباعة وتصدير تقارير دفتر الأستاذ بصيغ مختلفة",
      icon: <FileText className="w-5 h-5" />,
      action: "إنشاء التقرير",
      onClick: handleGenerateReport
    },
    {
      title: "البحث والفلترة",
      description: "البحث في الحسابات وفلترة النتائج حسب الفترة والنوع",
      icon: <Search className="w-5 h-5" />,
      action: "فتح البحث",
      onClick: handleOpenSearch
    },
    {
      title: "تحليل الأرصدة",
      description: "تحليل أرصدة الحسابات وحركتها خلال فترة محددة",
      icon: <Calculator className="w-5 h-5" />,
      action: "تحليل الأرصدة",
      onClick: handleAnalyzeBalances
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


      {/* Main Ledger Report */}
      <Card className="card-elegant" ref={reportRef}>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            دفتر الأستاذ العام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div id="general-ledger-report">
            <GeneralLedgerReport />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralLedger;
