import React, { useState, useEffect } from 'react';
import { Plus, FileText, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvoiceForm } from '@/components/Invoicing/InvoiceForm';
import { InvoicesList } from '@/components/Invoicing/InvoicesList';
import { PaymentForm } from '@/components/Invoicing/PaymentForm';
import { PaymentsList } from '@/components/Invoicing/PaymentsList';
import { useToast } from '@/hooks/use-toast';
import { downloadInvoicePDF } from '@/lib/invoice/invoicePDFService';
import { useContractsDataRefactored } from '@/hooks/useContractsDataRefactored';
import { useInvoicingDataRefactored } from '@/hooks/useInvoicingDataRefactored';
import { InvoiceWithDetails, Payment } from '@/types/invoice';

// NOTE: This page now uses the Repository Pattern via useInvoicingDataRefactored and useContractsDataRefactored

const Invoicing = () => {
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoiceStats, setInvoiceStats] = useState({
    total: 0,
    paid: 0,
    overdue: 0,
    totalRevenue: 0,
    outstandingRevenue: 0,
  });
  const [paymentStats, setPaymentStats] = useState({
    totalCount: 0,
    totalAmount: 0,
    monthlyAmount: 0,
  });
  const { toast } = useToast();
  
  // Use the new Repository Pattern hooks
  const { contracts, customers } = useContractsDataRefactored();
  const { 
    invoices, 
    loading, 
    loadData: loadInvoiceData, 
    invoiceService, 
    paymentService 
  } = useInvoicingDataRefactored();

  // Check for contract parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contractId = urlParams.get('contract');
    if (contractId) {
      setInvoiceFormOpen(true);
    }
  }, []);

  const loadInvoices = async () => {
    // Now handled by useInvoicingDataRefactored hook
    return;
  };

  const loadStats = async () => {
    try {
      const stats = await invoiceService.getInvoiceStats();
      setInvoiceStats(stats);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل الإحصائيات',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadPayments = async () => {
    try {
      const data = await paymentService.getRecentPayments(50);
      setPayments(data as Payment[]);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل المدفوعات',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadPaymentStats = async () => {
    try {
      const stats = await paymentService.getPaymentStats();
      setPaymentStats(stats);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل إحصائيات المدفوعات',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const loadData = async () => {
    try {
      await Promise.all([loadInvoiceData(), loadStats(), loadPayments(), loadPaymentStats()]);
    } catch (error) {
      // Error handling is done in individual functions
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFormSuccess = () => {
    loadData();
  };

  const handleViewInvoice = (id: string) => {
    // TODO: Implement invoice details dialog
    console.log('View invoice:', id);
  };

  const handleEditInvoice = (id: string) => {
    // TODO: Implement invoice editing
    console.log('Edit invoice:', id);
  };

  const handleSendInvoice = async (id: string) => {
    try {
      await invoiceService.updateInvoiceStatus(id, 'sent');
      toast({
        title: 'تم بنجاح',
        description: 'تم إرسال الفاتورة بنجاح',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء إرسال الفاتورة',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadInvoice = async (id: string) => {
    try {
      const invoice = await invoiceService.getInvoiceById(id);
      if (!invoice) return;

      toast({
        title: "جاري إنشاء PDF...",
        description: "يرجى الانتظار أثناء إنشاء ملف PDF",
      });

      await downloadInvoicePDF(
        invoice,
        `invoice_${invoice.invoice_number}.pdf`,
        { includeTerms: true, includeNotes: true },
        (step, progress) => {
          toast({
            title: "جاري المعالجة",
            description: `${step} - ${progress}%`,
          });
        }
      );
      
      toast({
        title: "تم بنجاح",
        description: "تم تحميل ملف PDF بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تحميل الفاتورة",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await invoiceService.updateInvoiceStatus(id, status as any);
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث حالة الفاتورة بنجاح',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تحديث الفاتورة',
        variant: 'destructive',
      });
    }
  };

  const handleAddPayment = (invoice: any) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentFormOpen(true);
  };

  const handleViewPayment = (id: string) => {
    // TODO: Implement payment details dialog
    console.log('View payment:', id);
  };

  const handlePrintReceipt = (id: string) => {
    // TODO: Implement receipt printing
    console.log('Print receipt:', id);
  };

  const handlePaymentStatusChange = async (id: string, status: string) => {
    try {
      await paymentService.updatePaymentStatus(id, status as any);
      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث حالة الدفعة بنجاح',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء تحديث الدفعة',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">إدارة الفواتير</h1>
          <p className="text-muted-foreground">إنشاء وإدارة الفواتير والمدفوعات</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            className="btn-primary flex items-center gap-2"
            onClick={() => setInvoiceFormOpen(true)}
          >
            <Plus className="w-4 h-4" />
            فاتورة جديدة
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الفواتير</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير المدفوعة</CardTitle>
            <Badge variant="default" className="text-xs">مدفوع</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{invoiceStats.paid}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الفواتير المتأخرة</CardTitle>
            <Badge variant="destructive" className="text-xs">متأخر</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{invoiceStats.overdue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المدفوعات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{paymentStats.totalCount}</div>
            <p className="text-xs text-muted-foreground">{formatCurrency(paymentStats.totalAmount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إيرادات الشهر</CardTitle>
            <span className="text-xs text-muted-foreground">د.ك</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">
              {formatCurrency(paymentStats.monthlyAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المبالغ المستحقة</CardTitle>
            <span className="text-xs text-muted-foreground">د.ك</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">
              {formatCurrency(invoiceStats.outstandingRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <InvoicesList
            invoices={invoices}
            loading={loading}
            onRefresh={loadData}
            onView={handleViewInvoice}
            onEdit={handleEditInvoice}
            onSend={handleSendInvoice}
            onDownload={handleDownloadInvoice}
            onStatusChange={handleStatusChange}
            onAddPayment={handleAddPayment}
          />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsList
            payments={payments}
            loading={loading}
            onRefresh={loadData}
            onView={handleViewPayment}
            onPrintReceipt={handlePrintReceipt}
            onStatusChange={handlePaymentStatusChange}
          />
        </TabsContent>
      </Tabs>

      {/* Invoice Form */}
      <InvoiceForm
        open={invoiceFormOpen}
        onOpenChange={setInvoiceFormOpen}
        onSuccess={handleFormSuccess}
        contracts={contracts}
        customers={customers}
        preselectedContractId={new URLSearchParams(window.location.search).get('contract') || undefined}
      />
      {/* Payment Form */}
      <PaymentForm
        open={paymentFormOpen}
        onOpenChange={setPaymentFormOpen}
        onSuccess={handleFormSuccess}
        invoice={selectedInvoiceForPayment}
      />
    </div>
  );
};

export default Invoicing;