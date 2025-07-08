import React, { useState } from 'react';
import { TrendingUp, DollarSign, FileText, Calendar, CreditCard, Receipt, RefreshCw } from 'lucide-react';
import { ChartOfAccountsTab } from '@/components/Accounting/ChartOfAccountsTab';
import { JournalEntriesTab } from '@/components/Accounting/JournalEntriesTab';
import { FinancialReportsTab } from '@/components/Accounting/FinancialReportsTab';
import { AccountingBackfillTab } from '@/components/Accounting/AccountingBackfillTab';
import { PaymentReconciliationTab } from '@/components/Accounting/PaymentReconciliationTab';
import { SystemIntegrityTab } from '@/components/Accounting/SystemIntegrityTab';
import { AccountingEventMonitoringDashboard } from '@/components/Accounting/AccountingEventMonitoringDashboard';
import { AccountingDataRefresh } from '@/components/Accounting/AccountingDataRefresh';
import { AccountingMaintenanceTools } from '@/components/Accounting/AccountingMaintenanceTools';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrencyKWD } from '@/lib/currency';
import { useAccountingData } from '@/hooks/useAccountingData';
import { PaymentsList } from '@/components/Invoicing/PaymentsList';
import { downloadPaymentReceiptPDF } from '@/lib/paymentReceiptPDFService';
import { PaymentReceipt } from '@/types/payment-receipt';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Accounting = () => {
  const { financialStats, recentTransactions, loading, error, refetch } = useAccountingData();
  const { toast } = useToast();
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);

  const displayStats = [
    {
      title: "الإيرادات الشهرية",
      value: formatCurrencyKWD(financialStats.monthlyRevenue),
      change: "0%",
      icon: <TrendingUp className="w-6 h-6 text-green-500" />,
      trend: "up"
    },
    {
      title: "المدفوعات المعلقة", 
      value: formatCurrencyKWD(financialStats.pendingPayments),
      change: "0%",
      icon: <CreditCard className="w-6 h-6 text-orange-500" />,
      trend: "down"
    },
    {
      title: "إجمالي المصروفات",
      value: formatCurrencyKWD(financialStats.totalExpenses),
      change: "0%",
      icon: <Receipt className="w-6 h-6 text-red-500" />,
      trend: "up"
    },
    {
      title: "صافي الربح",
      value: formatCurrencyKWD(financialStats.netProfit),
      change: "0%",
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
      trend: financialStats.netProfit >= 0 ? "up" : "down"
    }
  ];

  // جلب البيانات
  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          customers (name, phone),
          invoices (invoice_number, total_amount, outstanding_amount),
          contracts (contract_number, vehicles (make, model, license_plate))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات المدفوعات",
        variant: "destructive",
      });
    } finally {
      setPaymentsLoading(false);
    }
  };

  // معالجة طباعة الإيصال
  const handlePrintReceipt = async (paymentId: string) => {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .select(`
          *,
          customers (name, phone),
          invoices (invoice_number, total_amount, outstanding_amount),
          contracts (
            contract_number,
            vehicles (make, model, license_plate)
          )
        `)
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      if (!payment) return;

      const receipt: PaymentReceipt = {
        receipt_number: payment.payment_number,
        payment_date: payment.payment_date,
        customer_name: payment.customers?.name || 'غير محدد',
        customer_phone: payment.customers?.phone || undefined,
        contract_number: payment.contracts?.contract_number || 'غير محدد',
        vehicle_info: payment.contracts?.vehicles ? 
          `${payment.contracts.vehicles.make} ${payment.contracts.vehicles.model} - ${payment.contracts.vehicles.license_plate}` : 
          'غير محدد',
        payment_amount: payment.amount,
        payment_method: payment.payment_method,
        transaction_reference: payment.transaction_reference || undefined,
        bank_name: payment.bank_name || undefined,
        check_number: payment.check_number || undefined,
        invoice_number: payment.invoices?.invoice_number || 'غير محدد',
        total_invoice_amount: payment.invoices?.total_amount || 0,
        remaining_amount: payment.invoices?.outstanding_amount || 0,
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

  // معالجة عرض الدفعة
  const handleViewPayment = (paymentId: string) => {
    // يمكن إضافة نافذة لعرض تفاصيل الدفعة
    console.log('View payment:', paymentId);
  };

  // معالجة تغيير حالة الدفعة
  const handlePaymentStatusChange = async (paymentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم تحديث حالة الدفعة بنجاح",
      });

      // إعادة تحميل البيانات
      fetchPayments();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحديث حالة الدفعة",
        variant: "destructive",
      });
    }
  };

  // جلب البيانات عند تحميل المكون
  React.useEffect(() => {
    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="mr-2">جاري تحميل البيانات المحاسبية...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المحاسبة والتقارير</h1>
          <p className="text-muted-foreground">إدارة الشؤون المالية والتقارير المحاسبية</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث البيانات
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            تقرير شهري
          </Button>
          <Button className="btn-primary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            تصدير التقرير
          </Button>
        </div>
      </div>

      {/* الإحصائيات المالية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((stat, index) => (
          <Card key={index} className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-sm ${stat.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">من الشهر الماضي</span>
                  </div>
                </div>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="monitoring">المراقبة المباشرة</TabsTrigger>
          <TabsTrigger value="integrity">سلامة النظام</TabsTrigger>
          <TabsTrigger value="reconciliation">التسوية</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          <TabsTrigger value="reports">التقارير المالية</TabsTrigger>
          <TabsTrigger value="journal">القيود المحاسبية</TabsTrigger>
          <TabsTrigger value="accounts">دليل الحسابات</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات المالية</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <AccountingEventMonitoringDashboard />
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          <SystemIntegrityTab />
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <PaymentReconciliationTab />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <ChartOfAccountsTab />
        </TabsContent>

        <TabsContent value="journal" className="space-y-4">
          <JournalEntriesTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <AccountingDataRefresh />
          <AccountingMaintenanceTools />
          <AccountingBackfillTab />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="text-right">المعاملات الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.type === 'إيراد' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{transaction.id} • {transaction.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className={`font-bold ${
                           transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                         }`}>
                           {transaction.amount > 0 ? '+' : ''}{formatCurrencyKWD(Math.abs(transaction.amount))}
                         </p>
                        <Badge variant={transaction.status === 'مكتمل' ? 'default' : 'secondary'}>
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد معاملات مالية
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentsList 
            payments={payments}
            loading={paymentsLoading}
            onRefresh={fetchPayments}
            onView={handleViewPayment}
            onPrintReceipt={handlePrintReceipt}
            onStatusChange={handlePaymentStatusChange}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FinancialReportsTab />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            التحليلات المالية - سيتم عرض البيانات عند وجود معاملات مالية
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Accounting;