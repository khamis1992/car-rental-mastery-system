import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AutoInvoiceService, DirectPaymentData } from '@/services/BusinessServices/AutoInvoiceService';
import { formatCurrencyKWD } from '@/lib/currency';
import { Receipt, CreditCard } from 'lucide-react';

interface DirectPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contract?: any;
  customer?: any;
}

export const DirectPaymentForm: React.FC<DirectPaymentFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  contract,
  customer,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [autoInvoiceService] = useState(new AutoInvoiceService());
  
  const [formData, setFormData] = useState<DirectPaymentData>({
    contract_id: contract?.id || '',
    customer_id: customer?.id || '',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    transaction_reference: '',
    bank_name: '',
    check_number: '',
    notes: '',
    invoice_description: '',
  });

  useEffect(() => {
    if (contract && customer) {
      setFormData(prev => ({
        ...prev,
        contract_id: contract.id,
        customer_id: customer.id,
        invoice_description: `دفعة إيجار - ${contract.vehicle_info || 'مركبة'} - العقد رقم ${contract.contract_number}`,
      }));
    }
  }, [contract, customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await autoInvoiceService.createDirectPayment(formData);
      
      toast({
        title: "تم بنجاح",
        description: `تم تسجيل الدفعة وإنشاء الفاتورة تلقائياً`,
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        contract_id: '',
        customer_id: '',
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        transaction_reference: '',
        bank_name: '',
        check_number: '',
        notes: '',
        invoice_description: '',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            دفعة مباشرة - بدون فاتورة مسبقة
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            سيتم إنشاء فاتورة تلقائياً عند تسجيل الدفعة
          </p>
        </DialogHeader>

        {/* Contract & Customer Info */}
        {contract && customer && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg rtl-title">تفاصيل العقد والعميل</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">رقم العقد:</span>
                <p className="font-medium">{contract.contract_number}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">اسم العميل:</span>
                <p className="font-medium">{customer.name}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">المركبة:</span>
                <p className="font-medium">{contract.vehicle_info}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">حالة العقد:</span>
                <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                  {contract.status === 'active' ? 'نشط' : 
                   contract.status === 'completed' ? 'مكتمل' : 
                   contract.status}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">فترة الإيجار:</span>
                <p className="font-medium">{contract.rental_days} يوم</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">المعدل اليومي:</span>
                <p className="font-medium">{formatCurrencyKWD(contract.daily_rate)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                تفاصيل الدفعة
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" className="rtl-label">المبلغ *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.001"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  required
                  min="0.001"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  أدخل مبلغ الدفعة المراد تسجيلها
                </p>
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

              <div className="md:col-span-2">
                <Label htmlFor="payment_method" className="rtl-label">طريقة الدفع *</Label>
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

              <div className="md:col-span-2">
                <Label htmlFor="invoice_description" className="rtl-label">وصف الفاتورة</Label>
                <Input
                  id="invoice_description"
                  value={formData.invoice_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoice_description: e.target.value }))}
                  placeholder="وصف مختصر لبند الفاتورة"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  سيظهر هذا الوصف في بند الفاتورة المنشأة تلقائياً
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          {formData.payment_method !== 'cash' && (
            <Card>
              <CardHeader>
                <CardTitle className="rtl-title">تفاصيل المعاملة</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.payment_method === 'bank_transfer' || formData.payment_method === 'card' || formData.payment_method === 'online') && (
                  <div>
                    <Label htmlFor="transaction_reference" className="rtl-label">رقم المعاملة</Label>
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
                    <Label htmlFor="bank_name" className="rtl-label">اسم البنك</Label>
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
                      <Label htmlFor="check_number" className="rtl-label">رقم الشيك *</Label>
                      <Input
                        id="check_number"
                        value={formData.check_number || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, check_number: e.target.value }))}
                        placeholder="رقم الشيك"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_name" className="rtl-label">البنك المسحوب عليه *</Label>
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
              <CardTitle className="rtl-title">ملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="notes" className="rtl-label">ملاحظات إضافية</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="ملاحظات حول الدفعة والفاتورة"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Auto-generation Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Receipt className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">إنشاء فاتورة تلقائي</h4>
                  <p className="text-sm text-blue-800">
                    سيتم إنشاء فاتورة تلقائياً مع البيانات التالية:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 list-disc list-inside space-y-1">
                    <li>مبلغ الفاتورة: {formatCurrencyKWD(formData.amount)}</li>
                    <li>تاريخ الاستحقاق: 30 يوم من تاريخ الدفع</li>
                    <li>حالة الفاتورة: مدفوعة (تم الدفع مسبقاً)</li>
                    <li>ستكون مربوطة بالعقد والعميل المحدد</li>
                  </ul>
                </div>
              </div>
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
            <Button type="submit" disabled={loading || !formData.amount || !formData.contract_id}>
              {loading ? 'جاري الحفظ...' : 'تسجيل الدفعة وإنشاء الفاتورة'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};