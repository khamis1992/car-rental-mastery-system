import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { accountingService } from '@/services/accountingService';
import { TrialBalance, IncomeStatement, BalanceSheet } from '@/types/accounting';

type ReportType = 'trial_balance' | 'income_statement' | 'balance_sheet';

export const TraditionalReports = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('trial_balance');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [trialBalance, setTrialBalance] = useState<TrialBalance[]>([]);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedReport) {
      loadReport();
    }
  }, [selectedReport]);

  const loadReport = async () => {
    setLoading(true);
    try {
      switch (selectedReport) {
        case 'trial_balance':
          const tbData = await accountingService.getTrialBalance();
          setTrialBalance(tbData);
          break;
        case 'income_statement':
          const isData = await accountingService.getIncomeStatement(dateFrom, dateTo);
          setIncomeStatement(isData);
          break;
        case 'balance_sheet':
          const bsData = await accountingService.getBalanceSheet();
          setBalanceSheet(bsData);
          break;
      }
    } catch (error) {
      console.error('Error loading report:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل التقرير',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(Math.abs(amount));
  };

  const exportReport = () => {
    toast({
      title: 'قريباً',
      description: 'سيتم إضافة التصدير قريباً',
    });
  };

  const printReport = () => {
    window.print();
  };

  const getReportTitle = () => {
    const titles = {
      trial_balance: 'ميزان المراجعة',
      income_statement: 'قائمة الدخل',
      balance_sheet: 'الميزانية العمومية'
    };
    return titles[selectedReport];
  };

  const renderTrialBalance = () => (
    <div className="space-y-4">
      <div className="text-center border-b pb-4">
        <h2 className="text-2xl font-bold">ميزان المراجعة</h2>
        <p className="text-muted-foreground">كما في {new Date().toLocaleDateString('ar-KW')}</p>
      </div>
      
      <Table className="border">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-right border font-bold">الرصيد الدائن</TableHead>
            <TableHead className="text-right border font-bold">الرصيد المدين</TableHead>
            <TableHead className="text-right border font-bold">اسم الحساب</TableHead>
            <TableHead className="text-right border font-bold">رقم الحساب</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trialBalance.map((account, index) => (
            <TableRow key={index} className="hover:bg-muted/20">
              <TableCell className="text-right border font-mono">
                {account.credit_balance > 0 ? formatAmount(account.credit_balance) : '-'}
              </TableCell>
              <TableCell className="text-right border font-mono">
                {account.debit_balance > 0 ? formatAmount(account.debit_balance) : '-'}
              </TableCell>
              <TableCell className="text-right border">{account.account_name}</TableCell>
              <TableCell className="text-right border font-mono">{account.account_code}</TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted font-bold border-t-2 border-t-primary">
            <TableCell className="text-right border text-blue-600">
              {formatAmount(trialBalance.reduce((sum, acc) => sum + acc.credit_balance, 0))}
            </TableCell>
            <TableCell className="text-right border text-green-600">
              {formatAmount(trialBalance.reduce((sum, acc) => sum + acc.debit_balance, 0))}
            </TableCell>
            <TableCell className="text-right border font-bold">الإجمالي</TableCell>
            <TableCell className="border"></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  const renderIncomeStatement = () => {
    if (!incomeStatement) return <div>لا توجد بيانات</div>;

    return (
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-bold">قائمة الدخل</h2>
          <p className="text-muted-foreground">من {dateFrom} إلى {dateTo}</p>
        </div>

        <div className="space-y-6">
          {/* الإيرادات */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4 text-green-700 border-b pb-2">الإيرادات</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-mono">{formatAmount(incomeStatement.revenue.operating_revenue)}</span>
                <span>إيرادات التشغيل</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono">{formatAmount(incomeStatement.revenue.other_revenue)}</span>
                <span>إيرادات أخرى</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span className="font-mono text-green-600">{formatAmount(incomeStatement.revenue.total_revenue)}</span>
                <span>إجمالي الإيرادات</span>
              </div>
            </div>
          </div>

          {/* المصروفات */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4 text-red-700 border-b pb-2">المصروفات</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-mono">{formatAmount(incomeStatement.expenses.operating_expense)}</span>
                <span>مصروفات التشغيل</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono">{formatAmount(incomeStatement.expenses.other_expense)}</span>
                <span>مصروفات أخرى</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span className="font-mono text-red-600">{formatAmount(incomeStatement.expenses.total_expense)}</span>
                <span>إجمالي المصروفات</span>
              </div>
            </div>
          </div>

          {/* صافي الدخل */}
          <div className="border-2 border-primary rounded-lg p-4 bg-muted/20">
            <div className="flex justify-between items-center text-xl font-bold">
              <span className={`font-mono ${incomeStatement.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(incomeStatement.net_income)}
              </span>
              <span>صافي الدخل</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBalanceSheet = () => {
    if (!balanceSheet) return <div>لا توجد بيانات</div>;

    return (
      <div className="space-y-6">
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-bold">الميزانية العمومية</h2>
          <p className="text-muted-foreground">كما في {new Date().toLocaleDateString('ar-KW')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* الأصول */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4 text-blue-700 border-b pb-2">الأصول</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">الأصول المتداولة</h4>
                <div className="flex justify-between">
                  <span className="font-mono">{formatAmount(balanceSheet.assets.current_assets)}</span>
                  <span className="text-sm">أصول متداولة</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">الأصول الثابتة</h4>
                <div className="flex justify-between">
                  <span className="font-mono">{formatAmount(balanceSheet.assets.fixed_assets)}</span>
                  <span className="text-sm">أصول ثابتة</span>
                </div>
              </div>
              
              <div className="border-t pt-2 font-bold">
                <div className="flex justify-between">
                  <span className="font-mono text-blue-600">{formatAmount(balanceSheet.assets.total_assets)}</span>
                  <span>إجمالي الأصول</span>
                </div>
              </div>
            </div>
          </div>

          {/* الخصوم وحقوق الملكية */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-bold mb-4 text-red-700 border-b pb-2">الخصوم وحقوق الملكية</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">الخصوم</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-mono">{formatAmount(balanceSheet.liabilities.current_liabilities)}</span>
                    <span className="text-sm">خصوم متداولة</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">{formatAmount(balanceSheet.liabilities.long_term_liabilities)}</span>
                    <span className="text-sm">خصوم طويلة الأجل</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span className="font-mono">{formatAmount(balanceSheet.liabilities.total_liabilities)}</span>
                    <span className="text-sm">إجمالي الخصوم</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">حقوق الملكية</h4>
                <div className="flex justify-between">
                  <span className="font-mono">{formatAmount(balanceSheet.equity.total_equity)}</span>
                  <span className="text-sm">حقوق الملكية</span>
                </div>
              </div>
              
              <div className="border-t pt-2 font-bold">
                <div className="flex justify-between">
                  <span className="font-mono text-red-600">
                    {formatAmount(balanceSheet.liabilities.total_liabilities + balanceSheet.equity.total_equity)}
                  </span>
                  <span>إجمالي الخصوم وحقوق الملكية</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-background">
      {/* أدوات التحكم */}
      <Card>
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={exportReport} variant="outline" size="sm">
                <Download className="w-4 h-4 ml-2" />
                تصدير PDF
              </Button>
              <Button onClick={printReport} variant="outline" size="sm">
                <Printer className="w-4 h-4 ml-2" />
                طباعة
              </Button>
            </div>
            <CardTitle className="text-xl font-bold flex items-center gap-2 rtl-flex">
              <FileText className="w-5 h-5" />
              التقارير المالية التقليدية
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label className="text-sm font-medium">نوع التقرير</Label>
              <Select value={selectedReport} onValueChange={(value: ReportType) => setSelectedReport(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial_balance">ميزان المراجعة</SelectItem>
                  <SelectItem value="income_statement">قائمة الدخل</SelectItem>
                  <SelectItem value="balance_sheet">الميزانية العمومية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedReport === 'income_statement' && (
              <>
                <div>
                  <Label className="text-sm font-medium">من تاريخ</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="text-right"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="text-right"
                  />
                </div>
              </>
            )}

            <Button onClick={loadReport} disabled={loading}>
              <Calendar className="w-4 h-4 ml-2" />
              {loading ? 'جاري التحميل...' : 'إنشاء التقرير'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* محتوى التقرير */}
      <Card>
        <CardContent className="p-6 print:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>جاري تحميل {getReportTitle()}...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {selectedReport === 'trial_balance' && renderTrialBalance()}
              {selectedReport === 'income_statement' && renderIncomeStatement()}
              {selectedReport === 'balance_sheet' && renderBalanceSheet()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};