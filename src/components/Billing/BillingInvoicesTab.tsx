import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/DataTable";
import { 
  Plus, 
  Search, 
  Download, 
  Eye, 
  RefreshCw,
  FileText,
  Send,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useSaasInvoices, useUpdateInvoiceStatus } from "@/hooks/useSaasData";
import { useToast } from "@/hooks/use-toast";
import { SaasInvoice } from "@/types/saas";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const BillingInvoicesTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { 
    data: invoices = [], 
    isLoading, 
    refetch 
  } = useSaasInvoices();
  
  const updateInvoiceStatusMutation = useUpdateInvoiceStatus();

  const handleUpdateStatus = async (invoiceId: string, status: SaasInvoice['status']) => {
    try {
      await updateInvoiceStatusMutation.mutateAsync({
        invoiceId,
        status
      });
    } catch (error) {
      toast({
        title: "خطأ في تحديث الفاتورة",
        description: "حدث خطأ أثناء تحديث حالة الفاتورة",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "مسودة", variant: "secondary" as const },
      open: { label: "مرسلة", variant: "default" as const },
      paid: { label: "مدفوعة", variant: "default" as const },
      uncollectible: { label: "غير قابلة للتحصيل", variant: "destructive" as const },
      void: { label: "ملغية", variant: "outline" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.tenant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      accessorKey: "invoice_number",
      header: "رقم الفاتورة",
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono">{row.original.invoice_number}</span>
        </div>
      ),
    },
    {
      accessorKey: "tenant.name",
      header: "المؤسسة",
      cell: ({ row }: { row: any }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.tenant?.name}</span>
          <span className="text-sm text-muted-foreground">{row.original.tenant?.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "subscription.plan.plan_name",
      header: "خطة الاشتراك",
      cell: ({ row }: { row: any }) => (
        <span>{row.original.subscription?.plan?.plan_name || 'غير محدد'}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }: { row: any }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "total_amount",
      header: "المبلغ الإجمالي",
      cell: ({ row }: { row: any }) => (
        <span className="font-medium">
          {row.original.total_amount} {row.original.currency}
        </span>
      ),
    },
    {
      accessorKey: "billing_period_start",
      header: "فترة الفوترة",
      cell: ({ row }: { row: any }) => (
        <div className="text-sm">
          <div>{format(new Date(row.original.billing_period_start), 'dd MMM', { locale: ar })}</div>
          <div className="text-muted-foreground">
            إلى {format(new Date(row.original.billing_period_end), 'dd MMM yyyy', { locale: ar })}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "due_date",
      header: "تاريخ الاستحقاق",
      cell: ({ row }: { row: any }) => (
        <span>
          {row.original.due_date ? 
            format(new Date(row.original.due_date), 'dd MMM yyyy', { locale: ar }) : 
            'غير محدد'
          }
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "تاريخ الإنشاء",
      cell: ({ row }: { row: any }) => (
        <span>
          {format(new Date(row.original.created_at), 'dd MMM yyyy', { locale: ar })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "الإجراءات",
      cell: ({ row }: { row: any }) => {
        const invoice = row.original as SaasInvoice;
        
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
            
            {invoice.status === 'draft' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateStatus(invoice.id, 'open')}
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
            
            {invoice.status === 'open' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateStatus(invoice.id, 'paid')}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
            
            {(invoice.status === 'draft' || invoice.status === 'open') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateStatus(invoice.id, 'void')}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
            
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // حساب الإحصائيات
  const stats = {
    total: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    open: invoices.filter(i => i.status === 'open').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    uncollectible: invoices.filter(i => i.status === 'uncollectible').length,
    totalAmount: invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
    paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">فواتير الاشتراكات</h2>
          <p className="text-muted-foreground">
            إدارة جميع فواتير المؤسسات والاشتراكات
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
            إنشاء فاتورة جديدة
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="البحث في الفواتير..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
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
                <p className="text-sm text-muted-foreground">الفواتير المدفوعة</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <Badge variant="default">مدفوعة</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">الفواتير غير القابلة للتحصيل</p>
                <p className="text-2xl font-bold text-red-600">{stats.uncollectible}</p>
              </div>
              <Badge variant="destructive">متأخرة</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المبلغ</p>
                <p className="text-xl font-bold">{stats.totalAmount.toFixed(2)} د.ك</p>
              </div>
              <Badge variant="secondary">المبلغ</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الإحصائيات المالية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>الإيرادات المحصلة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.paidAmount.toFixed(2)} د.ك
            </div>
            <div className="text-sm text-muted-foreground">
              من أصل {stats.totalAmount.toFixed(2)} د.ك 
              ({((stats.paidAmount / stats.totalAmount) * 100 || 0).toFixed(1)}%)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المبلغ المعلق</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {(stats.totalAmount - stats.paidAmount).toFixed(2)} د.ك
            </div>
            <div className="text-sm text-muted-foreground">
              يتضمن {stats.open + stats.uncollectible} فاتورة غير مدفوعة
            </div>
          </CardContent>
        </Card>
      </div>

      {/* جدول الفواتير */}
      <Card>
        <CardHeader>
          <CardTitle>جميع الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredInvoices}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingInvoicesTab;