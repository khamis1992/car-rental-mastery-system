
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DataTable } from '@/components/DataTable';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Calendar as CalendarIcon, FileText, DollarSign, RefreshCw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  useCollectiveInvoices, 
  useGenerateCollectiveInvoice, 
  useUpdateCollectiveInvoice, 
  useDeleteCollectiveInvoice 
} from '@/hooks/useCollectiveInvoices';
import type { CollectiveInvoiceFormData } from '@/types/invoice';

const CollectiveInvoiceManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<CollectiveInvoiceFormData>({
    billing_period_start: '',
    billing_period_end: '',
    due_days: 30,
    notes: '',
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const { data: invoices = [], isLoading, refetch } = useCollectiveInvoices();
  const generateInvoice = useGenerateCollectiveInvoice();
  const updateInvoice = useUpdateCollectiveInvoice();
  const deleteInvoice = useDeleteCollectiveInvoice();

  const handleCreateInvoice = async () => {
    if (!startDate || !endDate) return;

    const data: CollectiveInvoiceFormData = {
      billing_period_start: format(startDate, 'yyyy-MM-dd'),
      billing_period_end: format(endDate, 'yyyy-MM-dd'),
      due_days: formData.due_days,
      notes: formData.notes,
    };

    try {
      await generateInvoice.mutateAsync(data);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      billing_period_start: '',
      billing_period_end: '',
      due_days: 30,
      notes: '',
    });
    setStartDate(undefined);
    setEndDate(undefined);
  };

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

  const filteredInvoices = invoices.filter(invoice =>
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
                onClick={() => updateInvoice.mutate({ id: invoice.id, data: { status: 'sent' } })}
                disabled={updateInvoice.isPending}
              >
                إرسال
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 ml-1" />
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">إدارة الفواتير الجماعية</h2>
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إنشاء فاتورة جماعية
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>إنشاء فاتورة جماعية جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ بداية الفترة</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "اختر التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>تاريخ نهاية الفترة</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="ml-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "اختر التاريخ"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_days">أيام الاستحقاق</Label>
                  <Input
                    id="due_days"
                    type="number"
                    min="1"
                    value={formData.due_days}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      due_days: parseInt(e.target.value) 
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      notes: e.target.value 
                    }))}
                    placeholder="ملاحظات إضافية (اختياري)"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleCreateInvoice}
                    disabled={!startDate || !endDate || generateInvoice.isPending}
                  >
                    {generateInvoice.isPending ? 'جاري الإنشاء...' : 'إنشاء الفاتورة'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="البحث في الفواتير..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

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
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
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

      <DataTable
        columns={columns}
        data={filteredInvoices}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CollectiveInvoiceManager;
