import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/DataTable';
import { collectionRecordService } from '@/services/collectionRecords';
import { Plus, RefreshCw, CheckCircle, XCircle, Clock, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import type { CollectionRecord } from '@/types/invoice';

export const CollectionRecordsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: collectionRecords = [], isLoading, refetch } = useQuery({
    queryKey: ['collection-records'],
    queryFn: collectionRecordService.getCollectionRecords,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'verified' | 'rejected' }) =>
      collectionRecordService.verifyCollectionRecord(id, status),
    onSuccess: () => {
      toast.success('تم تحديث حالة التحصيل بنجاح');
      queryClient.invalidateQueries({ queryKey: ['collection-records'] });
    },
    onError: () => {
      toast.error('فشل في تحديث حالة التحصيل');
    },
  });

  const getVerificationBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'في الانتظار', variant: 'secondary' as const, icon: Clock },
      verified: { label: 'موثق', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'مرفوض', variant: 'destructive' as const, icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCollectionTypeBadge = (type: string) => {
    const typeConfig = {
      cash: { label: 'نقدي', variant: 'default' as const },
      bank_transfer: { label: 'تحويل بنكي', variant: 'secondary' as const },
      check: { label: 'شيك', variant: 'outline' as const },
      credit_card: { label: 'بطاقة ائتمان', variant: 'secondary' as const },
      online: { label: 'دفع إلكتروني', variant: 'default' as const },
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.cash;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredRecords = collectionRecords.filter(record =>
    record.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.collection_location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.bank_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: 'تاريخ التحصيل',
      accessorKey: 'collection_date',
      cell: ({ row }: any) => {
        return new Date(row.getValue('collection_date')).toLocaleDateString('ar-KW');
      },
    },
    {
      header: 'نوع التحصيل',
      accessorKey: 'collection_type',
      cell: ({ row }: any) => getCollectionTypeBadge(row.getValue('collection_type')),
    },
    {
      header: 'المبلغ',
      accessorKey: 'collection_amount',
      cell: ({ row }: any) => {
        const amount = parseFloat(row.getValue('collection_amount'));
        return new Intl.NumberFormat('ar-KW', {
          style: 'currency',
          currency: 'KWD',
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }).format(amount);
      },
    },
    {
      header: 'موقع التحصيل',
      accessorKey: 'collection_location',
      cell: ({ row }: any) => row.getValue('collection_location') || '-',
    },
    {
      header: 'البنك/المرجع',
      accessorKey: 'reference',
      cell: ({ row }: any) => {
        const record = row.original;
        return record.bank_name || record.reference_number || record.check_number || '-';
      },
    },
    {
      header: 'حالة التوثيق',
      accessorKey: 'verification_status',
      cell: ({ row }: any) => getVerificationBadge(row.getValue('verification_status')),
    },
    {
      header: 'العميل',
      accessorKey: 'customer_name',
      cell: ({ row }: any) => {
        const record = row.original;
        return record.payment?.customer?.name || '-';
      },
    },
    {
      header: 'الإجراءات',
      id: 'actions',
      cell: ({ row }: any) => {
        const record = row.original;
        const isPending = record.verification_status === 'pending';
        
        return (
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => verifyMutation.mutate({ id: record.id, status: 'verified' })}
                  disabled={verifyMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 ml-1" />
                  توثيق
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => verifyMutation.mutate({ id: record.id, status: 'rejected' })}
                  disabled={verifyMutation.isPending}
                >
                  <XCircle className="h-4 w-4 ml-1" />
                  رفض
                </Button>
              </>
            )}
            <Button variant="outline" size="sm">
              عرض
            </Button>
          </div>
        );
      },
    },
  ];

  const totalAmount = filteredRecords.reduce((sum, record) => sum + record.collection_amount, 0);
  const pendingCount = filteredRecords.filter(record => record.verification_status === 'pending').length;
  const verifiedCount = filteredRecords.filter(record => record.verification_status === 'verified').length;
  const rejectedCount = filteredRecords.filter(record => record.verification_status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">سجلات التحصيل</h2>
          <p className="text-muted-foreground">
            تتبع وتوثيق عمليات تحصيل المدفوعات
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
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            تسجيل تحصيل جديد
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="البحث في سجلات التحصيل..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي التحصيلات</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRecords.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">في الانتظار</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">موثقة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبلغ الإجمالي</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
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
        data={filteredRecords}
        isLoading={isLoading}
      />
    </div>
  );
};