import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/DataTable";
import { 
  Plus, 
  Search, 
  Eye, 
  RefreshCw,
  CreditCard,
  Building,
  Banknote,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { useSaasPayments, useCreatePayment } from "@/hooks/useSaasData";
import { useToast } from "@/hooks/use-toast";
import { SaasPayment } from "@/types/saas";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const PaymentMethodsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { 
    data: payments = [], 
    isLoading, 
    refetch 
  } = useSaasPayments();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      processing: { label: "قيد المعالجة", variant: "secondary" as const, icon: Clock },
      succeeded: { label: "مكتملة", variant: "default" as const, icon: CheckCircle },
      failed: { label: "فاشلة", variant: "destructive" as const, icon: XCircle },
      canceled: { label: "ملغية", variant: "outline" as const, icon: XCircle },
      requires_action: { label: "تتطلب إجراء", variant: "secondary" as const, icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.processing;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit_card':
        return <CreditCard className="w-4 h-4" />;
      case 'bank_transfer':
        return <Building className="w-4 h-4" />;
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      credit_card: 'بطاقة ائتمان',
      debit_card: 'بطاقة مدين',
      bank_transfer: 'تحويل بنكي',
      cash: 'نقد',
      check: 'شيك',
      online_payment: 'دفع إلكتروني',
    };
    
    return methods[method as keyof typeof methods] || method;
  };

  const filteredPayments = payments.filter(payment =>
    payment.tenant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.invoice?.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      accessorKey: "payment_reference",
      header: "رقم المرجع",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono">
            {`PAY-${row.original.id.slice(-8)}`}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "tenant.name",
      header: "المؤسسة",
      cell: ({ row }: { row: any }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.tenant?.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "invoice.invoice_number",
      header: "رقم الفاتورة",
      cell: ({ row }: { row: any }) => (
        <span className="font-mono">{row.original.invoice?.invoice_number}</span>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "طريقة الدفع",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          {getPaymentMethodIcon(row.original.payment_method)}
          <span>{getPaymentMethodLabel(row.original.payment_method)}</span>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "المبلغ",
      cell: ({ row }: { row: any }) => (
        <span className="font-medium text-green-600">
          {row.original.amount} د.ك
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }: { row: any }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "payment_date",
      header: "تاريخ الدفع",
      cell: ({ row }: { row: any }) => (
        <span>
          {format(new Date(row.original.payment_date), 'dd MMM yyyy', { locale: ar })}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "تاريخ التسجيل",
      cell: ({ row }: { row: any }) => (
        <span>
          {format(new Date(row.original.created_at), 'dd MMM yyyy HH:mm', { locale: ar })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }: { row: any }) => {
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // حساب الإحصائيات
  const stats = {
    total: payments.length,
    succeeded: payments.filter(p => p.status === 'succeeded').length,
    processing: payments.filter(p => p.status === 'processing').length,
    failed: payments.filter(p => p.status === 'failed').length,
    totalAmount: payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + p.amount, 0),
    thisMonth: payments.filter(p => {
      const paymentDate = new Date(p.paid_at || p.created_at);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return paymentDate.getMonth() === currentMonth && 
             paymentDate.getFullYear() === currentYear &&
             p.status === 'succeeded';
    }).reduce((sum, p) => sum + p.amount, 0),
  };

  // تحليل طرق الدفع
  const paymentMethodStats = payments.reduce((acc, payment) => {
    if (payment.status === 'succeeded') {
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">المدفوعات وطرق الدفع</h2>
          <p className="text-muted-foreground">
            إدارة جميع المدفوعات ومراقبة طرق الدفع
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          
          <Button>
            <Plus className="w-4 h-4" />
            تسجيل دفعة جديدة
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="البحث في المدفوعات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المدفوعات</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Badge variant="outline">المجموع</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المدفوعات المكتملة</p>
                <p className="text-2xl font-bold text-green-600">{stats.succeeded}</p>
              </div>
              <Badge variant="default">مكتملة</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المدفوعات قيد المعالجة</p>
                <p className="text-2xl font-bold text-orange-600">{stats.processing}</p>
              </div>
              <Badge variant="secondary">قيد المعالجة</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المدفوعات الفاشلة</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <Badge variant="destructive">فاشلة</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الإحصائيات المالية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>إجمالي الإيرادات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.totalAmount.toFixed(2)} د.ك
            </div>
            <div className="text-sm text-muted-foreground">
              من {stats.succeeded} دفعة مكتملة
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إيرادات هذا الشهر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.thisMonth.toFixed(2)} د.ك
            </div>
            <div className="text-sm text-muted-foreground">
              {((stats.thisMonth / stats.totalAmount) * 100 || 0).toFixed(1)}% من الإجمالي
            </div>
          </CardContent>
        </Card>
      </div>

      {/* إحصائيات طرق الدفع */}
      <Card>
        <CardHeader>
          <CardTitle>توزيع طرق الدفع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(paymentMethodStats).map(([method, amount]) => (
              <div key={method} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(method)}
                  <span>{getPaymentMethodLabel(method)}</span>
                </div>
                <span className="font-bold">{amount.toFixed(2)} د.ك</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* جدول المدفوعات */}
      <Card>
        <CardHeader>
          <CardTitle>جميع المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredPayments}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentMethodsTab;