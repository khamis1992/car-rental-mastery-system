import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AccountingIntegrationService } from '@/services/BusinessServices/AccountingIntegrationService';

interface IntegrityCheckResult {
  payments_without_entries: number;
  invoices_without_entries: number;
  contracts_without_entries: number;
  payroll_without_entries: number;
  maintenance_without_entries: number;
  duplicate_entries: number;
  unbalanced_entries: number;
}

export const AccountingIntegrityChecker: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<IntegrityCheckResult | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  const accountingService = new AccountingIntegrationService();

  const checkIntegrity = async () => {
    setIsChecking(true);
    try {
      // فحص الدفعات بدون قيود
      const { data: paymentsWithoutEntries } = await supabase
        .from('payments')
        .select('id')
        .eq('status', 'completed')
        .is('journal_entry_id', null);

      // فحص الفواتير بدون قيود
      const { data: invoicesWithoutEntries } = await supabase
        .from('invoices')
        .select('id')
        .neq('status', 'draft')
        .is('journal_entry_id', null);

      // فحص العقود بدون قيود
      const { data: contractsWithoutEntries } = await supabase
        .from('contracts')
        .select('id')
        .eq('status', 'active')
        .is('journal_entry_id', null);

      // فحص الرواتب بدون قيود
      const { data: payrollWithoutEntries } = await supabase
        .from('payroll')
        .select('id')
        .eq('status', 'approved')
        .is('journal_entry_id', null);

      // فحص الصيانة بدون قيود
      const { data: maintenanceWithoutEntries } = await supabase
        .from('vehicle_maintenance')
        .select('id')
        .eq('status', 'completed')
        .is('journal_entry_id', null);

      // فحص القيود المضاعفة
      const { data: duplicateEntries } = await supabase
        .from('journal_entries')
        .select('reference_id, reference_type')
        .not('reference_id', 'is', null);

      const duplicateCount = duplicateEntries ? 
        duplicateEntries.filter((entry, index, self) => 
          self.findIndex(e => e.reference_id === entry.reference_id && e.reference_type === entry.reference_type) !== index
        ).length : 0;

      // فحص القيود غير المتوازنة
      const { data: unbalancedEntries } = await supabase.rpc('get_unbalanced_journal_entries');

      setResults({
        payments_without_entries: paymentsWithoutEntries?.length || 0,
        invoices_without_entries: invoicesWithoutEntries?.length || 0,
        contracts_without_entries: contractsWithoutEntries?.length || 0,
        payroll_without_entries: payrollWithoutEntries?.length || 0,
        maintenance_without_entries: maintenanceWithoutEntries?.length || 0,
        duplicate_entries: duplicateCount,
        unbalanced_entries: unbalancedEntries?.length || 0
      });

    } catch (error) {
      console.error('Error checking integrity:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const fixMissingEntries = async () => {
    setIsFixing(true);
    try {
      // إصلاح الدفعات المفقودة
      const { data: paymentsToFix } = await supabase
        .from('payments')
        .select(`
          id, amount, payment_method, payment_date,
          invoices!inner(
            id, invoice_number,
            customers!inner(name)
          )
        `)
        .eq('status', 'completed')
        .is('journal_entry_id', null);

      for (const payment of paymentsToFix || []) {
        try {
          const journalEntryId = await accountingService.createPaymentAccountingEntry(payment.id, {
            customer_name: payment.invoices.customers.name,
            invoice_number: payment.invoices.invoice_number,
            payment_amount: payment.amount,
            payment_method: payment.payment_method,
            payment_date: payment.payment_date
          });

          await supabase
            .from('payments')
            .update({ journal_entry_id: journalEntryId })
            .eq('id', payment.id);

        } catch (error) {
          console.error(`Failed to fix payment ${payment.id}:`, error);
        }
      }

      // إصلاح الفواتير المفقودة
      const { data: invoicesToFix } = await supabase
        .from('invoices')
        .select(`
          id, invoice_number, total_amount, tax_amount, discount_amount,
          customers!inner(name)
        `)
        .neq('status', 'draft')
        .is('journal_entry_id', null);

      for (const invoice of invoicesToFix || []) {
        try {
          const journalEntryId = await accountingService.createInvoiceAccountingEntry(invoice.id, {
            customer_name: invoice.customers.name,
            invoice_number: invoice.invoice_number,
            total_amount: invoice.total_amount,
            tax_amount: invoice.tax_amount,
            discount_amount: invoice.discount_amount
          });

          await supabase
            .from('invoices')
            .update({ journal_entry_id: journalEntryId })
            .eq('id', invoice.id);

        } catch (error) {
          console.error(`Failed to fix invoice ${invoice.id}:`, error);
        }
      }

      // إعادة فحص التكامل
      await checkIntegrity();

    } catch (error) {
      console.error('Error fixing entries:', error);
    } finally {
      setIsFixing(false);
    }
  };

  const getStatusColor = (count: number) => {
    if (count === 0) return 'bg-green-100 text-green-800';
    if (count <= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (count: number) => {
    if (count === 0) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (count <= 5) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            فحص سلامة النظام المحاسبي
          </CardTitle>
          <CardDescription>
            التحقق من تكامل القيود المحاسبية وتجنب التسجيل المضاعف
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={checkIntegrity} 
              disabled={isChecking}
              className="flex-1"
            >
              {isChecking ? 'جاري الفحص...' : 'فحص التكامل'}
            </Button>
            {results && (
              <Button 
                onClick={fixMissingEntries} 
                disabled={isFixing}
                variant="outline"
                className="flex-1"
              >
                {isFixing ? 'جاري الإصلاح...' : 'إصلاح المفقود'}
              </Button>
            )}
          </div>

          {results && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>نتائج الفحص:</strong> تم العثور على {
                    results.payments_without_entries + 
                    results.invoices_without_entries + 
                    results.contracts_without_entries + 
                    results.payroll_without_entries + 
                    results.maintenance_without_entries
                  } عنصر بدون قيود محاسبية.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">الدفعات بدون قيود</span>
                    {getStatusIcon(results.payments_without_entries)}
                  </div>
                  <Badge className={getStatusColor(results.payments_without_entries)}>
                    {results.payments_without_entries}
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">الفواتير بدون قيود</span>
                    {getStatusIcon(results.invoices_without_entries)}
                  </div>
                  <Badge className={getStatusColor(results.invoices_without_entries)}>
                    {results.invoices_without_entries}
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">العقود بدون قيود</span>
                    {getStatusIcon(results.contracts_without_entries)}
                  </div>
                  <Badge className={getStatusColor(results.contracts_without_entries)}>
                    {results.contracts_without_entries}
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">الرواتب بدون قيود</span>
                    {getStatusIcon(results.payroll_without_entries)}
                  </div>
                  <Badge className={getStatusColor(results.payroll_without_entries)}>
                    {results.payroll_without_entries}
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">الصيانة بدون قيود</span>
                    {getStatusIcon(results.maintenance_without_entries)}
                  </div>
                  <Badge className={getStatusColor(results.maintenance_without_entries)}>
                    {results.maintenance_without_entries}
                  </Badge>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">القيود المضاعفة</span>
                    {getStatusIcon(results.duplicate_entries)}
                  </div>
                  <Badge className={getStatusColor(results.duplicate_entries)}>
                    {results.duplicate_entries}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 