
import React, { useRef } from 'react';
import { GeneralLedgerReport } from '@/components/Accounting/GeneralLedgerReport';
import { ManualJournalEntryDialog } from '@/components/Accounting/ManualJournalEntryDialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, FileText, Download, Calculator, Search, Filter, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AccountingErrorBoundary } from '@/components/Accounting/AccountingErrorBoundary';
import { useSafeGeneralLedger } from '@/hooks/useSafeGeneralLedger';

const GeneralLedger = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  
  // استخدام الـ hook الآمن للحصول على بيانات الحسابات
  const { 
    accounts, 
    loading: accountsLoading, 
    error: accountsError,
    loadAccounts 
  } = useSafeGeneralLedger();

  const handleViewAccounts = React.useCallback(() => {
    try {
      if (reportRef.current) {
        reportRef.current.scrollIntoView({ behavior: 'smooth' });
        toast({
          title: "عرض الحسابات",
          description: "تم التمرير إلى تقرير دفتر الأستاذ العام",
        });
      }
    } catch (error) {
      console.error('❌ Error scrolling to report:', error);
    }
  }, [toast]);

  const handleGenerateReport = React.useCallback(() => {
    try {
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
    } catch (error) {
      console.error('❌ Error generating report:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء التقرير",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleOpenSearch = React.useCallback(() => {
    try {
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
    } catch (error) {
      console.error('❌ Error opening search:', error);
    }
  }, [toast]);

  const handleAnalyzeBalances = React.useCallback(() => {
    try {
      navigate('/financial-reports');
      toast({
        title: "تحليل الأرصدة",
        description: "تم التنقل إلى صفحة التقارير المالية لتحليل الأرصدة",
      });
    } catch (error) {
      console.error('❌ Error navigating to financial reports:', error);
    }
  }, [navigate, toast]);

  const handleEntryCreated = React.useCallback(() => {
    try {
      toast({
        title: "تم إنشاء القيد",
        description: "تم إنشاء القيد المحاسبي بنجاح",
      });
      // إعادة تحميل البيانات
      loadAccounts();
    } catch (error) {
      console.error('❌ Error handling entry creation:', error);
    }
  }, [toast, loadAccounts]);

  const ledgerFeatures = React.useMemo(() => [
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
  ], [handleViewAccounts, handleGenerateReport, handleOpenSearch, handleAnalyzeBalances]);

  // حساب عدد الحسابات بطريقة آمنة
  const accountsCount = React.useMemo(() => {
    try {
      return Array.isArray(accounts) ? accounts.length : 0;
    } catch (error) {
      console.error('❌ Error calculating accounts count:', error);
      return 0;
    }
  }, [accounts]);

  return (
    <AccountingErrorBoundary>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">دفتر الأستاذ العام</h1>
            <p className="text-muted-foreground">عرض وإدارة حركة الحسابات المحاسبية</p>
          </div>
          
          <div className="flex items-center gap-2 flex-row-reverse">
            <ManualJournalEntryDialog
              accounts={accounts}
              costCenters={[]}
              onEntryCreated={handleEntryCreated}
              loading={accountsLoading}
              error={accountsError}
              onRetryLoadAccounts={loadAccounts}
            />
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

        {/* الشبكة الرئيسية للمحتوى */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* تقرير دفتر الأستاذ الرئيسي */}
          <div className="lg:col-span-2">
            <Card className="card-elegant" ref={reportRef}>
              <CardHeader>
                <CardTitle className="rtl-title flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  دفتر الأستاذ العام
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div id="general-ledger-report">
                  <AccountingErrorBoundary>
                    <GeneralLedgerReport />
                  </AccountingErrorBoundary>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* الشريط الجانبي */}
          <div className="space-y-6">
            {/* الإجراءات السريعة */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">الإجراءات السريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ledgerFeatures.map((feature, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start rtl-flex h-auto p-3"
                      onClick={feature.onClick}
                    >
                      <div className="flex items-center gap-3 flex-row-reverse text-right">
                        {feature.icon}
                        <div>
                          <div className="font-medium text-sm">{feature.title}</div>
                          <div className="text-xs text-muted-foreground">{feature.description}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* إحصائيات سريعة */}
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">إحصائيات سريعة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {accountsCount}
                    </div>
                    <div className="text-sm text-muted-foreground">الحسابات النشطة</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-muted-foreground">القيود هذا الشهر</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AccountingErrorBoundary>
  );
};

export default GeneralLedger;
