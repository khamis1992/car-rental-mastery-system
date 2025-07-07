import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, ArrowRight, Receipt, CreditCard, AlertTriangle, CheckCircle, Eye, Plus } from 'lucide-react';
import { ContractStageWrapper } from '@/components/Contracts/ContractStageWrapper';
import { InvoiceForm } from '@/components/Invoicing/InvoiceForm';
import { PaymentForm } from '@/components/Invoicing/PaymentForm';
import { InvoiceAndPaymentForm } from '@/components/Invoicing/InvoiceAndPaymentForm';
import { supabase } from '@/integrations/supabase/client';
import { serviceContainer } from '@/services/Container/ServiceContainer';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyKWD } from '@/lib/currency';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const PaymentStage = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contract, setContract] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [invoiceAndPaymentFormOpen, setInvoiceAndPaymentFormOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);

  const invoiceService = serviceContainer.getInvoiceBusinessService();
  const paymentService = serviceContainer.getPaymentBusinessService();

  useEffect(() => {
    if (contractId) {
      loadContractData();
    }
  }, [contractId]);

  const loadContractData = async () => {
    try {
      setLoading(true);
      
      // جلب بيانات العقد
      const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select(`
          *,
          customers(name, phone, email),
          vehicles(make, model, license_plate)
        `)
        .eq('id', contractId)
        .single();
        
      if (contractError) throw contractError;
      setContract(contractData);

      // جلب الفواتير
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          customers(name, phone),
          contracts(contract_number)
        `)
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
        
      if (invoicesError) throw invoicesError;
      setInvoices(invoicesData || []);

      // جلب المدفوعات
      const invoiceIds = invoicesData?.map(inv => inv.id) || [];
      if (invoiceIds.length > 0) {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            *,
            invoices(invoice_number, total_amount)
          `)
          .in('invoice_id', invoiceIds)
          .order('created_at', { ascending: false });
          
        if (paymentsError) throw paymentsError;
        setPayments(paymentsData || []);
      }

      // جلب العملاء
      const { data: customersData } = await supabase
        .from('customers')
        .select('*');
      setCustomers(customersData || []);
      
    } catch (error) {
      console.error('Error loading contract data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات العقد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!contract) return;
    
    try {
      await invoiceService.generateRentalInvoice(contract.id);
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الفاتورة بنجاح",
      });
      loadContractData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الفاتورة",
        variant: "destructive",
      });
    }
  };

  const handleAddPayment = (invoice: any) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentFormOpen(true);
  };

  const handleCreateInvoiceAndPayment = () => {
    setInvoiceAndPaymentFormOpen(true);
  };

  const handlePaymentSuccess = async () => {
    toast({
      title: "تم بنجاح",
      description: "تم تسجيل الدفعة بنجاح",
    });
    await loadContractData();
    
    // التحقق من اكتمال الدفع وتقدم إلى المرحلة التالية
    await checkAndAdvanceStage();
  };

  const checkAndAdvanceStage = async () => {
    try {
      // التحقق من حالة الدفع
      const { data: invoices } = await supabase
        .from('invoices')
        .select('outstanding_amount')
        .eq('contract_id', contractId);
      
      const totalOutstanding = invoices?.reduce((sum, inv) => sum + inv.outstanding_amount, 0) || 0;
      
      // إذا كان الدفع مكتملاً، قم بتحديث حالة العقد وتسجيل تاريخ الدفع
      if (totalOutstanding === 0 && invoices && invoices.length > 0) {
        await supabase
          .from('contracts')
          .update({ 
            payment_registered_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', contractId);

        toast({
          title: "تم إكمال الدفع",
          description: "تم تحصيل جميع المدفوعات بنجاح. الانتقال إلى مرحلة الاستلام...",
        });

        // التقدم إلى المرحلة التالية بعد تأخير قصير
        setTimeout(() => {
          navigate(`/contracts/stages/return/${contractId}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking payment completion:', error);
    }
  };

  const getStatusBadge = (status: string, type: 'invoice' | 'payment' = 'invoice') => {
    if (type === 'invoice') {
      const statusMap = {
        draft: { label: 'مسودة', variant: 'secondary' as const },
        sent: { label: 'مرسلة', variant: 'default' as const },
        paid: { label: 'مدفوعة', variant: 'default' as const },
        partially_paid: { label: 'مدفوعة جزئياً', variant: 'secondary' as const },
        overdue: { label: 'متأخرة', variant: 'destructive' as const },
      };
      const config = statusMap[status as keyof typeof statusMap] || statusMap.draft;
      return <Badge variant={config.variant}>{config.label}</Badge>;
    } else {
      const statusMap = {
        pending: { label: 'في الانتظار', variant: 'secondary' as const },
        completed: { label: 'مكتمل', variant: 'default' as const },
        failed: { label: 'فاشل', variant: 'destructive' as const },
      };
      const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
      return <Badge variant={config.variant}>{config.label}</Badge>;
    }
  };

  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstanding_amount, 0);
  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <ContractStageWrapper stageName="مرحلة الدفع" stageDescription="تسجيل المدفوعات">
        <div className="flex items-center justify-center h-64">
          <div>جاري التحميل...</div>
        </div>
      </ContractStageWrapper>
    );
  }

  if (!contract) {
    return (
      <ContractStageWrapper stageName="مرحلة الدفع" stageDescription="تسجيل المدفوعات">
        <div className="text-center py-8">
          <p className="text-destructive">لم يتم العثور على العقد</p>
          <Button onClick={() => navigate('/contracts')} className="mt-4">
            العودة للعقود
          </Button>
        </div>
      </ContractStageWrapper>
    );
  }

  return (
    <ContractStageWrapper stageName="مرحلة الدفع" stageDescription="تسجيل المدفوعات">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-3xl font-bold text-foreground">مرحلة الدفع</h1>
          <p className="text-muted-foreground">
            العقد رقم: {contract.contract_number} - {contract.customers?.name}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/contracts')}
          className="flex items-center gap-2"
        >
          العودة للعقود
        </Button>
      </div>

      {/* ملخص مالي */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
                <p className="text-2xl font-bold">{formatCurrencyKWD(totalInvoiceAmount)}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المبلغ المدفوع</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrencyKWD(totalPaid)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المبلغ المستحق</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrencyKWD(totalOutstanding)}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عدد الفواتير</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الفواتير */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الفواتير</CardTitle>
          <div className="flex gap-2">
            {contract.status === 'completed' && invoices.length === 0 && (
              <>
                <Button onClick={handleCreateInvoiceAndPayment} className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  <CreditCard className="w-4 h-4" />
                  إنشاء فاتورة ودفعة
                </Button>
                <Button onClick={handleCreateInvoice} variant="outline" className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  إنشاء فاتورة فقط
                </Button>
              </>
            )}
            <Button 
              onClick={() => setInvoiceFormOpen(true)} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              فاتورة جديدة
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">لا توجد فواتير</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {contract.status === 'completed' 
                  ? 'يمكنك إنشاء فاتورة مع دفعة مباشرة أو إنشاء فاتورة فقط'
                  : 'قم بإنشاء فاتورة عند اكتمال العقد'
                }
              </p>
              {contract.status === 'completed' && (
                <Button onClick={handleCreateInvoiceAndPayment} className="mb-2">
                  <Receipt className="w-4 h-4 ml-2" />
                  <CreditCard className="w-4 h-4 ml-2" />
                  إنشاء فاتورة ودفعة
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>تاريخ الإصدار</TableHead>
                    <TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead>المبلغ الكلي</TableHead>
                    <TableHead>المبلغ المستحق</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {invoice.invoice_type === 'rental' ? 'إيجار' : 'أخرى'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>{formatCurrencyKWD(invoice.total_amount)}</TableCell>
                      <TableCell>
                        <span className={invoice.outstanding_amount > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          {formatCurrencyKWD(invoice.outstanding_amount)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => console.log('View invoice:', invoice.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {invoice.outstanding_amount > 0 && (
                            <Button
                              size="sm"
                              onClick={() => handleAddPayment(invoice)}
                              className="flex items-center gap-1"
                            >
                              <CreditCard className="w-4 h-4" />
                              دفع
                            </Button>
                          )}
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

      {/* المدفوعات */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>سجل المدفوعات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الدفعة</TableHead>
                    <TableHead>رقم الفاتورة</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>تاريخ الدفع</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.payment_number}</TableCell>
                      <TableCell>{payment.invoices?.invoice_number}</TableCell>
                      <TableCell>{formatCurrencyKWD(payment.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.payment_method === 'cash' ? 'نقد' : 
                           payment.payment_method === 'card' ? 'بطاقة' : 
                           payment.payment_method === 'transfer' ? 'تحويل' : payment.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.payment_date), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status, 'payment')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* إجراءات إنهاء المرحلة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            إنهاء مرحلة الدفع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-medium text-purple-900 mb-2">المهام المطلوبة:</h3>
              <ul className="list-disc list-inside text-purple-800 space-y-1">
                <li className={invoices.length > 0 ? 'line-through text-green-700' : ''}>
                  إصدار الفواتير {invoices.length > 0 && '✓'}
                </li>
                <li className={totalPaid >= totalInvoiceAmount ? 'line-through text-green-700' : ''}>
                  تحصيل المدفوعات {totalPaid >= totalInvoiceAmount && '✓'}
                </li>
                <li className={totalOutstanding === 0 ? 'line-through text-green-700' : ''}>
                  تسوية المتأخرات {totalOutstanding === 0 && '✓'}
                </li>
                <li>تأكيد اكتمال الدفع</li>
              </ul>
            </div>
            
            <div className="flex justify-end gap-2">
              {totalOutstanding === 0 && invoices.length > 0 ? (
                <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4" />
                  إنهاء العقد - الدفع مكتمل
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  disabled
                  className="flex items-center gap-2"
                >
                  يجب إنهاء جميع المدفوعات أولاً
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* نماذج الحوار */}
      <InvoiceForm
        open={invoiceFormOpen}
        onOpenChange={setInvoiceFormOpen}
        onSuccess={() => {
          toast({
            title: "تم بنجاح",
            description: "تم إنشاء الفاتورة بنجاح",
          });
          loadContractData();
        }}
        contracts={[contract]}
        customers={customers}
        preselectedContractId={contract.id}
      />

      {selectedInvoiceForPayment && (
        <PaymentForm
          open={paymentFormOpen}
          onOpenChange={setPaymentFormOpen}
          onSuccess={handlePaymentSuccess}
          invoice={selectedInvoiceForPayment}
        />
      )}

      <InvoiceAndPaymentForm
        open={invoiceAndPaymentFormOpen}
        onOpenChange={setInvoiceAndPaymentFormOpen}
        onSuccess={async () => {
          toast({
            title: "تم بنجاح",
            description: "تم إنشاء الفاتورة وتسجيل الدفعة بنجاح",
          });
          await loadContractData();
          await checkAndAdvanceStage();
        }}
        contract={contract}
      />
    </ContractStageWrapper>
  );
};

export default PaymentStage;