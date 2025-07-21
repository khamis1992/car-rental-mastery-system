
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { FileText, Printer, Download } from 'lucide-react';
import { expenseVoucherService, type ExpenseVoucher, type ExpenseVoucherItem } from '@/services/expenseVoucherService';
import { toast } from 'sonner';

interface ExpenseVoucherDetailsProps {
  voucher: ExpenseVoucher;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExpenseVoucherDetails: React.FC<ExpenseVoucherDetailsProps> = ({
  voucher,
  open,
  onOpenChange
}) => {
  const [items, setItems] = useState<ExpenseVoucherItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && voucher) {
      loadVoucherItems();
    }
  }, [open, voucher]);

  const loadVoucherItems = async () => {
    try {
      setLoading(true);
      const data = await expenseVoucherService.getExpenseVoucherItems(voucher.id);
      setItems(data);
    } catch (error) {
      console.error('خطأ في تحميل بنود السند:', error);
      toast.error('فشل في تحميل بنود السند');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'مسودة';
      case 'pending_approval':
        return 'في انتظار الموافقة';
      case 'approved':
        return 'معتمد';
      case 'rejected':
        return 'مرفوض';
      case 'paid':
        return 'مدفوع';
      case 'cancelled':
        return 'ملغى';
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'نقداً';
      case 'bank_transfer':
        return 'تحويل بنكي';
      case 'check':
        return 'شيك';
      default:
        return method;
    }
  };

  const getBeneficiaryTypeLabel = (type: string) => {
    switch (type) {
      case 'supplier':
        return 'مورد';
      case 'employee':
        return 'موظف';
      case 'other':
        return 'أخرى';
      default:
        return type;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // تنفيذ تحميل السند كـ PDF
    toast.info('جاري تحضير ملف PDF...');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>تفاصيل سند الصرف - {voucher.voucher_number}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 ml-2" />
                طباعة
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 ml-2" />
                تحميل PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* معلومات السند الأساسية */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات السند</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">رقم السند</label>
                  <p className="text-lg font-semibold">{voucher.voucher_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">التاريخ</label>
                  <p className="text-lg">{new Date(voucher.voucher_date).toLocaleDateString('ar-SA')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">الحالة</label>
                  <Badge className={getStatusColor(voucher.status)}>
                    {getStatusLabel(voucher.status)}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">المبلغ الصافي</label>
                  <p className="text-lg font-bold text-green-600">{voucher.net_amount.toFixed(3)} د.ك</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">المستفيد</label>
                  <p className="text-lg">{voucher.beneficiary_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">نوع المستفيد</label>
                  <p className="text-lg">{getBeneficiaryTypeLabel(voucher.beneficiary_type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">طريقة الدفع</label>
                  <p className="text-lg">{getPaymentMethodLabel(voucher.payment_method)}</p>
                </div>
              </div>

              {(voucher.check_number || voucher.reference_number) && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4">
                    {voucher.check_number && (
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">رقم الشيك</label>
                        <p className="text-lg">{voucher.check_number}</p>
                      </div>
                    )}
                    {voucher.reference_number && (
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">رقم المرجع</label>
                        <p className="text-lg">{voucher.reference_number}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {voucher.description && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">وصف السند</label>
                    <p className="text-lg">{voucher.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* بنود السند */}
          <Card>
            <CardHeader>
              <CardTitle>بنود السند</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">جاري تحميل البنود...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الوصف</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>السعر الوحدة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>نسبة الضريبة</TableHead>
                      <TableHead>الضريبة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit_price.toFixed(3)} د.ك</TableCell>
                        <TableCell>{item.total_amount.toFixed(3)} د.ك</TableCell>
                        <TableCell>{item.tax_rate}%</TableCell>
                        <TableCell>{item.tax_amount.toFixed(3)} د.ك</TableCell>
                        <TableCell className="font-semibold">
                          {(item.total_amount + item.tax_amount).toFixed(3)} د.ك
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ملخص المبالغ */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص المبالغ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{voucher.total_amount.toFixed(3)}</div>
                  <div className="text-sm text-muted-foreground">المبلغ الإجمالي</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{voucher.tax_amount.toFixed(3)}</div>
                  <div className="text-sm text-muted-foreground">الضريبة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{voucher.net_amount.toFixed(3)}</div>
                  <div className="text-sm text-muted-foreground">المبلغ الصافي</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات الموافقة والدفع */}
          {(voucher.approved_at || voucher.paid_at) && (
            <Card>
              <CardHeader>
                <CardTitle>معلومات الموافقة والدفع</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {voucher.approved_at && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">تاريخ الموافقة</label>
                      <p className="text-lg">{new Date(voucher.approved_at).toLocaleDateString('ar-SA')}</p>
                    </div>
                  )}
                  {voucher.paid_at && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground">تاريخ الدفع</label>
                      <p className="text-lg">{new Date(voucher.paid_at).toLocaleDateString('ar-SA')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* الملاحظات */}
          {voucher.notes && (
            <Card>
              <CardHeader>
                <CardTitle>الملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{voucher.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
