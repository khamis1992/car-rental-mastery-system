import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Calculator, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { payrollService } from '@/services/payrollService';
import { formatCurrencyKWD } from '@/lib/currency';

interface PayrollAccountingData {
  payroll_id: string;
  employee_name: string;
  employee_number: string;
  department: string;
  pay_period: string;
  gross_salary: number;
  net_salary: number;
  journal_entry: any;
  accounting_entries: any[];
  status: string;
}

export const PayrollAccountingReports: React.FC = () => {
  const [reportData, setReportData] = useState<PayrollAccountingData[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const { toast } = useToast();

  const months = [
    { value: 1, label: 'يناير' },
    { value: 2, label: 'فبراير' },
    { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' },
    { value: 5, label: 'مايو' },
    { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' },
    { value: 8, label: 'أغسطس' },
    { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' },
    { value: 11, label: 'نوفمبر' },
    { value: 12, label: 'ديسمبر' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    loadReportData();
    loadSummaryData();
  }, [selectedYear, selectedMonth, selectedDepartment]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const endDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-31`;
      
      const data = await payrollService.getPayrollAccountingReport({
        startDate,
        endDate,
        department: selectedDepartment || undefined
      });
      
      setReportData(data);
    } catch (error) {
      console.error('خطأ في تحميل تقرير محاسبة الرواتب:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل التقرير',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSummaryData = async () => {
    try {
      const summary = await payrollService.getPayrollAccountingSummary({
        year: selectedYear,
        month: selectedMonth
      });
      setSummary(summary);
    } catch (error) {
      console.error('خطأ في تحميل ملخص محاسبة الرواتب:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'draft': { label: 'مسودة', variant: 'secondary' as const },
      'calculated': { label: 'محسوب', variant: 'default' as const },
      'approved': { label: 'معتمد', variant: 'default' as const },
      'paid': { label: 'مدفوع', variant: 'default' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getEntryStatusIcon = (journalEntry: any) => {
    if (!journalEntry) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      {/* عنوان التقارير */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-row-reverse text-right">
            <Calculator className="h-6 w-6" />
            تقارير محاسبة الرواتب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-right">
            تقارير متكاملة تربط بين الرواتب والقيود المحاسبية
          </p>
        </CardContent>
      </Card>

      {/* فلاتر التقرير */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">فلاتر التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">السنة</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">الشهر</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">القسم</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="جميع الأقسام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الأقسام</SelectItem>
                  <SelectItem value="الإدارة">الإدارة</SelectItem>
                  <SelectItem value="المحاسبة">المحاسبة</SelectItem>
                  <SelectItem value="الموارد البشرية">الموارد البشرية</SelectItem>
                  <SelectItem value="التشغيل">التشغيل</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">إجراءات</label>
              <Button onClick={loadReportData} disabled={loading} className="w-full">
                <FileText className="h-4 w-4 ml-2" />
                {loading ? 'جاري التحميل...' : 'تحديث التقرير'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ملخص الإحصائيات */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary">{summary.total_payrolls}</div>
              <div className="text-sm text-muted-foreground">إجمالي الرواتب</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrencyKWD(summary.total_gross_salary)}</div>
              <div className="text-sm text-muted-foreground">إجمالي الراتب الإجمالي</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrencyKWD(summary.total_net_salary)}</div>
              <div className="text-sm text-muted-foreground">إجمالي الراتب الصافي</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-orange-600">{formatCurrencyKWD(summary.total_deductions)}</div>
              <div className="text-sm text-muted-foreground">إجمالي الخصومات</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* جدول التقرير */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">تفاصيل الرواتب والقيود المحاسبية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الموظف</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-right">فترة الراتب</TableHead>
                  <TableHead className="text-right">الراتب الإجمالي</TableHead>
                  <TableHead className="text-right">الراتب الصافي</TableHead>
                  <TableHead className="text-right">القيد المحاسبي</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((record) => (
                  <TableRow key={record.payroll_id}>
                    <TableCell className="text-right">
                      <div>
                        <div className="font-medium">{record.employee_name}</div>
                        <div className="text-sm text-muted-foreground">{record.employee_number}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{record.department}</TableCell>
                    <TableCell className="text-right">{record.pay_period}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrencyKWD(record.gross_salary)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrencyKWD(record.net_salary)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        {getEntryStatusIcon(record.journal_entry)}
                        {record.journal_entry && (
                          <span className="text-sm text-muted-foreground">
                            {record.journal_entry.entry_number}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(record.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 flex-row-reverse">
                        {record.journal_entry && (
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {reportData.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات للفترة المحددة
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};