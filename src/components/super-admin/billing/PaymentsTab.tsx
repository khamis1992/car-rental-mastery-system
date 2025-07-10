import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  CreditCard,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import { useSaasPayments } from '@/hooks/useBillingData';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export function PaymentsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  const { data: payments = [], isLoading } = useSaasPayments();

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchQuery || 
      payment.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.payment_reference?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;
    
    const matchesMonth = selectedMonth === 'all' || 
      format(new Date(payment.payment_date), 'yyyy-MM') === selectedMonth;
    
    return matchesSearch && matchesStatus && matchesMonth;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      succeeded: { label: 'نجح', variant: 'default' as const, icon: CheckCircle },
      processing: { label: 'قيد المعالجة', variant: 'secondary' as const, icon: Clock },
      failed: { label: 'فشل', variant: 'destructive' as const, icon: XCircle },
      canceled: { label: 'ملغي', variant: 'destructive' as const, icon: XCircle },
      requires_action: { label: 'يتطلب إجراء', variant: 'destructive' as const, icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'secondary' as const, 
      icon: Clock 
    };

    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const methodConfig = {
      'credit_card': { label: 'بطاقة ائتمان', color: 'bg-blue-100 text-blue-800' },
      'bank_transfer': { label: 'تحويل بنكي', color: 'bg-green-100 text-green-800' },
      'cash': { label: 'نقدي', color: 'bg-gray-100 text-gray-800' },
      'check': { label: 'شيك', color: 'bg-purple-100 text-purple-800' },
      'manual': { label: 'يدوي', color: 'bg-orange-100 text-orange-800' }
    };

    const config = methodConfig[method as keyof typeof methodConfig] || { 
      label: method, 
      color: 'bg-gray-100 text-gray-800' 
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  // Calculate statistics
  const stats = {
    total: payments.length,
    succeeded: payments.filter(p => p.status === 'succeeded').length,
    processing: payments.filter(p => p.status === 'processing').length,
    failed: payments.filter(p => p.status === 'failed').length,
    totalAmount: payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0),
    thisMonth: payments.filter(p => 
      p.status === 'succeeded' && 
      format(new Date(p.payment_date), 'yyyy-MM') === format(new Date(), 'yyyy-MM')
    ).reduce((sum, p) => sum + p.amount, 0)
  };

  // Get unique months for filter
  const availableMonths = [...new Set(payments.map(p => 
    format(new Date(p.payment_date), 'yyyy-MM')
  ))].sort().reverse();

  if (isLoading) {
    return <div className="flex justify-center p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">المدفوعات</h2>
          <p className="text-muted-foreground">تتبع جميع المدفوعات الواردة</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في المدفوعات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 w-64"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">جميع الحالات</option>
            <option value="succeeded">نجح</option>
            <option value="processing">قيد المعالجة</option>
            <option value="failed">فشل</option>
            <option value="canceled">ملغي</option>
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="all">جميع الأشهر</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {format(new Date(month + '-01'), 'MMMM yyyy', { locale: ar })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              إجمالي المدفوعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              مدفوعات ناجحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.succeeded}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAmount.toFixed(3)} د.ك
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              هذا الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.thisMonth.toFixed(3)} د.ك
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              مدفوعات فاشلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المرجع</TableHead>
                <TableHead>المؤسسة</TableHead>
                <TableHead>الفاتورة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>تاريخ الدفع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="font-medium">
                      {payment.payment_reference || `PAY-${payment.id.slice(0, 8)}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.tenant?.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {payment.invoice?.invoice_number || 'غير محدد'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {payment.amount.toFixed(3)} د.ك
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPaymentMethodBadge(payment.payment_method)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(payment.payment_date), 'dd/MM/yyyy HH:mm', { locale: ar })}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" title="تحميل إيصال">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد مدفوعات تطابق معايير البحث</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}