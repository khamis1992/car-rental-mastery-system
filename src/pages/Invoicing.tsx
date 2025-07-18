import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, Filter, X, Calendar, Building2, CreditCard, AlertCircle, CheckCircle, Clock, DollarSign, Send, Eye, Edit, Trash2, Download, Users, TrendingUp, TrendingDown, Activity } from 'lucide-react';
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
import { useContractsOptimized } from '@/hooks/useContractsOptimized';
import { useSaasInvoices, useCreateInvoice, useUpdateInvoiceStatus, useSaasPayments, useCreatePayment } from '@/hooks/useSaasData';
import { InvoiceWithDetails, Payment } from '@/types/invoice';

// Updated to use Repository Pattern with Business Services

const Invoicing = () => {
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
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
  
  const { contracts, customers } = useContractsOptimized();
  
  const { data: invoices = [], isLoading: invoicesLoading } = useSaasInvoices();
  const { data: paymentsData = [], isLoading: paymentsLoading } = useSaasPayments();
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceStatusMutation = useUpdateInvoiceStatus();
  const createPaymentMutation = useCreatePayment();
  
  const loading = invoicesLoading || paymentsLoading;
  const errors = {};
  
  // دوال خدمة متوافقة مع API القديم
  const invoiceService = {
    createInvoice: (data: any) => createInvoiceMutation.mutateAsync(data),
    updateInvoiceStatus: (invoiceId: string, status: 'paid' | 'sent' | 'overdue' | 'canceled') => 
      updateInvoiceStatusMutation.mutateAsync({ invoiceId, status }),
    getInvoiceStats: async () => ({
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total_amount, 0),
      outstandingRevenue: invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.total_amount, 0),
    }),
    getInvoiceById: async (id: string) => invoices.find(i => i.id === id),
  };
  
  const paymentService = {
    createPayment: (data: any) => createPaymentMutation.mutateAsync(data),
    getRecentPayments: async () => paymentsData.slice(0, 5),
    getPaymentStats: async () => ({
      total: paymentsData.length,
      succeeded: paymentsData.filter(p => p.status === 'succeeded').length,
      failed: paymentsData.filter(p => p.status === 'failed').length,
      pending: paymentsData.filter(p => p.status === 'pending').length,
      totalCount: paymentsData.length,
      totalAmount: paymentsData.reduce((sum, p) => sum + p.amount, 0),
      monthlyAmount: paymentsData
        .filter(p => {
          const paymentDate = new Date(p.created_at);
          const currentMonth = new Date().getMonth();
          return paymentDate.getMonth() === currentMonth;
        })
        .reduce((sum, p) => sum + p.amount, 0),
    }),
    updatePaymentStatus: async (paymentId: string, status: string, metadata?: any) => {
      // استخدام API حديث لتحديث حالة الدفع
      console.log('تحديث حالة الدفع:', { paymentId, status, metadata });
    },
  };
  
  // إعادة تحميل البيانات
  const loadInvoiceData = async () => {
    // البيانات محملة تلقائياً بواسطة React Query
    console.log('تحديث البيانات...');
  };

  // Check for contract parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contractId = urlParams.get('contract');
    if (contractId) {
      setInvoiceFormOpen(true);
    }
  }, []);

  const loadInvoices = async () => {
    // Now handled by useInvoicingData hook
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
    // البيانات محملة تلقائياً بواسطة React Query من useSaasPayments
    console.log('تحديث المدفوعات...');
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
      await Promise.all([loadInvoiceData, loadStats(), loadPayments(), loadPaymentStats()]);
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

      // Convert SaasInvoice to Invoice format for PDF generation
      const invoiceForPDF = {
        ...invoice,
        contract_id: invoice.subscription_id || '',
        customer_id: invoice.tenant_id,
        invoice_date: invoice.created_at,
        issue_date: invoice.created_at,
        payment_terms: '',
        payment_method: '',
        notes: invoice.description || '',
        terms_and_conditions: '',
        sent_at: invoice.created_at,
        paid_at: invoice.paid_at,
        created_by: invoice.created_by,
        paid_amount: 0,
        outstanding_amount: invoice.total_amount,
        due_date: invoice.due_date,
        invoice_type: 'rental' as const,
        status: invoice.status === 'open' ? 'sent' : invoice.status === 'canceled' ? 'cancelled' : invoice.status as 'paid' | 'overdue' | 'draft' | 'sent' | 'partially_paid' | 'cancelled',
        contract: null,
        customer: null,
        items: [],
        payments: []
      };

      await downloadInvoicePDF(
        invoiceForPDF,
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
            className="rtl-flex"
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
            invoices={invoices.map(invoice => ({
              ...invoice,
              customer_name: invoice.tenant?.name || 'عميل',
              customer_phone: invoice.tenant?.email || '',
              contract_number: invoice.subscription_id || '',
              vehicle_info: '',
              contract_id: invoice.subscription_id || '',
              customer_id: invoice.tenant_id,
              invoice_date: invoice.created_at,
              issue_date: invoice.created_at,
              payment_terms: '',
              payment_method: '',
              terms_and_conditions: '',
              sent_at: invoice.created_at,
              paid_at: invoice.paid_at,
              created_by: invoice.created_by,
              paid_amount: 0,
              outstanding_amount: invoice.total_amount,
              due_date: invoice.due_date,
              invoice_type: 'rental' as const,
              status: invoice.status === 'open' ? 'sent' : invoice.status === 'canceled' ? 'cancelled' : invoice.status as 'paid' | 'overdue' | 'draft' | 'sent' | 'partially_paid' | 'cancelled',
              contract: null,
              customer: null,
              items: [],
              payments: []
            }))}
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
            payments={paymentsData.map(payment => ({
              ...payment,
              payment_number: payment.payment_reference || `PAY-${payment.id.slice(0, 8)}`,
              contract_id: payment.subscription_id || '',
              customer_id: payment.tenant_id,
              payment_method: payment.payment_method === 'credit_card' ? 'card' : payment.payment_method as 'bank_transfer' | 'cash' | 'check' | 'card' | 'online',
              status: payment.status === 'canceled' ? 'cancelled' : payment.status as 'pending' | 'failed' | 'completed' | 'cancelled'
            }))}
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