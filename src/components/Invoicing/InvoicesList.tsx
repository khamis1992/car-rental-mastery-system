import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Edit, Send, Download, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InvoiceWithDetails } from '@/types/invoice';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface InvoicesListProps {
  invoices: InvoiceWithDetails[];
  loading?: boolean;
  onRefresh?: () => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onSend: (id: string) => void;
  onDownload: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onAddPayment?: (invoice: any) => void;
}

export const InvoicesList: React.FC<InvoicesListProps> = ({
  invoices,
  loading = false,
  onRefresh,
  onView,
  onEdit,
  onSend,
  onDownload,
  onStatusChange,
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'مسودة', variant: 'secondary' as const },
      sent: { label: 'مرسلة', variant: 'default' as const },
      paid: { label: 'مدفوعة', variant: 'default' as const },
      partially_paid: { label: 'مدفوعة جزئياً', variant: 'secondary' as const },
      overdue: { label: 'متأخرة', variant: 'destructive' as const },
      cancelled: { label: 'ملغاة', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInvoiceTypeBadge = (type: string) => {
    const typeConfig = {
      rental: { label: 'إيجار', variant: 'default' as const },
      additional: { label: 'إضافية', variant: 'secondary' as const },
      penalty: { label: 'غرامة', variant: 'destructive' as const },
      extension: { label: 'تمديد', variant: 'outline' as const },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.rental;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} د.ك`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>قائمة الفواتير</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>رقم العقد</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>تاريخ الإصدار</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>المبلغ الكلي</TableHead>
                <TableHead>المبلغ المستحق</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    لا توجد فواتير
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{invoice.customer_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.contract_number}</TableCell>
                    <TableCell>{getInvoiceTypeBadge(invoice.invoice_type)}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                    <TableCell>
                      <span className={invoice.outstanding_amount > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                        {formatCurrency(invoice.outstanding_amount)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(invoice.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(invoice.id)}>
                              <Edit className="w-4 h-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem onClick={() => onSend(invoice.id)}>
                                <Send className="w-4 h-4 ml-2" />
                                إرسال
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onDownload(invoice.id)}>
                              <Download className="w-4 h-4 ml-2" />
                              تحميل PDF
                            </DropdownMenuItem>
                            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(invoice.id, 'cancelled')}
                                className="text-destructive"
                              >
                                إلغاء الفاتورة
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};