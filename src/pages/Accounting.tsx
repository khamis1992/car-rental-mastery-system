import React from 'react';
import { TrendingUp, DollarSign, FileText, Calendar, CreditCard, Receipt, RefreshCw, Printer, Eye } from 'lucide-react';
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrencyKWD } from '@/lib/currency';
import { useAccountingData } from '@/hooks/useAccountingData';
import { downloadPaymentReceiptPDF } from '@/lib/paymentReceiptPDFService';
import { PaymentReceipt } from '@/types/payment-receipt';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Accounting = () => {
  const { financialStats, recentTransactions, loading, error, refetch } = useAccountingData();
  const [payments, setPayments] = React.useState<any[]>([]);
  const [paymentLoading, setPaymentLoading] = React.useState(false);

  // جلب المدفوعات
  const fetchPayments = async () => {
    try {
      setPaymentLoading(true);
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoices (
            invoice_number,
            total_amount,
            contracts (
              contract_number,
              customers (name, phone),
              vehicles (make, model, license_plate)
            )
          )
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPayments();
  }, []);

  const handlePrintPaymentReceipt = async (payment: any) => {
    try {
      const invoice = payment.invoices;
      const contract = invoice?.contracts;
      
      if (!invoice || !contract) {
        alert('لا يمكن العثور على بيانات العقد أو الفاتورة');
        return;
      }

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
        remaining_amount: invoice.outstanding_amount || 0,
        notes: payment.notes || undefined,
        company_info: {
          name: 'شركة تأجير المركبات',
          address: 'الكويت',
          phone: '+965 1234 5678',
          email: 'info@rental.com'
        }
      };

      await downloadPaymentReceiptPDF(receipt);
      
    } catch (error) {
      console.error('Error printing payment receipt:', error);
      alert('فشل في طباعة إيصال الدفع');
    }
  };

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

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          <TabsTrigger value="monitoring">المراقبة المباشرة</TabsTrigger>
          <TabsTrigger value="integrity">سلامة النظام</TabsTrigger>
          <TabsTrigger value="reconciliation">التسوية</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          <TabsTrigger value="reports">التقارير المالية</TabsTrigger>
          <TabsTrigger value="journal">القيود المحاسبية</TabsTrigger>
          <TabsTrigger value="accounts">دليل الحسابات</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات المالية</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-right">سجل المدفوعات</CardTitle>
              <Button 
                variant="outline" 
                onClick={fetchPayments}
                disabled={paymentLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${paymentLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </CardHeader>
            <CardContent>
              {paymentLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin ml-2" />
                  <span>جاري تحميل المدفوعات...</span>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد مدفوعات مسجلة
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الدفعة</TableHead>
                        <TableHead>العميل</TableHead>
                        <TableHead>رقم العقد</TableHead>
                        <TableHead>رقم الفاتورة</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>طريقة الدفع</TableHead>
                        <TableHead>تاريخ الدفع</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">{payment.payment_number}</TableCell>
                          <TableCell>
                            {payment.invoices?.contracts?.customers?.name || 'غير محدد'}
                          </TableCell>
                          <TableCell>
                            {payment.invoices?.contracts?.contract_number || 'غير محدد'}
                          </TableCell>
                          <TableCell>
                            {payment.invoices?.invoice_number || 'غير محدد'}
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatCurrencyKWD(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {payment.payment_method === 'cash' ? 'نقد' : 
                               payment.payment_method === 'card' ? 'بطاقة' : 
                               payment.payment_method === 'bank_transfer' ? 'تحويل بنكي' :
                               payment.payment_method === 'check' ? 'شيك' :
                               payment.payment_method === 'online' ? 'دفع إلكتروني' :
                               payment.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePrintPaymentReceipt(payment)}
                                className="flex items-center gap-1"
                              >
                                <Printer className="w-4 h-4" />
                                طباعة الإيصال
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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