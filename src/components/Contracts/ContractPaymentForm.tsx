import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ContractPaymentFormProps {
  contract: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ContractPaymentForm: React.FC<ContractPaymentFormProps> = ({
  contract,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: contract?.final_amount || 0,
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Register payment and activate contract
      const { error } = await supabase
        .from('contracts')
        .update({
          payment_registered_at: new Date().toISOString(),
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', contract.id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الدفع وتفعيل العقد بنجاح",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error registering payment:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الدفع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentData = (field: string, value: any) => {
    setPaymentData(prev => ({ ...prev, [field]: value }));
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            تسجيل دفع العقد {contract.contract_number}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                ملخص الدفع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>المبلغ الإجمالي:</span>
                <span className="font-medium">{contract.final_amount} د.ك</span>
              </div>
              <div className="flex justify-between">
                <span>الضمان:</span>
                <span className="font-medium">{contract.security_deposit || 0} د.ك</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>إجمالي المطلوب:</span>
                <span>{(contract.final_amount + (contract.security_deposit || 0))} د.ك</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل الدفع</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">المبلغ المدفوع</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => updatePaymentData('amount', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment_method">طريقة الدفع</Label>
                <Select
                  value={paymentData.payment_method}
                  onValueChange={(value) => updatePaymentData('payment_method', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">نقدي</SelectItem>
                    <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                    <SelectItem value="debit_card">بطاقة خصم</SelectItem>
                    <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                    <SelectItem value="check">شيك</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment_date">تاريخ الدفع</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => updatePaymentData('payment_date', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="reference_number">رقم المرجع (اختياري)</Label>
                <Input
                  id="reference_number"
                  value={paymentData.reference_number}
                  onChange={(e) => updatePaymentData('reference_number', e.target.value)}
                  placeholder="رقم الفاتورة أو المرجع"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                <Input
                  id="notes"
                  value={paymentData.notes}
                  onChange={(e) => updatePaymentData('notes', e.target.value)}
                  placeholder="أي ملاحظات إضافية"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري التسجيل...' : 'تسجيل الدفع وتفعيل العقد'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};