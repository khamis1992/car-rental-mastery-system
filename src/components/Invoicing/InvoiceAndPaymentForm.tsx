import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Receipt, CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { serviceContainer } from '@/services/Container/ServiceContainer';
import { AutoInvoiceCreationService } from '@/services/BusinessServices';
import { formatCurrencyKWD } from '@/lib/currency';
import { supabase } from '@/integrations/supabase/client';
import { downloadPaymentReceiptPDF } from '@/lib/paymentReceiptPDFService';
import { PaymentReceipt } from '@/types/payment-receipt';

interface InvoiceAndPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  contract: any;
}

interface FormData {
  paymentAmount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'check' | 'online';
  transactionReference: string;
  bankName: string;
  checkNumber: string;
  notes: string;
}

export const InvoiceAndPaymentForm: React.FC<InvoiceAndPaymentFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  contract,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPrintOption, setShowPrintOption] = useState(false);
  const [lastCreatedPayment, setLastCreatedPayment] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    paymentAmount: contract?.final_amount || 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    transactionReference: '',
    bankName: '',
    checkNumber: '',
    notes: '',
  });

  // إنشاء خدمة الإنشاء التلقائي باستخدام useMemo لتجنب إعادة الإنشاء
  const autoService = useMemo(() => {
    const invoiceService = serviceContainer.getInvoiceBusinessService();
    const paymentService = serviceContainer.getPaymentBusinessService();
    return new AutoInvoiceCreationService(invoiceService, paymentService);
  }, []);

  React.useEffect(() => {
    if (contract) {
      setFormData(prev => ({
        ...prev,
        paymentAmount: contract.final_amount || 0,
      }));
    }
  }, [contract]);

  // إعادة تعيين الحالات عند فتح/إغلاق الحوار
  React.useEffect(() => {
    if (!open) {
      // إعادة تعيين جميع الحالات عند إغلاق الحوار
      setShowPrintOption(false);
      setLastCreatedPayment(null);
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await autoService.createInvoiceAndPayment({
        contractId: contract.id,
        paymentAmount: formData.paymentAmount,
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        transactionReference: formData.transactionReference || undefined,
        bankName: formData.bankName || undefined,
        checkNumber: formData.checkNumber || undefined,
        notes: formData.notes || undefined,
      });

      // تحديث حالة العقد إذا كان الدفع مكتملاً
      await autoService.checkAndUpdateContractStatus(contract.id, formData.paymentAmount);
      
      // تحديث إضافي للتأكد من أن العقد نشط عند الدفع الكامل
      const { data: updatedInvoices } = await supabase
        .from('invoices')
        .select('outstanding_amount')
        .eq('contract_id', contract.id);
      
      const totalOutstanding = updatedInvoices?.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0) || 0;
      
      if (totalOutstanding === 0) {
        await supabase
          .from('contracts')
          .update({ 
            payment_registered_at: new Date().toISOString(),
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', contract.id);
      }

      // حفظ بيانات الدفعة الأخيرة للطباعة
      setLastCreatedPayment({
        payment: result.payment,
        invoice: result.invoice,
        contract: contract
      });
      setShowPrintOption(true);

      toast({
        title: "تم بنجاح",
        description: `تم إنشاء الفاتورة رقم ${result.invoice.invoice_number} وتسجيل الدفعة رقم ${result.payment.payment_number}`,
      });
      
      // إعادة تعيين النموذج
      setFormData({
        paymentAmount: 0,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        transactionReference: '',
        bankName: '',
        checkNumber: '',
        notes: '',
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إنشاء الفاتورة والدفعة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!lastCreatedPayment) return;

    try {
      const { payment, invoice, contract } = lastCreatedPayment;
      
      const receipt: PaymentReceipt = {
        receipt_number: payment.payment_number,
        payment_date: payment.payment_date,
        customer_name: contract.customers?.name || 'غير محدد',
        customer_phone: contract.customers?.phone || undefined,
        contract_number: contract.contract_number,
        vehicle_info: contract.vehicles ? 
          `${contract.vehicles.make} ${contract.vehicles.model} - ${contract.vehicles.license_plate}` : 
          'غير محدد',
        payment_amount: payment.amount,
        payment_method: payment.payment_method,
        transaction_reference: payment.transaction_reference || undefined,
        bank_name: payment.bank_name || undefined,
        check_number: payment.check_number || undefined,
        invoice_number: invoice.invoice_number,
        total_invoice_amount: invoice.total_amount,
        remaining_amount: invoice.outstanding_amount,
        notes: payment.notes || undefined,
        company_info: {
          name: 'شركة تأجير المركبات',
          address: 'الكويت',
          phone: '+965 1234 5678',
          email: 'info@rental.com'
        }
      };

      await downloadPaymentReceiptPDF(receipt);
      
      toast({
        title: "تم بنجاح",
        description: "تم تحميل إيصال الدفع بنجاح",
      });
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast({
        title: "خطأ",
        description: "فشل في طباعة الإيصال",
        variant: "destructive",
      });
    }
  };

  const handleCloseDialog = () => {
    setShowPrintOption(false);
    setLastCreatedPayment(null);
    setLoading(false);
    
    // إعادة تعيين النموذج للقيم الافتراضية
    setFormData({
      paymentAmount: contract?.final_amount || 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      transactionReference: '',
      bankName: '',
      checkNumber: '',
      notes: '',
    });
    
    onSuccess();
    onOpenChange(false);
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        // إعادة تعيين الحالات عند إغلاق الحوار
        setShowPrintOption(false);
        setLastCreatedPayment(null);
        setLoading(false);
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            إنشاء فاتورة وتسجيل دفعة
          </DialogTitle>
        </DialogHeader>

        {/* معلومات العقد */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              معلومات العقد
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">رقم العقد:</span>
              <p className="font-medium">{contract.contract_number}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">العميل:</span>
              <p className="font-medium">{contract.customers?.name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">المركبة:</span>
              <p className="font-medium">
                {contract.vehicles ? 
                  `${contract.vehicles.make} ${contract.vehicles.model}` : 
                  'غير محدد'
                }
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">المدة:</span>
              <p className="font-medium">{contract.rental_days} يوم</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">السعر اليومي:</span>
              <p className="font-medium">{formatCurrencyKWD(contract.daily_rate)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">المجموع النهائي:</span>
              <p className="font-medium text-primary">{formatCurrencyKWD(contract.final_amount)}</p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* تفاصيل الفاتورة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                تفاصيل الفاتورة التي سيتم إنشاؤها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/20 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>نوع الفاتورة:</span>
                  <span className="font-medium">فاتورة إيجار</span>
                </div>
                <div className="flex justify-between">
                  <span>الوصف:</span>
                  <span className="font-medium">
                    إيجار {contract.vehicles ? 
                      `${contract.vehicles.make} ${contract.vehicles.model} - ${contract.vehicles.license_plate}` : 
                      'مركبة'
                    } لمدة {contract.rental_days} يوم
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>الكمية:</span>
                  <span className="font-medium">{contract.rental_days} يوم</span>
                </div>
                <div className="flex justify-between">
                  <span>السعر اليومي:</span>
                  <span className="font-medium">{formatCurrencyKWD(contract.daily_rate)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>مجموع الفاتورة:</span>
                  <span className="text-primary">{formatCurrencyKWD(contract.final_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تفاصيل الدفعة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                تفاصيل الدفعة
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentAmount">مبلغ الدفعة</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.001"
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    paymentAmount: parseFloat(e.target.value) || 0 
                  }))}
                  max={contract.final_amount}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  الحد الأقصى: {formatCurrencyKWD(contract.final_amount)}
                </p>
              </div>

              <div>
                <Label htmlFor="paymentDate">تاريخ الدفع</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    paymentDate: e.target.value 
                  }))}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value: any) => setFormData(prev => ({ 
                    ...prev, 
                    paymentMethod: value 
                  }))}
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

          {/* تفاصيل المعاملة */}
          {formData.paymentMethod !== 'cash' && (
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل المعاملة</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.paymentMethod === 'bank_transfer' || 
                  formData.paymentMethod === 'card' || 
                  formData.paymentMethod === 'online') && (
                  <div>
                    <Label htmlFor="transactionReference">رقم المعاملة</Label>
                    <Input
                      id="transactionReference"
                      value={formData.transactionReference}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        transactionReference: e.target.value 
                      }))}
                      placeholder="رقم المعاملة أو المرجع"
                    />
                  </div>
                )}

                {(formData.paymentMethod === 'bank_transfer' || 
                  formData.paymentMethod === 'card') && (
                  <div>
                    <Label htmlFor="bankName">اسم البنك</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        bankName: e.target.value 
                      }))}
                      placeholder="اسم البنك"
                    />
                  </div>
                )}

                {formData.paymentMethod === 'check' && (
                  <>
                    <div>
                      <Label htmlFor="checkNumber">رقم الشيك</Label>
                      <Input
                        id="checkNumber"
                        value={formData.checkNumber}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          checkNumber: e.target.value 
                        }))}
                        placeholder="رقم الشيك"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankName">البنك المسحوب عليه</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          bankName: e.target.value 
                        }))}
                        placeholder="اسم البنك"
                        required
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ملاحظات */}
          <Card>
            <CardHeader>
              <CardTitle>ملاحظات</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="notes">ملاحظات إضافية</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                placeholder="ملاحظات حول الفاتورة والدفعة"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* الإجراءات */}
          {showPrintOption ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-800 font-medium mb-3">
                  تم إنشاء الفاتورة وتسجيل الدفعة بنجاح!
                </p>
                <p className="text-green-700 text-sm mb-4">
                  هل تريد طباعة إيصال الدفع؟
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handlePrintReceipt} className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    طباعة الإيصال
                  </Button>
                  <Button variant="outline" onClick={handleCloseDialog}>
                    تخطي الطباعة
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenChange(false);
                }}
                disabled={loading}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'جاري المعالجة...' : 'إنشاء الفاتورة وتسجيل الدفعة'}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};