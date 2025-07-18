import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, Download, Calendar, TrendingUp, Calculator, Building2 } from 'lucide-react';
import { accountingService } from '@/services/accountingService';
import { useToast } from '@/hooks/use-toast';

interface TraditionalAccountData {
  account_code: string;
  account_name: string;
  account_type: string;
  opening_balance: number;
  debit_total: number;
  credit_total: number;
  closing_balance: number;
}

interface TraditionalReportProps {
  variant?: 'classic' | 'detailed' | 'summary';
}

export const TraditionalFinancialReports: React.FC<TraditionalReportProps> = ({ variant = 'classic' }) => {
  const [accountsData, setAccountsData] = useState<TraditionalAccountData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTraditionalReport();
  }, [dateRange]);

  const loadTraditionalReport = async () => {
    setLoading(true);
    try {
      // استخدام دالة ميزان المراجعة الموجودة وتحسينها
      const trialBalanceData = await accountingService.getTrialBalance();
      
      // تحويل البيانات للشكل التقليدي
      const traditionalData: TraditionalAccountData[] = trialBalanceData.map(account => ({
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: 'تشغيلي', // يمكن تحسينها لاحقاً
        opening_balance: 0, // سيتم حسابها من قاعدة البيانات
        debit_total: account.debit_balance,
        credit_total: account.credit_balance,
        closing_balance: account.debit_balance - account.credit_balance
      }));

      setAccountsData(traditionalData);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل التقرير التحليلي',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    toast({
      title: 'تصدير التقرير',
      description: 'سيتم تصدير التقرير التحليلي قريباً',
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(3);
  };

  const getTotalDebit = () => accountsData.reduce((sum, acc) => sum + acc.debit_total, 0);
  const getTotalCredit = () => accountsData.reduce((sum, acc) => sum + acc.credit_total, 0);
  const getTotalOpening = () => accountsData.reduce((sum, acc) => sum + acc.opening_balance, 0);
  const getTotalClosing = () => accountsData.reduce((sum, acc) => sum + acc.closing_balance, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Calculator className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>جاري إعداد التقرير التحليلي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس التقرير */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl">شركة ساپتكو الخليج لتأجير السيارات</CardTitle>
            <p className="text-lg font-semibold text-primary">تحليل تقرير الحسابات</p>
            <p className="text-sm text-muted-foreground">
              من {new Date(dateRange.startDate).toLocaleDateString('ar-KW')} 
              إلى {new Date(dateRange.endDate).toLocaleDateString('ar-KW')}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="period">الفترة المالية</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفترة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">الشهر الحالي</SelectItem>
                  <SelectItem value="current_quarter">الربع الحالي</SelectItem>
                  <SelectItem value="current_year">السنة الحالية</SelectItem>
                  <SelectItem value="custom">فترة مخصصة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <Label htmlFor="start_date">من تاريخ</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">إلى تاريخ</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button onClick={loadTraditionalReport} className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                تحديث التقرير
              </Button>
              <Button variant="outline" onClick={handleExportReport} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                تصدير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* التقرير التحليلي */}
      <Card className="card-elegant">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-center font-bold border">رصيد آخر المدة</TableHead>
                  <TableHead className="text-center font-bold border">دائن</TableHead>
                  <TableHead className="text-center font-bold border">مدين</TableHead>
                  <TableHead className="text-center font-bold border">رصيد أول المدة</TableHead>
                  <TableHead className="text-center font-bold border">نوع الحساب</TableHead>
                  <TableHead className="text-center font-bold border">اسم الحساب</TableHead>
                  <TableHead className="text-center font-bold border">رقم الحساب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountsData.map((account, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="text-center border font-medium">
                      <span className={account.closing_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatAmount(Math.abs(account.closing_balance))}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border">
                      <span className="text-blue-600">
                        {account.credit_total > 0 ? formatAmount(account.credit_total) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border">
                      <span className="text-green-600">
                        {account.debit_total > 0 ? formatAmount(account.debit_total) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border">
                      <span className={account.opening_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {account.opening_balance !== 0 ? formatAmount(Math.abs(account.opening_balance)) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center border text-sm text-muted-foreground">
                      {account.account_type}
                    </TableCell>
                    <TableCell className="text-right border font-medium">
                      {account.account_name}
                    </TableCell>
                    <TableCell className="text-center border font-mono font-bold">
                      {account.account_code}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* صف الإجماليات */}
                <TableRow className="bg-primary/10 font-bold border-t-2">
                  <TableCell className="text-center border font-bold text-lg">
                    <span className={getTotalClosing() >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatAmount(Math.abs(getTotalClosing()))}
                    </span>
                  </TableCell>
                  <TableCell className="text-center border font-bold text-lg text-blue-600">
                    {formatAmount(getTotalCredit())}
                  </TableCell>
                  <TableCell className="text-center border font-bold text-lg text-green-600">
                    {formatAmount(getTotalDebit())}
                  </TableCell>
                  <TableCell className="text-center border font-bold text-lg">
                    <span className={getTotalOpening() >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatAmount(Math.abs(getTotalOpening()))}
                    </span>
                  </TableCell>
                  <TableCell className="text-center border font-bold">-</TableCell>
                  <TableCell className="text-right border font-bold text-lg">الإجمالي</TableCell>
                  <TableCell className="text-center border font-bold">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {accountsData.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">لا توجد بيانات لعرضها في التقرير</p>
              <p className="text-sm text-muted-foreground mt-2">تأكد من وجود حسابات وحركات مالية في الفترة المحددة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ملخص التقرير */}
      {accountsData.length > 0 && (
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-center">ملخص التقرير التحليلي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">إجمالي الحركات المدينة</p>
                <p className="text-xl font-bold text-green-600">د.ك {formatAmount(getTotalDebit())}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">إجمالي الحركات الدائنة</p>
                <p className="text-xl font-bold text-blue-600">د.ك {formatAmount(getTotalCredit())}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">الفرق</p>
                <p className={`text-xl font-bold ${getTotalDebit() - getTotalCredit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  د.ك {formatAmount(Math.abs(getTotalDebit() - getTotalCredit()))}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">عدد الحسابات</p>
                <p className="text-xl font-bold text-primary">{accountsData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};