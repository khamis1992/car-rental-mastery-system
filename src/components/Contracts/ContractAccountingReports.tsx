import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Filter, TrendingUp } from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';
import { useToast } from '@/hooks/use-toast';
import { contractAccountingService } from '@/services/contractAccountingService';

interface ContractAccountingReportsProps {
  onExport?: (data: any[]) => void;
}

export const ContractAccountingReports: React.FC<ContractAccountingReportsProps> = ({
  onExport
}) => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    customerId: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // تحميل البيانات للشهر الحالي بشكل افتراضي
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    setFilters({
      ...filters,
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    });
    
    loadReportData({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      status: '',
      customerId: ''
    });
    loadSummary();
  }, []);

  const loadReportData = async (filterParams = filters) => {
    try {
      setLoading(true);
      const data = await contractAccountingService.getContractAccountingReport(filterParams);
      setReportData(data);
    } catch (error) {
      console.error('خطأ في تحميل تقرير المحاسبة:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل تقرير المحاسبة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const currentDate = new Date();
      const summary = await contractAccountingService.getContractAccountingSummary({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1
      });
      setSummary(summary);
    } catch (error) {
      console.error('خطأ في تحميل ملخص المحاسبة:', error);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    loadReportData(filters);
  };

  const handleExport = () => {
    if (onExport) {
      onExport(reportData);
    } else {
      // تصدير بسيط كـ CSV
      const csvContent = [
        ['رقم العقد', 'العميل', 'المركبة', 'تاريخ البداية', 'تاريخ النهاية', 'المبلغ الإجمالي', 'المبلغ النهائي', 'الحالة'],
        ...reportData.map(contract => [
          contract.contract_number,
          contract.customer_name,
          contract.vehicle_info,
          contract.start_date,
          contract.end_date,
          contract.total_amount,
          contract.final_amount,
          contract.status
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `contract_accounting_report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'completed': return 'مكتمل';
      case 'pending': return 'في الانتظار';
      case 'cancelled': return 'ملغي';
      case 'draft': return 'مسودة';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* ملخص المحاسبة */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-row-reverse">
                <FileText className="w-8 h-8 text-primary" />
                <div className="text-right">
                  <p className="text-2xl font-bold">{summary.total_contracts}</p>
                  <p className="text-sm text-muted-foreground">إجمالي العقود</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-row-reverse">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrencyKWD(summary.total_revenue)}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-row-reverse">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{summary.active_contracts}</p>
                  <p className="text-sm text-muted-foreground">عقود نشطة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-row-reverse">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrencyKWD(summary.total_deposits)}</p>
                  <p className="text-sm text-muted-foreground">إجمالي العربون</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* فلاتر التقرير */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
            <Filter className="h-5 w-5" />
            فلاتر التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-right">من تاريخ</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-right">إلى تاريخ</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-right">الحالة</Label>
              <Select onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="pending">في الانتظار</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters} disabled={loading} className="flex-1">
                {loading ? 'جاري التحميل...' : 'تطبيق الفلاتر'}
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={reportData.length === 0}>
                <Download className="w-4 h-4 ml-2" />
                تصدير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول التقرير */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">تقرير محاسبة العقود</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">لا توجد بيانات</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                لا توجد عقود تطابق المعايير المحددة
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم العقد</TableHead>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">المركبة</TableHead>
                    <TableHead className="text-right">تاريخ البداية</TableHead>
                    <TableHead className="text-right">تاريخ النهاية</TableHead>
                    <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                    <TableHead className="text-right">المبلغ النهائي</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">القيد المحاسبي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((contract) => (
                    <TableRow key={contract.contract_id}>
                      <TableCell className="text-right font-medium">
                        {contract.contract_number}
                      </TableCell>
                      <TableCell className="text-right">{contract.customer_name}</TableCell>
                      <TableCell className="text-right">{contract.vehicle_info}</TableCell>
                      <TableCell className="text-right">
                        {new Date(contract.start_date).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell className="text-right">
                        {new Date(contract.end_date).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyKWD(contract.total_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrencyKWD(contract.final_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getStatusBadgeVariant(contract.status)}>
                          {getStatusLabel(contract.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {contract.journal_entry ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {contract.journal_entry.entry_number}
                            </div>
                            <Badge variant="outline">
                              {contract.journal_entry.status === 'posted' ? 'مرحل' : contract.journal_entry.status}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="destructive">
                            لم ينشأ بعد
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};