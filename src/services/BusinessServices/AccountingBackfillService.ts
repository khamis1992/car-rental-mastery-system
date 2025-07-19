import { supabase } from '@/integrations/supabase/client';
import { AccountingIntegrationService } from './AccountingIntegrationService';
import { serviceContainer } from '@/services/Container/ServiceContainer';

/**
 * خدمة استكمال القيود المحاسبية المفقودة
 * تقوم بإنشاء القيود المحاسبية للعقود والفواتير الموجودة
 */
export class AccountingBackfillService {
  private accountingService: AccountingIntegrationService;

  constructor() {
    this.accountingService = new AccountingIntegrationService();
  }

  /**
   * إنشاء القيود المحاسبية للعقود الموجودة
   */
  async createContractAccountingEntries(): Promise<{
    processed: number;
    created: number;
    errors: string[];
  }> {
    const result = {
      processed: 0,
      created: 0,
      errors: [] as string[]
    };

    try {
      // جلب العقود التي لا تحتوي على قيود محاسبية
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          customer_id,
          vehicle_id,
          total_amount,
          security_deposit,
          insurance_amount,
          tax_amount,
          discount_amount,
          journal_entry_id,
          status,
          customers(name),
          vehicles(make, model, vehicle_number)
        `)
        .in('status', ['active', 'completed'])
        .is('journal_entry_id', null);

      if (error) throw error;

      console.log(`Found ${contracts?.length || 0} contracts without accounting entries`);

      for (const contract of contracts || []) {
        try {
          result.processed++;

          // إنشاء القيد المحاسبي للعقد
          const journalEntryId = await supabase.rpc('create_contract_accounting_entry', {
            contract_id: contract.id,
            contract_data: {
              customer_name: contract.customers?.name || 'غير محدد',
              vehicle_info: contract.vehicles 
                ? `${contract.vehicles.make} ${contract.vehicles.model} - ${contract.vehicles.vehicle_number}`
                : 'غير محدد',
              total_amount: contract.total_amount,
              security_deposit: contract.security_deposit || 0,
              insurance_amount: contract.insurance_amount || 0,
              tax_amount: contract.tax_amount || 0,
              discount_amount: contract.discount_amount || 0
            }
          });

          if (journalEntryId.data) {
            // تحديث العقد بمعرف القيد المحاسبي
            await supabase
              .from('contracts')
              .update({ journal_entry_id: journalEntryId.data })
              .eq('id', contract.id);

            result.created++;
            console.log(`Created accounting entry for contract ${contract.contract_number}`);
          }

        } catch (error) {
          const errorMsg = `Error processing contract ${contract.contract_number}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = `Failed to process contracts: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
    }

    return result;
  }

  /**
   * إنشاء فواتير للعقود المكتملة التي لا تحتوي على فواتير
   */
  async createMissingInvoices(): Promise<{
    processed: number;
    created: number;
    errors: string[];
  }> {
    const result = {
      processed: 0,
      created: 0,
      errors: [] as string[]
    };

    try {
      // جلب العقود المكتملة التي لا تحتوي على فواتير
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select(`
          id,
          contract_number,
          customer_id,
          vehicle_id,
          final_amount,
          status
        `)
        .eq('status', 'completed');

      if (error) throw error;

      console.log(`Found ${contracts?.length || 0} completed contracts`);

      for (const contract of contracts || []) {
        try {
          result.processed++;

          // التحقق من وجود فاتورة للعقد
          const { data: existingInvoices, error: invoiceError } = await supabase
            .from('invoices')
            .select('id')
            .eq('contract_id', contract.id)
            .limit(1);

          if (invoiceError) throw invoiceError;

          if (!existingInvoices || existingInvoices.length === 0) {
            // إنشاء فاتورة للعقد
            const invoiceService = serviceContainer.getInvoiceBusinessService();
            const invoice = await invoiceService.generateRentalInvoice(contract.id);
            result.created++;
            console.log(`Created invoice for completed contract ${contract.contract_number}`);
          }

        } catch (error) {
          const errorMsg = `Error processing contract ${contract.contract_number}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = `Failed to process completed contracts: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
    }

    return result;
  }

  /**
   * إنشاء القيود المحاسبية للفواتير الموجودة
   */
  async createInvoiceAccountingEntries(): Promise<{
    processed: number;
    created: number;
    errors: string[];
  }> {
    const result = {
      processed: 0,
      created: 0,
      errors: [] as string[]
    };

    try {
      // جلب الفواتير - نتحقق من عدم وجود قيود محاسبية مرتبطة بها
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          customer_id,
          total_amount,
          tax_amount,
          discount_amount,
          customers(name)
        `);

      if (error) throw error;

      console.log(`Found ${invoices?.length || 0} invoices to check`);

      for (const invoice of invoices || []) {
        try {
          result.processed++;

          // التحقق من وجود قيد محاسبي للفاتورة
          const { data: existingEntries, error: entryError } = await supabase
            .from('journal_entries')
            .select('id')
            .eq('reference_type', 'invoice')
            .eq('reference_id', invoice.id)
            .limit(1);

          if (entryError) throw entryError;

          if (!existingEntries || existingEntries.length === 0) {
            // إنشاء القيد المحاسبي للفاتورة
            const journalEntryId = await this.accountingService.createInvoiceAccountingEntry(invoice.id, {
              customer_id: invoice.customer_id,
              customer_name: invoice.customers?.name || 'غير محدد',
              invoice_number: invoice.invoice_number,
              total_amount: invoice.total_amount,
              tax_amount: invoice.tax_amount || 0,
              discount_amount: invoice.discount_amount || 0
            });

            if (journalEntryId) {
              result.created++;
              console.log(`Created accounting entry for invoice ${invoice.invoice_number}`);
            }
          }

        } catch (error) {
          const errorMsg = `Error processing invoice ${invoice.invoice_number}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = `Failed to process invoices: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
    }

    return result;
  }

  /**
   * إنشاء القيود المحاسبية للمدفوعات الموجودة
   */
  async createPaymentAccountingEntries(): Promise<{
    processed: number;
    created: number;
    errors: string[];
  }> {
    const result = {
      processed: 0,
      created: 0,
      errors: [] as string[]
    };

    try {
      // جلب المدفوعات - نتحقق من عدم وجود قيود محاسبية مرتبطة بها
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          id,
          payment_number,
          amount,
          payment_date,
          payment_method,
          invoice_id,
          invoices(
            invoice_number, 
            customer_id,
            customers(name)
          )
        `)
        .eq('status', 'completed');

      if (error) throw error;

      console.log(`Found ${payments?.length || 0} payments to check`);

      for (const payment of payments || []) {
        try {
          result.processed++;

          // التحقق من وجود قيد محاسبي للمدفوعة
          const { data: existingEntries, error: entryError } = await supabase
            .from('journal_entries')
            .select('id')
            .eq('reference_type', 'payment')
            .eq('reference_id', payment.id)
            .limit(1);

          if (entryError) throw entryError;

          if (!existingEntries || existingEntries.length === 0) {
            // إنشاء القيد المحاسبي للمدفوعة
            const journalEntryId = await this.accountingService.createPaymentAccountingEntry(payment.id, {
              customer_id: payment.invoices?.customer_id || '',
              customer_name: payment.invoices?.customers?.name || 'غير محدد',
              invoice_id: payment.invoice_id,
              invoice_number: payment.invoices?.invoice_number || 'غير محدد',
              payment_amount: payment.amount,
              payment_method: payment.payment_method,
              payment_date: payment.payment_date
            });

            if (journalEntryId) {
              result.created++;
              console.log(`Created accounting entry for payment ${payment.payment_number}`);
            }
          }

        } catch (error) {
          const errorMsg = `Error processing payment ${payment.payment_number}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = `Failed to process payments: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      console.error(errorMsg);
    }

    return result;
  }

  /**
   * تشغيل جميع عمليات الاستكمال
   */
  async runFullBackfill(): Promise<{
    contracts: { processed: number; created: number; errors: string[] };
    invoices: { processed: number; created: number; errors: string[] };
    payments: { processed: number; created: number; errors: string[] };
    missingInvoices: { processed: number; created: number; errors: string[] };
  }> {
    console.log('Starting accounting backfill process...');

    const results = {
      contracts: await this.createContractAccountingEntries(),
      missingInvoices: await this.createMissingInvoices(),
      invoices: await this.createInvoiceAccountingEntries(),
      payments: await this.createPaymentAccountingEntries()
    };

    console.log('Accounting backfill process completed:', results);
    return results;
  }
}