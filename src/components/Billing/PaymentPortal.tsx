import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  Receipt,
  CreditCard,
  FileText,
  CheckCircle
} from "lucide-react";
import { useSaasInvoices } from "@/hooks/useSaasData";
import { SaasInvoice } from "@/types/unified-saas";
import SaasPaymentForm from "./SaasPaymentForm";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface PaymentPortalProps {
  onBack?: () => void;
  selectedInvoiceId?: string;
}

const PaymentPortal: React.FC<PaymentPortalProps> = ({
  onBack,
  selectedInvoiceId
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<SaasInvoice | null>(null);
  const [currentStep, setCurrentStep] = useState<'invoice' | 'payment' | 'success'>('invoice');
  
  const { data: invoices = [], isLoading } = useSaasInvoices();

  // تصفية الفواتير غير المدفوعة
  const unpaidInvoices = invoices.filter(invoice => 
    ['open', 'sent', 'overdue'].includes(invoice.status)
  );

  React.useEffect(() => {
    if (selectedInvoiceId) {
      const invoice = invoices.find(inv => inv.id === selectedInvoiceId);
      if (invoice) {
        setSelectedInvoice(invoice);
        setCurrentStep('payment');
      }
    }
  }, [selectedInvoiceId, invoices]);

  const getStatusBadge = (status: string) => {
    const config = {
      open: { label: "مفتوحة", variant: "secondary" as const },
      sent: { label: "مرسلة", variant: "outline" as const },
      overdue: { label: "متأخرة", variant: "destructive" as const },
      paid: { label: "مدفوعة", variant: "default" as const },
    };
    
    const statusInfo = config[status as keyof typeof config] || config.open;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleInvoiceSelect = (invoice: SaasInvoice) => {
    setSelectedInvoice(invoice);
    setCurrentStep('payment');
  };

  const handlePaymentSuccess = () => {
    setCurrentStep('success');
  };

  const handleBackToInvoices = () => {
    setSelectedInvoice(null);
    setCurrentStep('invoice');
  };

  const handleStartOver = () => {
    setSelectedInvoice(null);
    setCurrentStep('invoice');
  };

  if (currentStep === 'success') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-700 mb-4">
              تم إنشاء فاتورة الدفع بنجاح!
            </h2>
            <p className="text-muted-foreground mb-6">
              تم إنشاء فاتورة SADAD وستتمكن من الدفع عبر البنوك الكويتية
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button onClick={handleStartOver}>
                دفع فاتورة أخرى
              </Button>
              
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  العودة للوحة التحكم
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep === 'payment' && selectedInvoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={handleBackToInvoices}
            className="rtl-flex"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للفواتير
          </Button>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold">دفع الفاتورة</h1>
            <p className="text-muted-foreground">
              اختر طريقة الدفع المناسبة لك
            </p>
          </div>
        </div>

        <SaasPaymentForm
          invoice={selectedInvoice}
          onSuccess={handlePaymentSuccess}
          onCancel={handleBackToInvoices}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="rtl-flex"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
        )}
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold">بوابة المدفوعات</h1>
          <p className="text-muted-foreground">
            اختر الفاتورة التي تريد دفعها
          </p>
        </div>
      </div>

      {/* فلتر الفواتير */}
      <Tabs defaultValue="unpaid" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unpaid" className="rtl-flex">
            <Receipt className="w-4 h-4" />
            الفواتير غير المدفوعة ({unpaidInvoices.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="rtl-flex">
            <FileText className="w-4 h-4" />
            جميع الفواتير ({invoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unpaid" className="space-y-4">
          {unpaidInvoices.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Receipt className="mx-auto mb-4 w-12 h-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">لا توجد فواتير غير مدفوعة</h3>
                <p className="text-muted-foreground">
                  جميع فواتيرك محدثة ومدفوعة
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {unpaidInvoices.map((invoice) => (
                <Card 
                  key={invoice.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleInvoiceSelect(invoice)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            فاتورة رقم: {invoice.invoice_number}
                          </h3>
                          {getStatusBadge(invoice.status)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>المؤسسة: {invoice.tenant?.name}</div>
                          <div>فترة الفوترة: {format(new Date(invoice.billing_period_start), 'dd MMM', { locale: ar })} - {format(new Date(invoice.billing_period_end), 'dd MMM yyyy', { locale: ar })}</div>
                          {invoice.due_date && (
                            <div>تاريخ الاستحقاق: {format(new Date(invoice.due_date), 'dd MMM yyyy', { locale: ar })}</div>
                          )}
                        </div>
                      </div>

                      <div className="text-left space-y-2">
                        <div className="text-2xl font-bold text-green-600">
                          {invoice.total_amount} {invoice.currency}
                        </div>
                        
                        <Button className="w-full rtl-flex">
                          <CreditCard className="w-4 h-4" />
                          ادفع الآن
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {invoices.map((invoice) => (
              <Card 
                key={invoice.id}
                className={`${['open', 'sent', 'overdue'].includes(invoice.status) ? 'cursor-pointer hover:shadow-md transition-shadow' : 'opacity-75'}`}
                onClick={() => {
                  if (['open', 'sent', 'overdue'].includes(invoice.status)) {
                    handleInvoiceSelect(invoice);
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">
                          فاتورة رقم: {invoice.invoice_number}
                        </h3>
                        {getStatusBadge(invoice.status)}
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>المؤسسة: {invoice.tenant?.name}</div>
                        <div>تاريخ الإصدار: {format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: ar })}</div>
                        {invoice.paid_at && (
                          <div>تاريخ الدفع: {format(new Date(invoice.paid_at), 'dd MMM yyyy', { locale: ar })}</div>
                        )}
                      </div>
                    </div>

                    <div className="text-left space-y-2">
                      <div className="text-2xl font-bold">
                        {invoice.total_amount} {invoice.currency}
                      </div>
                      
                      {['open', 'sent', 'overdue'].includes(invoice.status) ? (
                        <Button className="w-full rtl-flex">
                          <CreditCard className="w-4 h-4" />
                          ادفع الآن
                        </Button>
                      ) : (
                        <Badge variant="default" className="w-full justify-center">
                          مدفوعة
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentPortal;