import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { CustomerSubsidiaryLedger, CustomerLedgerFormData } from '@/types/customerTracking';
import { customerTrackingService } from '@/services/customerTrackingService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const CustomerLedgerTab = () => {
  const [ledgerEntries, setLedgerEntries] = useState<CustomerSubsidiaryLedger[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<CustomerLedgerFormData>({
    customer_id: '',
    from_date: '',
    to_date: '',
    reference_type: 'all'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, customer_type')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('خطأ في تحميل العملاء:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل قائمة العملاء',
        variant: 'destructive',
      });
    }
  };

  const loadLedgerEntries = async () => {
    if (!filters.customer_id) {
      toast({
        title: 'تنبيه',
        description: 'يرجى اختيار عميل أولاً',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const entries = await customerTrackingService.getCustomerSubsidiaryLedger(filters);
      setLedgerEntries(entries);
      
      if (entries.length === 0) {
        toast({
          title: 'تنبيه',
          description: 'لا توجد حركات للعميل المحدد في هذه الفترة',
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل دفتر الأستاذ المساعد:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات دفتر الأستاذ المساعد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels = {
      invoice: 'فاتورة',
      payment: 'دفعة',
      adjustment: 'تسوية',
      refund: 'استرداد'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTransactionTypeBadge = (type: string) => {
    const variants = {
      invoice: 'default',
      payment: 'secondary',
      adjustment: 'outline',
      refund: 'destructive'
    };
    return variants[type as keyof typeof variants] || 'outline';
  };

  const exportToCSV = () => {
    if (ledgerEntries.length === 0) {
      toast({
        title: 'تنبيه',
        description: 'لا توجد بيانات للتصدير',
        variant: 'destructive',
      });
      return;
    }

    const csvHeaders = ['التاريخ', 'الوصف', 'نوع المعاملة', 'مدين', 'دائن', 'الرصيد الجاري'];
    const csvData = ledgerEntries.map(entry => [
      new Date(entry.transaction_date).toLocaleDateString('ar-KW'),
      entry.description,
      getTransactionTypeLabel(entry.reference_type),
      entry.debit_amount.toFixed(3),
      entry.credit_amount.toFixed(3),
      entry.running_balance.toFixed(3)
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customer_ledger_${filters.customer_id}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title">دفتر الأستاذ المساعد للعملاء</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* فلاتر البحث */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Label htmlFor="customer_id">العميل</Label>
              <Select 
                value={filters.customer_id} 
                onValueChange={(value) => setFilters({...filters, customer_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر العميل" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.customer_type === 'individual' ? 'فرد' : 'شركة'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="from_date">من تاريخ</Label>
              <Input
                id="from_date"
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({...filters, from_date: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="to_date">إلى تاريخ</Label>
              <Input
                id="to_date"
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters({...filters, to_date: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="reference_type">نوع المعاملة</Label>
              <Select 
                value={filters.reference_type} 
                onValueChange={(value) => setFilters({...filters, reference_type: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع المعاملات</SelectItem>
                  <SelectItem value="invoice">فواتير</SelectItem>
                  <SelectItem value="payment">دفعات</SelectItem>
                  <SelectItem value="adjustment">تسويات</SelectItem>
                  <SelectItem value="refund">استردادات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={loadLedgerEntries} disabled={loading} className="flex-1">
                <Search className="w-4 h-4 ml-2" />
                {loading ? 'جاري البحث...' : 'بحث'}
              </Button>
              <Button 
                variant="outline" 
                onClick={exportToCSV}
                disabled={ledgerEntries.length === 0}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول النتائج */}
      {ledgerEntries.length > 0 && (
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">
              حركات العميل ({ledgerEntries.length} حركة)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الوصف</TableHead>
                    <TableHead className="text-right">نوع المعاملة</TableHead>
                    <TableHead className="text-right">مدين</TableHead>
                    <TableHead className="text-right">دائن</TableHead>
                    <TableHead className="text-right">الرصيد الجاري</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-right">
                        {new Date(entry.transaction_date).toLocaleDateString('ar-KW')}
                      </TableCell>
                      <TableCell className="text-right max-w-xs truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getTransactionTypeBadge(entry.reference_type) as any}>
                          {getTransactionTypeLabel(entry.reference_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {entry.debit_amount > 0 ? formatAmount(entry.debit_amount) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-blue-600">
                        {entry.credit_amount > 0 ? formatAmount(entry.credit_amount) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        <span className={entry.running_balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatAmount(entry.running_balance)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ملخص الإجماليات */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatAmount(ledgerEntries.reduce((sum, entry) => sum + entry.debit_amount, 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatAmount(ledgerEntries.reduce((sum, entry) => sum + entry.credit_amount, 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">الرصيد النهائي</p>
                  <p className="text-lg font-bold">
                    {ledgerEntries.length > 0 ? formatAmount(ledgerEntries[0].running_balance) : '0.000'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* رسالة عدم وجود نتائج */}
      {!loading && ledgerEntries.length === 0 && filters.customer_id && (
        <Card className="card-elegant">
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">لا توجد حركات</h3>
              <p className="text-sm">لم يتم العثور على حركات للعميل المحدد في هذه الفترة</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};