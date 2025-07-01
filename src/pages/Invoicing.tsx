import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvoiceForm } from '@/components/Invoicing/InvoiceForm';
import { InvoicesList } from '@/components/Invoicing/InvoicesList';
import { useToast } from '@/hooks/use-toast';
import { invoiceService } from '@/services/invoiceService';
import { contractService } from '@/services/contractService';
import { useContractsData } from '@/hooks/useContractsData';
import { InvoiceWithDetails } from '@/types/invoice';

const Invoicing = () => {
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([]);
  const [invoiceStats, setInvoiceStats] = useState({
    total: 0,
    paid: 0,
    overdue: 0,
    totalRevenue: 0,
    outstandingRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const { contracts, customers } = useContractsData();

  // Check for contract parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contractId = urlParams.get('contract');
    if (contractId) {
      setInvoiceFormOpen(true);
    }
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await invoiceService.getInvoicesWithDetails();
      setInvoices(data);
    } catch (error: any) {
      toast({
        title: 'خطأ في تحميل الفواتير',
        description: error.message,
        variant: 'destructive',
      });
    }
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

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadInvoices(), loadStats()]);
    } finally {
      setLoading(false);
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

  const handleDownloadInvoice = (id: string) => {
    // TODO: Implement PDF generation and download
    console.log('Download invoice:', id);
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

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} د.ك`;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <span className="text-xs text-muted-foreground">د.ك</span>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(invoiceStats.totalRevenue)}</div>
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

      {/* Invoices List */}
      <InvoicesList
        invoices={invoices}
        onView={handleViewInvoice}
        onEdit={handleEditInvoice}
        onSend={handleSendInvoice}
        onDownload={handleDownloadInvoice}
        onStatusChange={handleStatusChange}
      />

      {/* Invoice Form */}
      <InvoiceForm
        open={invoiceFormOpen}
        onOpenChange={setInvoiceFormOpen}
        onSuccess={handleFormSuccess}
        contracts={contracts}
        customers={customers}
        preselectedContractId={new URLSearchParams(window.location.search).get('contract') || undefined}
      />
    </div>
  );
};

export default Invoicing;