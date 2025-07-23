import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Receipt, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Payment } from '@/types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PaymentsListProps {
  payments?: Payment[];
  loading?: boolean;
  onRefresh?: () => void;
  onView: (id: string) => void;
  onPrintReceipt: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export const PaymentsList: React.FC<PaymentsListProps> = ({
  payments = [],
  loading = false,
  onRefresh,
  onView,
  onPrintReceipt,
  onStatusChange,
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'معلق', variant: 'secondary' as const },
      completed: { label: 'مكتمل', variant: 'default' as const },
      failed: { label: 'فاشل', variant: 'destructive' as const },
      cancelled: { label: 'ملغي', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodText = (method: string) => {
    const methodMap: Record<string, string> = {
      cash: 'نقداً',
      card: 'بطاقة ائتمان',
      bank_transfer: 'حوالة بنكية',
      check: 'شيك',
      online: 'دفع إلكتروني'
    };
    return methodMap[method] || method;
  };

  const formatCurrency = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>قائمة المدفوعات</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم الدفعة</TableHead>
                <TableHead>رقم الفاتورة</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>تاريخ الدفع</TableHead>
                <TableHead>طريقة الدفع</TableHead>
                <TableHead>رقم المعاملة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    لا توجد مدفوعات
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.payment_number}
                    </TableCell>
                    <TableCell>
                      {payment.invoices?.invoice_number || 'غير محدد'}
                    </TableCell>
                    <TableCell>
                      {payment.customers?.name || 'غير محدد'}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      {getPaymentMethodText(payment.payment_method)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.transaction_reference || payment.check_number || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(payment.id)}
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
                            <DropdownMenuItem onClick={() => onPrintReceipt(payment.id)}>
                              <Receipt className="w-4 h-4 ml-2" />
                              طباعة إيصال
                            </DropdownMenuItem>
                            {payment.status === 'pending' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => onStatusChange(payment.id, 'completed')}
                                  className="text-green-600"
                                >
                                  تأكيد الدفعة
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onStatusChange(payment.id, 'failed')}
                                  className="text-red-600"
                                >
                                  رفض الدفعة
                                </DropdownMenuItem>
                              </>
                            )}
                            {payment.status !== 'cancelled' && (
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(payment.id, 'cancelled')}
                                className="text-destructive"
                              >
                                إلغاء الدفعة
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