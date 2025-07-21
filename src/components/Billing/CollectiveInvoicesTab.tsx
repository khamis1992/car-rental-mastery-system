import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/DataTable';
import { collectiveInvoiceService } from '@/services/collectiveInvoices';
import { Plus, RefreshCw, Calendar, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import type { CollectiveInvoice } from '@/types/invoice';

export const CollectiveInvoicesTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: collectiveInvoices = [], isLoading, refetch } = useQuery({
    queryKey: ['collective-invoices'],
    queryFn: collectiveInvoiceService.getCollectiveInvoices,
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: collectiveInvoiceService.generateCollectiveInvoice,
    onSuccess: () => {
      toast.success('تم إنشاء الفاتورة الجماعية بنجاح');
      queryClient.invalidateQueries({ queryKey: ['collective-invoices'] });
    },
    onError: (error) => {
      toast.error('فشل في إنشاء الفاتورة الجماعية');
      console.error('Error generating collective invoice:', error);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CollectiveInvoice['status'] }) =>
      collectiveInvoiceService.updateCollectiveInvoice(id, { status }),
    onSuccess: () => {
      toast.success('تم تحديث حالة الفاتورة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['collective-invoices'] });
    },
    onError: () => {
      toast.error('فشل في تحديث حالة الفاتورة');
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'مسودة', variant: 'secondary' as const },
      sent: { label: 'مرسلة', variant: 'default' as const },
      paid: { label: 'مدفوعة', variant: 'default' as const },
      partially_paid: { label: 'مدفوعة جزئياً', variant: 'outline' as const },
      overdue: { label: 'متأخرة', variant: 'destructive' as const },
      cancelled: { label: 'ملغاة', variant: 'secondary' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredInvoices = collectiveInvoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.billing_period_start.includes(searchQuery) ||
    invoice.billing_period_end.includes(searchQuery)
  );

  const columns = [
    {
      header: 'رقم الفاتورة',
      accessorKey: 'invoice_number',
    },
    {
      header: 'فترة الفوترة',
      accessorKey: 'billing_period',
      cell: ({ row }: any) => {
        const invoice = row.original;
        return `${invoice.billing_period_start} - ${invoice.billing_period_end}`;
      },
    },
    {
      header: 'عدد العقود',
      accessorKey: 'total_contracts',
    },
    {
      header: 'المبلغ الإجمالي',
      accessorKey: 'total_amount',
      cell: ({ row }: any) => {
        const amount = parseFloat(row.getValue('total_amount'));
        return new Intl.NumberFormat('ar-KW', {
          style: 'currency',
          currency: 'KWD',
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }).format(amount);
      },
    },
    {
      header: 'تاريخ الاستحقاق',
      accessorKey: 'due_date',
      cell: ({ row }: any) => {
        return new Date(row.getValue('due_date')).toLocaleDateString('ar-KW');
      },
    },
    {
      header: 'الحالة',
      accessorKey: 'status',
      cell: ({ row }: any) => getStatusBadge(row.getValue('status')),
    },
    {
      header: 'تاريخ الإنشاء',
      accessorKey: 'created_at',
      cell: ({ row }: any) => {
        return new Date(row.getValue('created_at')).toLocaleDateString('ar-KW');
      },
    },
    {
      header: 'الإجراءات',
      id: 'actions',
      cell: ({ row }: any) => {
        const invoice = row.original;
        return (
          <div className="flex items-center gap-2">
            {invoice.status === 'draft' && (
              <Button
                size="sm"
                onClick={() => updateStatusMutation.mutate({ id: invoice.id, status: 'sent' })}
                disabled={updateStatusMutation.isPending}
              >
                إرسال
              </Button>
            )}
            <Button variant="outline" size="sm">
              عرض
            </Button>
          </div>
        );
      },
    },
  ];

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const draftCount = filteredInvoices.filter(invoice => invoice.status === 'draft').length;
  const sentCount = filteredInvoices.filter(invoice => invoice.status === 'sent').length;
  const paidCount = filteredInvoices.filter(invoice => invoice.status === 'paid').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">الفواتير الجماعية</h2>
          <p className="text-muted-foreground">
            إدارة الفواتير الجماعية الشهرية والدورية
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button
            onClick={() => {
              // سيتم إضافة نافذة إنشاء فاتورة جماعية لاحقاً
              const startDate = new Date();
              startDate.setDate(1); // أول الشهر
              const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // آخر الشهر
              
              generateInvoiceMutation.mutate({
                billing_period_start: startDate.toISOString().split('T')[0],
                billing_period_end: endDate.toISOString().split('T')[0],
                due_days: 30
              });
            }}
            disabled={generateInvoiceMutation.isPending}
          >
            <Plus className="h-4 w-4 ml-2" />
            إنشاء فاتورة جماعية
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="البحث في الفواتير..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المسودات</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المدفوعة</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبلغ الإجمالي</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('ar-KW', {
                style: 'currency',
                currency: 'KWD',
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
              }).format(totalAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredInvoices}
        isLoading={isLoading}
      />
    </div>
  );
};