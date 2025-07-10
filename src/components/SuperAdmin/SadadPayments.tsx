import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useSadadPayments } from '@/hooks/useSadadData';
import { SadadPayment } from '@/types/sadad';

const SadadPayments: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  });

  const { data: payments, isLoading, refetch } = useSadadPayments({
    status: statusFilter === 'all' ? undefined : statusFilter,
    from_date: dateFilter.from || undefined,
    to_date: dateFilter.to || undefined,
    limit: 50
  });

  const getStatusIcon = (status: SadadPayment['sadad_status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: SadadPayment['sadad_status']) => {
    const variants = {
      paid: 'bg-success text-success-foreground',
      failed: 'bg-destructive text-destructive-foreground',
      pending: 'bg-warning text-warning-foreground',
      processing: 'bg-primary text-primary-foreground',
      expired: 'bg-muted text-muted-foreground',
      cancelled: 'bg-muted text-muted-foreground'
    };

    const labels = {
      paid: 'مدفوع',
      failed: 'فاشل',
      pending: 'معلق',
      processing: 'قيد المعالجة',
      expired: 'منتهي الصلاحية',
      cancelled: 'ملغي'
    };

    return (
      <Badge className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const filteredPayments = payments?.filter(payment => {
    const matchesSearch = 
      payment.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.sadad_transaction_id?.includes(searchQuery) ||
      payment.sadad_reference_number?.includes(searchQuery);
    
    return matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل المدفوعات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>مدفوعات SADAD</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                تحديث
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                تصدير
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="البحث في المدفوعات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">معلق</option>
              <option value="processing">قيد المعالجة</option>
              <option value="paid">مدفوع</option>
              <option value="failed">فاشل</option>
              <option value="expired">منتهي الصلاحية</option>
              <option value="cancelled">ملغي</option>
            </select>

            <Input
              type="date"
              placeholder="من تاريخ"
              value={dateFilter.from}
              onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
            />

            <Input
              type="date"
              placeholder="إلى تاريخ"
              value={dateFilter.to}
              onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-right p-4 font-medium">معرف المعاملة</th>
                  <th className="text-right p-4 font-medium">العميل</th>
                  <th className="text-right p-4 font-medium">المبلغ</th>
                  <th className="text-right p-4 font-medium">الحالة</th>
                  <th className="text-right p-4 font-medium">تاريخ الإنشاء</th>
                  <th className="text-right p-4 font-medium">تاريخ الدفع</th>
                  <th className="text-center p-4 font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-muted/30">
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="font-mono text-sm">
                          {payment.sadad_transaction_id || 'غير محدد'}
                        </p>
                        {payment.sadad_reference_number && (
                          <p className="text-xs text-muted-foreground">
                            {payment.sadad_reference_number}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="font-medium">{payment.customer_name || 'غير محدد'}</p>
                        {payment.customer_email && (
                          <p className="text-sm text-muted-foreground">{payment.customer_email}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{payment.amount.toFixed(3)}</span>
                        <span className="text-sm text-muted-foreground">{payment.currency}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.sadad_status)}
                        {getStatusBadge(payment.sadad_status)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(payment.created_at).toLocaleDateString('ar')}
                      </div>
                    </td>
                    <td className="p-4">
                      {payment.paid_at ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(payment.paid_at).toLocaleDateString('ar')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">لا توجد مدفوعات متاحة</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SadadPayments;