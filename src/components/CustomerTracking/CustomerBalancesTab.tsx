import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Eye, Users } from 'lucide-react';
import { CustomerWithBalance, CustomerTrackingFilters } from '@/types/customerTracking';
import { customerTrackingService } from '@/services/customerTrackingService';
import { useToast } from '@/hooks/use-toast';

export const CustomerBalancesTab = () => {
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CustomerTrackingFilters>({
    customer_type: undefined,
    balance_status: 'all',
    date_range: undefined,
    amount_range: undefined
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, searchTerm, filters]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerTrackingService.getCustomersWithBalance(filters);
      setCustomers(data);
    } catch (error) {
      console.error('خطأ في تحميل أرصدة العملاء:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل أرصدة العملاء',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = customers;

    // فلترة النص
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // فلترة نوع العميل
    if (filters.customer_type) {
      filtered = filtered.filter(customer => customer.customer_type === filters.customer_type);
    }

    // فلترة حالة الرصيد
    if (filters.balance_status && filters.balance_status !== 'all') {
      switch (filters.balance_status) {
        case 'with_balance':
          filtered = filtered.filter(customer => customer.current_balance !== 0);
          break;
        case 'overdue':
          filtered = filtered.filter(customer => customer.overdue_amount > 0);
          break;
        case 'credit':
          filtered = filtered.filter(customer => customer.current_balance < 0);
          break;
      }
    }

    setFilteredCustomers(filtered);
  };

  const formatAmount = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const getBalanceStatus = (customer: CustomerWithBalance) => {
    if (customer.current_balance === 0) return { label: 'متوازن', variant: 'secondary', color: 'text-gray-600' };
    if (customer.overdue_amount > 0) return { label: 'متأخر', variant: 'destructive', color: 'text-red-600' };
    if (customer.current_balance > 0) return { label: 'مدين', variant: 'default', color: 'text-blue-600' };
    return { label: 'دائن', variant: 'outline', color: 'text-green-600' };
  };

  const getDaysOutstandingBadge = (days: number) => {
    if (days === 0) return { variant: 'secondary', label: '-' };
    if (days <= 30) return { variant: 'default', label: `${days} يوم` };
    if (days <= 60) return { variant: 'secondary', label: `${days} يوم` };
    if (days <= 90) return { variant: 'outline', label: `${days} يوم` };
    return { variant: 'destructive', label: `${days} يوم` };
  };

  const exportToCSV = () => {
    if (filteredCustomers.length === 0) {
      toast({
        title: 'تنبيه',
        description: 'لا توجد بيانات للتصدير',
        variant: 'destructive',
      });
      return;
    }

    const csvHeaders = [
      'اسم العميل', 'نوع العميل', 'الرصيد الحالي', 'المبلغ المتأخر', 
      'أيام التأخير', 'آخر معاملة', 'حالة الرصيد'
    ];
    
    const csvData = filteredCustomers.map(customer => [
      customer.name,
      customer.customer_type === 'individual' ? 'فرد' : 'شركة',
      customer.current_balance.toFixed(3),
      customer.overdue_amount.toFixed(3),
      customer.days_outstanding,
      customer.last_transaction_date || '-',
      getBalanceStatus(customer).label
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customer_balances_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const viewCustomerDetails = (customer: CustomerWithBalance) => {
    console.log('عرض تفاصيل العميل:', customer);
    toast({
      title: 'قريباً',
      description: 'ستتوفر ميزة عرض تفاصيل العميل قريباً',
    });
  };

  // إحصائيات سريعة
  const totalBalance = filteredCustomers.reduce((sum, customer) => sum + customer.current_balance, 0);
  const totalOverdue = filteredCustomers.reduce((sum, customer) => sum + customer.overdue_amount, 0);
  const customersWithOverdue = filteredCustomers.filter(customer => customer.overdue_amount > 0).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* إحصائيات سريعة */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العملاء</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCustomers.length}</div>
            <p className="text-xs text-muted-foreground">عميل</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الأرصدة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">مجموع الأرصدة</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المتأخرات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatAmount(totalOverdue)}</div>
            <p className="text-xs text-muted-foreground">مبالغ متأخرة</p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عملاء متأخرون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{customersWithOverdue}</div>
            <p className="text-xs text-muted-foreground">عميل</p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-center rtl-flex">
            <CardTitle className="rtl-title">أرصدة العملاء</CardTitle>
            <Button variant="outline" onClick={exportToCSV} disabled={filteredCustomers.length === 0}>
              <Download className="w-4 h-4 ml-2" />
              تصدير
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* فلاتر البحث */}
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <Label htmlFor="search">البحث</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="البحث بالاسم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer_type">نوع العميل</Label>
              <Select 
                value={filters.customer_type || 'all'} 
                onValueChange={(value) => setFilters({...filters, customer_type: value === 'all' ? undefined : value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="individual">أفراد</SelectItem>
                  <SelectItem value="company">شركات</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="balance_status">حالة الرصيد</Label>
              <Select 
                value={filters.balance_status || 'all'} 
                onValueChange={(value) => setFilters({...filters, balance_status: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="with_balance">له رصيد</SelectItem>
                  <SelectItem value="overdue">متأخر</SelectItem>
                  <SelectItem value="credit">رصيد دائن</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex items-end">
              <Button onClick={loadCustomers} disabled={loading} className="flex-1">
                <Filter className="w-4 h-4 ml-2" />
                {loading ? 'جاري التحديث...' : 'تحديث'}
              </Button>
            </div>
          </div>

          {/* جدول النتائج */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>جاري تحميل أرصدة العملاء...</p>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم العميل</TableHead>
                    <TableHead className="text-right">النوع</TableHead>
                    <TableHead className="text-right">الرصيد الحالي</TableHead>
                    <TableHead className="text-right">المبلغ المتأخر</TableHead>
                    <TableHead className="text-right">أيام التأخير</TableHead>
                    <TableHead className="text-right">آخر معاملة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const status = getBalanceStatus(customer);
                    const daysBadge = getDaysOutstandingBadge(customer.days_outstanding);
                    
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="text-right font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">
                            {customer.customer_type === 'individual' ? 'فرد' : 'شركة'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={status.color}>
                            {formatAmount(customer.current_balance)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {customer.overdue_amount > 0 ? (
                            <span className="text-red-600 font-medium">
                              {formatAmount(customer.overdue_amount)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={daysBadge.variant as any}>
                            {daysBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {customer.last_transaction_date ? 
                            new Date(customer.last_transaction_date).toLocaleDateString('ar-KW') : 
                            '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={status.variant as any}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewCustomerDetails(customer)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">لا توجد نتائج</h3>
                <p className="text-sm">لم يتم العثور على عملاء مطابقين للفلاتر المحددة</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};