import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { serviceContainer } from '@/services/Container/ServiceContainer';
import { PaymentFormData } from '@/types/invoice';

// NOTE: This component now uses the Repository Pattern via serviceContainer

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  invoice: any;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  invoice,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const paymentService = serviceContainer.getPaymentBusinessService();
  const [formData, setFormData] = useState<PaymentFormData>({
    invoice_id: invoice?.id || '',
    amount: invoice?.outstanding_amount || 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    transaction_reference: '',
    bank_name: '',
    check_number: '',
    notes: '',
  });

  React.useEffect(() => {
    if (invoice) {
      setFormData(prev => ({
        ...prev,
        invoice_id: invoice.id,
        amount: invoice.outstanding_amount || 0,
      }));
    }
  }, [invoice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await paymentService.createPayment(formData);
      
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الدفعة بنجاح",
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        invoice_id: '',
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        transaction_reference: '',
        bank_name: '',
        check_number: '',
        notes: '',
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تسجيل الدفعة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `${amount.toFixed(3)} د.ك`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
        </DialogHeader>

        {invoice && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">تفاصيل الفاتورة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">رقم الفاتورة:</span>
                <p className="font-medium">{invoice.invoice_number}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">اسم العميل:</span>
                <p className="font-medium">{invoice.customer_name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">المبلغ الكلي:</span>
                <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">المبلغ المدفوع:</span>
                <p className="font-medium text-green-600">{formatCurrency(invoice.paid_amount)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">المبلغ المستحق:</span>
                <p className="font-medium text-orange-600">{formatCurrency(invoice.outstanding_amount)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الدفعة</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">المبلغ</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.001"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  max={invoice?.outstanding_amount || 0}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  الحد الأقصى: {formatCurrency(invoice?.outstanding_amount || 0)}
                </p>
              </div>

              <div>
                <Label htmlFor="payment_date">تاريخ الدفع</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="payment_method">طريقة الدفع</Label>
                <Select 
                  value={formData.payment_method} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقداً</SelectItem>
                    <SelectItem value="card">بطاقة ائتمان</SelectItem>
                    <SelectItem value="bank_transfer">حوالة بنكية</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                    <SelectItem value="online">دفع إلكتروني</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          {formData.payment_method !== 'cash' && (
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل المعاملة</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.payment_method === 'bank_transfer' || formData.payment_method === 'card' || formData.payment_method === 'online') && (
                  <div>
                    <Label htmlFor="transaction_reference">رقم المعاملة</Label>
                    <Input
                      id="transaction_reference"
                      value={formData.transaction_reference || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, transaction_reference: e.target.value }))}
                      placeholder="رقم المعاملة أو المرجع"
                    />
                  </div>
                )}

                {(formData.payment_method === 'bank_transfer' || formData.payment_method === 'card') && (
                  <div>
                    <Label htmlFor="bank_name">اسم البنك</Label>
                    <Input
                      id="bank_name"
                      value={formData.bank_name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                      placeholder="اسم البنك"
                    />
                  </div>
                )}

                {formData.payment_method === 'check' && (
                  <>
                    <div>
                      <Label htmlFor="check_number">رقم الشيك</Label>
                      <Input
                        id="check_number"
                        value={formData.check_number || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, check_number: e.target.value }))}
                        placeholder="رقم الشيك"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_name">البنك المسحوب عليه</Label>
                      <Input
                        id="bank_name"
                        value={formData.bank_name || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                        placeholder="اسم البنك"
                        required
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>ملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="notes">ملاحظات إضافية</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="ملاحظات حول الدفعة"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'تسجيل الدفعة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};