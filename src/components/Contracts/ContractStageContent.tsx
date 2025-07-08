import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, PenTool, Truck, CreditCard, CheckCircle, Clock, User, Car, Calendar, DollarSign, MapPin, Camera, Signature, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { downloadPaymentReceiptPDF } from '@/lib/paymentReceiptPDFService';
interface ContractStageContentProps {
  stage: string;
  contract: any;
  onShowCustomerSignature: () => void;
  onShowCompanySignature: () => void;
  onShowDelivery: () => void;
  onShowReturn: () => void;
  onShowPayment: () => void;
  onAdvanceToNextStage?: () => void;
}
export const ContractStageContent: React.FC<ContractStageContentProps> = ({
  stage,
  contract,
  onShowCustomerSignature,
  onShowCompanySignature,
  onShowDelivery,
  onShowReturn,
  onShowPayment,
  onAdvanceToNextStage
}) => {
  const {
    toast
  } = useToast();
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory'
    });
  };
  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} د.ك`;
  };
  const renderDraftStage = () => <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <FileText className="w-5 h-5" />
            تفاصيل العقد الأساسية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">العميل</span>
              </div>
              <p className="text-sm">{contract.customers?.name}</p>
              <p className="text-xs text-muted-foreground">{contract.customers?.phone}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Car className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">المركبة</span>
              </div>
              <p className="text-sm">{contract.vehicles?.make} {contract.vehicles?.model}</p>
              <p className="text-xs text-muted-foreground">{contract.vehicles?.license_plate}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">فترة الإيجار</span>
              </div>
              <p className="text-sm">{formatDate(contract.start_date)} - {formatDate(contract.end_date)}</p>
              <p className="text-xs text-muted-foreground">{contract.rental_days} يوم</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">المبلغ الإجمالي</span>
              </div>
              <p className="text-sm font-semibold">{formatCurrency(contract.final_amount)}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(contract.daily_rate)}/يوم</p>
            </div>
          </div>

          {contract.special_conditions && <div className="text-right">
              <span className="text-sm font-medium">الشروط الخاصة:</span>
              <p className="text-sm text-muted-foreground mt-1">{contract.special_conditions}</p>
            </div>}
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2 text-right">المهام المطلوبة:</h3>
        <ul className="list-disc list-inside text-blue-800 space-y-1 text-right">
          <li>التحقق من بيانات العميل</li>
          <li>مراجعة تفاصيل المركبة</li>
          <li>تحديد شروط الإيجار</li>
          <li>إعداد الوثائق المطلوبة</li>
        </ul>
      </div>

      {contract.status === 'draft' && onAdvanceToNextStage && <div className="flex justify-end">
          <Button onClick={onAdvanceToNextStage} className="px-8">
            الانتقال للمرحلة التالية
          </Button>
        </div>}
    </div>;
  const renderPendingStage = () => <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Signature className="w-5 h-5" />
            حالة التوقيعات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-right">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={contract.customer_signature ? "default" : "secondary"}>
                  {contract.customer_signature ? "تم التوقيع" : "في الانتظار"}
                </Badge>
                <span className="text-sm font-medium">توقيع العميل</span>
              </div>
              {contract.customer_signature ? <div className="text-xs text-muted-foreground">
                  تم التوقيع في: {formatDate(contract.customer_signed_at)}
                </div> : <Button size="sm" onClick={onShowCustomerSignature} className="w-full">
                  طلب التوقيع من العميل
                </Button>}
            </div>
            
            <div className="text-right">
              <div className="flex items-center justify-between mb-2">
                <Badge variant={contract.company_signature ? "default" : "secondary"}>
                  {contract.company_signature ? "تم التوقيع" : "في الانتظار"}
                </Badge>
                <span className="text-sm font-medium">توقيع الشركة</span>
              </div>
              {contract.company_signature ? <div className="text-xs text-muted-foreground">
                  تم التوقيع في: {formatDate(contract.company_signed_at)}
                </div> : <Button size="sm" onClick={onShowCompanySignature} className="w-full">
                  توقيع باسم الشركة
                </Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <h3 className="font-medium text-orange-900 mb-2 text-right">المهام المطلوبة:</h3>
        <ul className="list-disc list-inside text-orange-800 space-y-1 text-right">
          <li>إرسال العقد للعميل للتوقيع</li>
          <li>متابعة توقيع العميل</li>
          <li>توقيع الشركة على العقد</li>
          <li>التأكد من اكتمال جميع التوقيعات</li>
        </ul>
      </div>

      {/* Advance to Next Stage Button - Show when both signatures are complete */}
      {contract.customer_signature && contract.company_signature && contract.status === 'pending' && onAdvanceToNextStage && <div className="flex justify-end">
          <Button onClick={onAdvanceToNextStage} className="px-8">
            الانتقال للمرحلة التالية
          </Button>
        </div>}
    </div>;
  const renderDeliveryStage = () => <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Truck className="w-5 h-5" />
            حالة التسليم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contract.delivery_completed_at ? <div className="bg-green-100 p-4 rounded-lg border border-green-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">تم تسليم المركبة بنجاح</h3>
              </div>
              <p className="text-green-800 text-sm">
                تاريخ التسليم: {formatDate(contract.delivery_completed_at)}
              </p>
              <p className="text-green-700 text-sm mt-1 font-medium">
                يمكنك الآن الانتقال لمرحلة الدفع لتفعيل العقد
              </p>
            </div> : <div className="space-y-4">
              <div className="text-center">
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">جاهز للتسليم</h3>
                <p className="text-muted-foreground mb-4">المركبة جاهزة للتسليم للعميل</p>
                <Button onClick={onShowDelivery} className="px-8">
                  بدء عملية التسليم
                </Button>
              </div>
            </div>}

          {contract.pickup_photos && contract.pickup_photos.length > 0 && <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">صور التسليم</span>
              </div>
              <p className="text-sm text-muted-foreground">
                تم رفع {contract.pickup_photos.length} صورة
              </p>
            </div>}
        </CardContent>
      </Card>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h3 className="font-medium text-green-900 mb-2 text-right">المهام المطلوبة:</h3>
        <ul className="list-disc list-inside text-green-800 space-y-1 text-right">
          <li>فحص المركبة قبل التسليم</li>
          <li>توثيق حالة المركبة بالصور</li>
          <li>تسليم المفاتيح والوثائق</li>
          <li>تأكيد استلام العميل</li>
        </ul>
      </div>

      {/* Advance to Next Stage Button - Show when delivery is completed but payment not handled */}
      {contract.delivery_completed_at && onAdvanceToNextStage && <div className="flex justify-end">
          <Button onClick={onAdvanceToNextStage} className="px-8">
            الانتقال لمرحلة الدفع
          </Button>
        </div>}
    </div>;
  const [paymentStatus, setPaymentStatus] = React.useState({
    hasInvoices: false,
    hasPayments: false,
    isFullyPaid: false,
    totalOutstanding: 0,
    invoices: [] as any[]
  });
  React.useEffect(() => {
    checkPaymentStatus();
  }, [contract?.id]);
  const checkPaymentStatus = async () => {
    if (!contract?.id) return;
    try {
      const {
        data: invoices
      } = await supabase.from('invoices').select(`
          *,
          payments(*)
        `).eq('contract_id', contract.id);
      const hasInvoices = invoices && invoices.length > 0;
      const hasPayments = invoices?.some(inv => inv.payments && inv.payments.length > 0);
      const totalOutstanding = invoices?.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0) || 0;
      const isFullyPaid = hasInvoices && totalOutstanding <= 0;
      setPaymentStatus({
        hasInvoices,
        hasPayments,
        isFullyPaid,
        totalOutstanding,
        invoices: invoices || []
      });
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };
  const handlePrintReceipt = async (invoice: any) => {
    try {
      // Check if invoice has payments
      if (!invoice.payments || invoice.payments.length === 0) {
        toast({
          title: "خطأ",
          description: "لا توجد مدفوعات مسجلة لهذه الفاتورة",
          variant: "destructive"
        });
        return;
      }

      // Use the most recent payment for the receipt
      const latestPayment = invoice.payments.sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())[0];

      // Get company branding info
      const { data: companyBranding } = await supabase.from('company_branding').select('*').eq('is_active', true).single();

      // Format payment method text
      const paymentMethodText = {
        cash: 'نقداً',
        card: 'بطاقة ائتمان',
        bank_transfer: 'حوالة بنكية',
        check: 'شيك',
        online: 'دفع إلكتروني'
      }[latestPayment.payment_method] || latestPayment.payment_method;

      // Create HTML content for printing
      const receiptHTML = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>إيصال دفع - ${invoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              direction: rtl; 
              font-size: 14px; 
              line-height: 1.6; 
              color: #000;
              padding: 20px;
            }
            .receipt-container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: white; 
              border: 2px solid #000;
              padding: 30px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px; 
            }
            .receipt-title { 
              font-size: 20px; 
              font-weight: bold; 
              margin: 20px 0; 
              text-align: center;
              background: #f0f0f0;
              padding: 10px;
            }
            .info-section { 
              margin-bottom: 20px; 
            }
            .info-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 8px 0; 
              border-bottom: 1px dotted #ccc; 
            }
            .info-label { 
              font-weight: bold; 
              width: 40%; 
            }
            .info-value { 
              width: 60%; 
              text-align: left; 
            }
            .amount-section { 
              background: #f9f9f9; 
              border: 2px solid #000; 
              padding: 20px; 
              text-align: center; 
              margin: 20px 0; 
            }
            .amount-label { 
              font-size: 16px; 
              margin-bottom: 10px; 
            }
            .amount-value { 
              font-size: 28px; 
              font-weight: bold; 
            }
            .footer { 
              margin-top: 40px; 
              text-align: center; 
              border-top: 2px solid #000; 
              padding-top: 20px; 
            }
            @media print {
              body { padding: 0; }
              .receipt-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="company-name">${companyBranding?.company_name_ar || 'شركة ساپتكو الخليج لتأجير السيارات'}</div>
              <div>${companyBranding?.address_ar || 'دولة الكويت'}</div>
              <div>هاتف: ${companyBranding?.phone || '+965 XXXX XXXX'}</div>
            </div>
            
            <div class="receipt-title">إيصال استلام دفعة</div>
            
            <div class="info-section">
              <div class="info-row">
                <span class="info-label">رقم الإيصال:</span>
                <span class="info-value">REC-${invoice.invoice_number}-${Date.now()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">اسم العميل:</span>
                <span class="info-value">${contract.customers?.name || 'غير محدد'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">رقم الهاتف:</span>
                <span class="info-value">${contract.customers?.phone || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">رقم العقد:</span>
                <span class="info-value">${contract.contract_number}</span>
              </div>
              <div class="info-row">
                <span class="info-label">المركبة:</span>
                <span class="info-value">${contract.vehicles?.make} ${contract.vehicles?.model} - ${contract.vehicles?.license_plate}</span>
              </div>
              <div class="info-row">
                <span class="info-label">رقم الفاتورة:</span>
                <span class="info-value">${invoice.invoice_number}</span>
              </div>
              <div class="info-row">
                <span class="info-label">تاريخ الدفع:</span>
                <span class="info-value">${new Date(latestPayment.payment_date).toLocaleDateString('ar')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">طريقة الدفع:</span>
                <span class="info-value">${paymentMethodText}</span>
              </div>
              ${latestPayment.reference_number ? `
              <div class="info-row">
                <span class="info-label">رقم المرجع:</span>
                <span class="info-value">${latestPayment.reference_number}</span>
              </div>
              ` : ''}
            </div>
            
            <div class="amount-section">
              <div class="amount-label">المبلغ المستلم</div>
              <div class="amount-value">${latestPayment.amount.toLocaleString()} د.ك</div>
            </div>
            
            <div class="info-section">
              <div class="info-row">
                <span class="info-label">إجمالي الفاتورة:</span>
                <span class="info-value">${invoice.total_amount.toLocaleString()} د.ك</span>
              </div>
              <div class="info-row">
                <span class="info-label">المبلغ المتبقي:</span>
                <span class="info-value">${invoice.outstanding_amount.toLocaleString()} د.ك</span>
              </div>
              <div class="info-row">
                <span class="info-label">حالة الدفع:</span>
                <span class="info-value">${invoice.outstanding_amount > 0 ? 'دفع جزئي' : 'مدفوع بالكامل'}</span>
              </div>
            </div>
            
            <div class="footer">
              <div style="margin-bottom: 10px;">شكراً لثقتكم بخدماتنا</div>
              <div style="font-size: 12px;">تاريخ الطباعة: ${new Date().toLocaleDateString('ar')} - ${new Date().toLocaleTimeString('ar')}</div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        
        toast({
          title: "تم فتح نافذة الطباعة",
          description: "يمكنك الآن طباعة الإيصال"
        });
      } else {
        toast({
          title: "خطأ في فتح نافذة الطباعة",
          description: "يرجى السماح بفتح النوافذ المنبثقة",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast({
        title: "خطأ في طباعة الإيصال",
        description: "حدث خطأ أثناء طباعة الإيصال",
        variant: "destructive"
      });
    }
  };
  const renderPaymentStage = () => <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <CreditCard className="w-5 h-5" />
            حالة المدفوعات والفواتير
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentStatus.isFullyPaid ? <div className="bg-green-100 p-4 rounded-lg border border-green-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">تم إنهاء جميع المدفوعات بنجاح</h3>
              </div>
              <p className="text-green-800 text-sm">
                تم إصدار {paymentStatus.invoices.length} فاتورة وتسديدها بالكامل
              </p>
            </div> : <div className="space-y-4">
              <div className="text-center">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">إدارة الفواتير والمدفوعات</h3>
                <p className="text-muted-foreground mb-4">
                  المبلغ الإجمالي: {formatCurrency(contract.final_amount)}
                </p>
                {paymentStatus.totalOutstanding > 0 && <p className="text-red-600 font-medium mb-4">
                    المبلغ المستحق: {formatCurrency(paymentStatus.totalOutstanding)}
                  </p>}
                <div className="flex gap-2 justify-center">
                  <Button onClick={onShowPayment} className="px-6">
                    إدارة الفواتير والمدفوعات
                  </Button>
                </div>
              </div>
            </div>}

          {paymentStatus.invoices.length > 0 && <div className="space-y-3">
              <h4 className="font-medium text-right">الفواتير المصدرة:</h4>
              {paymentStatus.invoices.map((invoice: any) => <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    {/* Print Receipt Button - Only show for invoices with payments */}
                    {invoice.payments && invoice.payments.length > 0 && <Button size="sm" variant="outline" onClick={() => handlePrintReceipt(invoice)} className="flex items-center gap-1 text-xs text-zinc-50 bg-green-500 hover:bg-green-400">
                        <Receipt className="w-3 h-3" />
                        طباعة إيصال
                      </Button>}
                    <Badge variant={invoice.outstanding_amount <= 0 ? "default" : "secondary"}>
                      {invoice.outstanding_amount <= 0 ? "مدفوعة" : "جزئية"}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">فاتورة رقم: {invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(invoice.total_amount)} - متبقي: {formatCurrency(invoice.outstanding_amount)}
                    </p>
                  </div>
                </div>)}
            </div>}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-right">
              <span className="text-muted-foreground">المبلغ الأساسي:</span>
              <p className="font-medium">{formatCurrency(contract.total_amount)}</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">الضريبة:</span>
              <p className="font-medium">{formatCurrency(contract.tax_amount || 0)}</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">الخصم:</span>
              <p className="font-medium">{formatCurrency(contract.discount_amount || 0)}</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">المبلغ النهائي:</span>
              <p className="font-medium text-lg">{formatCurrency(contract.final_amount)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <h3 className="font-medium text-purple-900 mb-2 text-right">المهام المطلوبة:</h3>
        <ul className="list-disc list-inside text-purple-800 space-y-1 text-right">
          <li>إصدار الفواتير للعقد</li>
          <li>تسجيل الدفعات المستلمة</li>
          <li>متابعة المتأخرات والمبالغ المستحقة</li>
          <li>تأكيد اكتمال جميع المدفوعات</li>
        </ul>
      </div>

      {/* Advance to Next Stage Button - Show when payment is fully completed */}
      {paymentStatus.isFullyPaid && contract.status === 'active' && !contract.actual_end_date && onAdvanceToNextStage && <div className="flex justify-end">
          <Button onClick={onAdvanceToNextStage} className="px-8">
            الانتقال لمرحلة الاستلام
          </Button>
        </div>}
    </div>;
  const renderReturnStage = () => <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <CheckCircle className="w-5 h-5" />
            حالة الاستلام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contract.actual_end_date ? <div className="bg-green-100 p-4 rounded-lg border border-green-300">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-medium text-green-900">تم استلام المركبة بنجاح</h3>
              </div>
              <p className="text-green-800 text-sm">
                تاريخ الاستلام: {formatDate(contract.actual_end_date)}
              </p>
            </div> : <div className="space-y-4">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">جاهز للاستلام</h3>
                <p className="text-muted-foreground mb-4">المركبة جاهزة للاستلام من العميل</p>
                <Button onClick={onShowReturn} className="px-8">
                  بدء عملية الاستلام
                </Button>
              </div>
            </div>}

          {contract.return_photos && contract.return_photos.length > 0 && <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">صور الاستلام</span>
              </div>
              <p className="text-sm text-muted-foreground">
                تم رفع {contract.return_photos.length} صورة
              </p>
            </div>}
        </CardContent>
      </Card>

      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h3 className="font-medium text-red-900 mb-2 text-right">المهام المطلوبة:</h3>
        <ul className="list-disc list-inside text-red-800 space-y-1 text-right">
          <li>فحص حالة المركبة عند الاستلام</li>
          <li>توثيق أي أضرار أو مشاكل</li>
          <li>تسجيل قراءة العداد النهائية</li>
          <li>التأكد من إرجاع جميع الملحقات</li>
        </ul>
      </div>

      {/* Advance to Next Stage Button - Show when vehicle is returned */}
      {contract.actual_end_date && contract.status !== 'completed' && onAdvanceToNextStage && <div className="flex justify-end">
          <Button onClick={onAdvanceToNextStage} className="px-8">
            إنهاء العقد
          </Button>
        </div>}
    </div>;
  const renderCompletedStage = () => <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <CheckCircle className="w-5 h-5" />
            العقد مكتمل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-100 p-4 rounded-lg border border-green-300">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-medium text-green-900">تم إنهاء العقد بنجاح</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-right">
                <span className="text-sm text-green-700 font-medium">تاريخ البدء:</span>
                <p className="text-green-800">{formatDate(contract.actual_start_date || contract.start_date)}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-green-700 font-medium">تاريخ الانتهاء:</span>
                <p className="text-green-800">{formatDate(contract.actual_end_date)}</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-green-700 font-medium">مدة الإيجار:</span>
                <p className="text-green-800">{contract.rental_days} يوم</p>
              </div>
              <div className="text-right">
                <span className="text-sm text-green-700 font-medium">المبلغ النهائي:</span>
                <p className="text-green-800 font-semibold">{formatCurrency(contract.final_amount)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-900 text-right mb-2">المراحل المكتملة</h4>
                <ul className="list-disc list-inside text-blue-800 space-y-1 text-right text-sm">
                  <li>إنشاء العقد وتوقيعه</li>
                  <li>تسليم المركبة للعميل</li>
                  <li>تسجيل المدفوعات</li>
                  <li>استلام المركبة من العميل</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <h4 className="font-medium text-purple-900 text-right mb-2">معلومات إضافية</h4>
                <div className="space-y-2 text-sm">
                  {contract.pickup_photos && contract.pickup_photos.length > 0 && <div className="flex items-center justify-between">
                      <span className="text-purple-800">{contract.pickup_photos.length}</span>
                      <span className="text-purple-700">صور التسليم</span>
                    </div>}
                  {contract.return_photos && contract.return_photos.length > 0 && <div className="flex items-center justify-between">
                      <span className="text-purple-800">{contract.return_photos.length}</span>
                      <span className="text-purple-700">صور الاستلام</span>
                    </div>}
                  {contract.pickup_mileage && <div className="flex items-center justify-between">
                      <span className="text-purple-800">{contract.pickup_mileage.toLocaleString()} كم</span>
                      <span className="text-purple-700">العداد عند التسليم</span>
                    </div>}
                  {contract.return_mileage && <div className="flex items-center justify-between">
                      <span className="text-purple-800">{contract.return_mileage.toLocaleString()} كم</span>
                      <span className="text-purple-700">العداد عند الاستلام</span>
                    </div>}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>;
  const renderStageContent = () => {
    switch (stage) {
      case 'draft':
        return renderDraftStage();
      case 'pending':
        return renderPendingStage();
      case 'delivery':
        return renderDeliveryStage();
      case 'payment':
        return renderPaymentStage();
      case 'return':
        return renderReturnStage();
      case 'completed':
        return renderCompletedStage();
      default:
        return renderDraftStage();
    }
  };
  return <div className="space-y-6">
      {renderStageContent()}
    </div>;
};