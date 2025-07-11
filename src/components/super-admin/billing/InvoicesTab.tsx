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
  Download, 
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useSaasInvoices, useUpdateInvoiceStatus } from '@/hooks/useSaasData';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { SaasInvoice } from '@/types/unified-saas';

export function InvoicesTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const { data: invoices = [], isLoading } = useSaasInvoices();
  const updateInvoiceStatusMutation = useUpdateInvoiceStatus();

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchQuery || 
      invoice.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (invoiceId: string, newStatus: SaasInvoice['status']) => {
    try {
      await updateInvoiceStatusMutation.mutateAsync({
        invoiceId: invoiceId,
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'مسودة', variant: 'secondary' as const, icon: FileText },
      sent: { label: 'مرسلة', variant: 'default' as const, icon: Send },
      paid: { label: 'مدفوعة', variant: 'default' as const, icon: CheckCircle },
      overdue: { label: 'متأخرة', variant: 'destructive' as const, icon: AlertCircle },
      void: { label: 'ملغاة', variant: 'destructive' as const, icon: XCircle },
      uncollectible: { label: 'غير قابلة للتحصيل', variant: 'destructive' as const, icon: XCircle },
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

  // Calculate statistics
  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => ['sent', 'draft'].includes(i.status)).length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalAmount: invoices.reduce((sum, i) => sum + i.total_amount, 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0),
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">فواتير النظام</h2>
          <p className="text-muted-foreground">إدارة جميع فواتير الاشتراكات</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الفواتير..."
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
            <option value="draft">مسودة</option>
            <option value="sent">مرسلة</option>
            <option value="paid">مدفوعة</option>
            <option value="overdue">متأخرة</option>
            <option value="void">ملغاة</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              إجمالي الفواتير
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
              مدفوعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">
              {stats.paidAmount.toFixed(3)} د.ك
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              معلقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              متأخرة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>المؤسسة</TableHead>
                <TableHead>فترة الفوترة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="font-medium">{invoice.invoice_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(invoice.created_at), 'dd/MM/yyyy', { locale: ar })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.tenant?.name}</div>
                      <div className="text-sm text-muted-foreground">{invoice.tenant?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(new Date(invoice.billing_period_start), 'dd/MM/yyyy', { locale: ar })}</div>
                      <div className="text-muted-foreground">إلى</div>
                      <div>{format(new Date(invoice.billing_period_end), 'dd/MM/yyyy', { locale: ar })}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.total_amount.toFixed(3)} {invoice.currency}</div>
                      {invoice.discount_amount > 0 && (
                        <div className="text-sm text-green-600">
                          خصم: {invoice.discount_amount.toFixed(3)} {invoice.currency}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {invoice.due_date ? (
                      <div className={`text-sm ${
                        new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' 
                          ? 'text-red-600 font-medium' 
                          : ''
                      }`}>
                        {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ar })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">غير محدد</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(invoice.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" title="تحميل PDF">
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {invoice.status === 'draft' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStatusChange(invoice.id, 'sent')}
                          title="إرسال الفاتورة"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {['sent', 'overdue'].includes(invoice.status) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStatusChange(invoice.id, 'paid')}
                          title="تعليم كمدفوعة"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">لا توجد فواتير تطابق معايير البحث</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}