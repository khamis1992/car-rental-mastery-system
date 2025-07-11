import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Smartphone, 
  QrCode, 
  Building,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink
} from "lucide-react";
import { useCreateSadadPayment, useSaasInvoices } from "@/hooks/useSaasData";
import { useToast } from "@/hooks/use-toast";
import { SaasInvoice } from "@/types/unified-saas";

interface SaasPaymentFormProps {
  invoice?: SaasInvoice;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SaasPaymentForm: React.FC<SaasPaymentFormProps> = ({
  invoice,
  onSuccess,
  onCancel
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'sadad' | 'stripe'>('sadad');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [billDescription, setBillDescription] = useState('');
  const [sadadResponse, setSadadResponse] = useState<any>(null);
  
  const { toast } = useToast();
  const { data: invoices = [] } = useSaasInvoices();
  const createSadadPayment = useCreateSadadPayment();

  const handleSadadPayment = async () => {
    if (!invoice) {
      toast({
        title: 'خطأ',
        description: 'يجب اختيار فاتورة أولاً',
        variant: 'destructive',
      });
      return;
    }

    try {
      const paymentData = {
        invoice_id: invoice.id,
        subscription_id: invoice.subscription_id,
        tenant_id: invoice.tenant_id,
        amount: invoice.total_amount,
        currency: invoice.currency,
        customer_mobile: customerMobile,
        customer_email: customerEmail,
        bill_description: billDescription || `فاتورة اشتراك ${invoice.invoice_number}`,
        due_date: invoice.due_date,
      };

      const response = await createSadadPayment.mutateAsync(paymentData);
      
      if (response.success) {
        setSadadResponse(response);
        toast({
          title: 'تم إنشاء فاتورة SADAD',
          description: 'تم إنشاء فاتورة الدفع بنجاح',
        });
      } else {
        throw new Error(response.error || 'فشل في إنشاء فاتورة SADAD');
      }
    } catch (error) {
      console.error('خطأ في إنشاء فاتورة SADAD:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'تم النسخ',
      description: 'تم نسخ النص إلى الحافظة',
    });
  };

  if (sadadResponse?.success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">تم إنشاء فاتورة SADAD بنجاح</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* معلومات الفاتورة */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">رقم الفاتورة:</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {sadadResponse.bill_id}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(sadadResponse.bill_id)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {sadadResponse.transaction_id && (
              <div className="flex justify-between items-center">
                <span className="font-medium">رقم المعاملة:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {sadadResponse.transaction_id}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(sadadResponse.transaction_id)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="font-medium">المبلغ:</span>
              <span className="text-lg font-bold text-green-600">
                {invoice?.total_amount} {invoice?.currency}
              </span>
            </div>
          </div>

          {/* طرق الدفع المتاحة */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">طرق الدفع المتاحة:</h3>
            
            {/* QR Code */}
            {sadadResponse.qr_code && (
              <Card className="p-4">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <QrCode className="w-5 h-5" />
                    <span className="font-medium">رمز QR للدفع</span>
                  </div>
                  <div className="mx-auto bg-white p-4 rounded-lg shadow-inner">
                    <img 
                      src={sadadResponse.qr_code} 
                      alt="QR Code للدفع"
                      className="mx-auto max-w-48 max-h-48"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    امسح الرمز بتطبيق البنك أو محفظة SADAD
                  </p>
                </div>
              </Card>
            )}

            {/* رابط الدفع */}
            {sadadResponse.payment_url && (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    <span className="font-medium">الدفع عبر الإنترنت</span>
                  </div>
                  <Button
                    onClick={() => window.open(sadadResponse.payment_url, '_blank')}
                    className="rtl-flex"
                  >
                    <ExternalLink className="w-4 h-4" />
                    فتح صفحة الدفع
                  </Button>
                </div>
              </Card>
            )}

            {/* رقم الفاتورة للدفع في الفروع */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  <span className="font-medium">الدفع في الفروع</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  يمكنك الدفع في أي فرع من فروع البنوك التالية باستخدام رقم الفاتورة:
                </p>
                <div className="bg-muted p-3 rounded text-center">
                  <span className="text-lg font-mono font-bold">
                    {sadadResponse.bill_id}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>البنوك المشاركة:</strong> البنك الأهلي الكويتي، بنك الكويت الوطني، 
                  بنك الخليج، البنك التجاري الكويتي، بنك وربة
                </div>
              </div>
            </Card>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onSuccess}
              className="flex-1"
            >
              تم - العودة للفواتير
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setSadadResponse(null)}
            >
              إنشاء فاتورة جديدة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="rtl-title">دفع فاتورة الاشتراك</CardTitle>
        {invoice && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span>فاتورة رقم: {invoice.invoice_number}</span>
              <Badge variant="outline">{invoice.status}</Badge>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>المبلغ المطلوب:</span>
              <span className="text-lg font-bold">{invoice.total_amount} {invoice.currency}</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* اختيار طريقة الدفع */}
        <div className="space-y-3">
          <Label className="rtl-label">طريقة الدفع</Label>
          <RadioGroup
            value={selectedPaymentMethod}
            onValueChange={(value: 'sadad' | 'stripe') => setSelectedPaymentMethod(value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg">
              <RadioGroupItem value="sadad" id="sadad" />
              <div className="flex-1 rtl-flex">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-8 h-8 text-blue-600" />
                  <div>
                    <Label htmlFor="sadad" className="font-medium cursor-pointer">
                      SADAD - نظام المدفوعات الكويتي
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      الدفع عبر البنوك الكويتية ومحافظ SADAD
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">موصى به</Badge>
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse p-3 border rounded-lg opacity-50">
              <RadioGroupItem value="stripe" id="stripe" disabled />
              <div className="flex-1 rtl-flex">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-8 h-8 text-purple-600" />
                  <div>
                    <Label htmlFor="stripe" className="font-medium cursor-pointer">
                      Stripe - البطاقات الائتمانية
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      قريباً - الدفع بالبطاقات الائتمانية
                    </p>
                  </div>
                </div>
                <Badge variant="outline">قريباً</Badge>
              </div>
            </div>
          </RadioGroup>
        </div>

        {selectedPaymentMethod === 'sadad' && (
          <>
            <Separator />
            
            {/* معلومات العميل */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">معلومات العميل</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile" className="rtl-label">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="مثال: 50000000"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="text-left"
                    dir="ltr"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    سيتم إرسال إشعار SMS برقم الفاتورة
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="rtl-label">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@domain.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="rtl-label">وصف الفاتورة</Label>
                <Textarea
                  id="description"
                  placeholder="وصف اختياري للفاتورة..."
                  value={billDescription}
                  onChange={(e) => setBillDescription(e.target.value)}
                  className="min-h-20"
                />
              </div>
            </div>

            {/* ملاحظة مهمة */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-900">معلومات مهمة</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• ستتمكن من الدفع عبر تطبيق البنك أو في أي فرع بنك</li>
                    <li>• سيتم إنشاء رمز QR قابل للمسح</li>
                    <li>• ستتلقى رسالة نصية برقم الفاتورة</li>
                    <li>• صالحة للدفع لمدة 30 يوماً من تاريخ الإنشاء</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* أزرار الإجراءات */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSadadPayment}
            disabled={createSadadPayment.isPending || !customerMobile.trim()}
            className="flex-1 rtl-flex"
          >
            {createSadadPayment.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري إنشاء الفاتورة...
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4" />
                إنشاء فاتورة SADAD
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={createSadadPayment.isPending}
            >
              إلغاء
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SaasPaymentForm;