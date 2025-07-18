import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { violationService } from '@/services/violationService';
import { ViolationWithDetails } from '@/types/violation';
import { useToast } from '@/hooks/use-toast';

interface ViolationPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  violation: ViolationWithDetails;
  onSuccess: () => void;
}

export const ViolationPaymentForm: React.FC<ViolationPaymentFormProps> = ({
  open,
  onOpenChange,
  violation,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const outstandingAmount = violation.total_amount - violation.paid_amount;

  const [formData, setFormData] = useState({
    amount: outstandingAmount,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'check',
    transaction_reference: '',
    bank_name: '',
    check_number: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      amount: outstandingAmount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      transaction_reference: '',
      bank_name: '',
      check_number: '',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0 || formData.amount > outstandingAmount) {
      toast({
        title: 'مبلغ غير صحيح',
        description: `يجب أن يكون المبلغ بين 0.001 و د.ك ${outstandingAmount.toFixed(3)}`,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      await violationService.createViolationPayment({
        ...formData,
        violation_id: violation.id
      });

      toast({
        title: 'تم تسجيل الدفعة بنجاح',
        description: `تم تسجيل دفعة بقيمة د.ك ${formData.amount.toFixed(3)} وإنشاء القيد المحاسبي تلقائياً`
      });

      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error('Error creating payment:', error);
      
      let errorMessage = 'حدث خطأ أثناء تسجيل دفعة المخالفة';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: 'خطأ في تسجيل الدفعة',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="rtl-title">تسجيل دفعة مخالفة - {violation.violation_number}</DialogTitle>
          <DialogDescription>
            قم بتسجيل دفعة جديدة للمخالفة. تأكد من صحة المبلغ وتفاصيل الدفع قبل الحفظ.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ملخص المخالفة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المبلغ الإجمالي:</span>
              <span className="font-medium">{formatCurrency(violation.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">المبلغ المدفوع:</span>
              <span className="font-medium text-green-600">{formatCurrency(violation.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>المبلغ المستحق:</span>
              <span className="text-red-600">{formatCurrency(outstandingAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount" className="rtl-label">المبلغ المدفوع (د.ك) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.001"
                min="0.001"
                max={outstandingAmount}
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="payment_date" className="rtl-label">تاريخ الدفع *</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="payment_method" className="rtl-label">طريقة الدفع *</Label>
            <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value as 'cash' | 'card' | 'bank_transfer' | 'check' }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">نقداً</SelectItem>
                  <SelectItem value="card">بطاقة ائتمان</SelectItem>
                  <SelectItem value="bank_transfer">حوالة بنكية</SelectItem>
                  <SelectItem value="check">شيك</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.payment_method === 'bank_transfer' && (
              <div>
                <Label htmlFor="transaction_reference" className="rtl-label">رقم المعاملة</Label>
                <Input
                  id="transaction_reference"
                  value={formData.transaction_reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_reference: e.target.value }))}
                  placeholder="رقم المعاملة البنكية"
                />
              </div>
            )}

            {formData.payment_method === 'bank_transfer' && (
              <div>
                <Label htmlFor="bank_name" className="rtl-label">اسم البنك</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                  placeholder="اسم البنك"
                />
              </div>
            )}

            {formData.payment_method === 'check' && (
              <div>
                <Label htmlFor="check_number" className="rtl-label">رقم الشيك</Label>
                <Input
                  id="check_number"
                  value={formData.check_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, check_number: e.target.value }))}
                  placeholder="رقم الشيك"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes" className="rtl-label">ملاحظات</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="أي ملاحظات إضافية حول الدفعة"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
