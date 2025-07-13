import { supabase } from '@/integrations/supabase/client';
import { accountingService } from './accountingService';
import { JournalEntry, JournalEntryLine } from '@/types/accounting';

export interface ContractAccountingEntry {
  id: string;
  contract_id: string;
  journal_entry_id: string;
  entry_type: string;
  amount: number;
  created_at: string;
  created_by?: string;
  notes?: string;
}

export interface ContractAccountingData {
  contract_id: string;
  customer_name: string;
  vehicle_info: string;
  contract_number: string;
  total_amount: number;
  security_deposit: number;
  insurance_amount: number;
  tax_amount: number;
  discount_amount: number;
  start_date: string;
  end_date: string;
}

export const contractAccountingService = {
  // إنشاء القيود المحاسبية للعقد
  async createContractAccountingEntry(contractData: ContractAccountingData): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('create_contract_accounting_entry', {
        contract_id: contractData.contract_id,
        contract_data: {
          total_amount: contractData.total_amount,
          security_deposit: contractData.security_deposit,
          insurance_amount: contractData.insurance_amount,
          tax_amount: contractData.tax_amount,
          discount_amount: contractData.discount_amount,
          customer_name: contractData.customer_name,
          vehicle_info: contractData.vehicle_info
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('خطأ في إنشاء القيد المحاسبي للعقد:', error);
      throw error;
    }
  },

  // جلب القيود المحاسبية المرتبطة بالعقد
  async getContractAccountingEntries(contractId: string): Promise<ContractAccountingEntry[]> {
    const { data, error } = await supabase
      .from('contract_accounting_entries')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // جلب القيد المحاسبي مع تفاصيله للعقد
  async getContractJournalEntry(contractId: string): Promise<any> {
    const { data, error } = await supabase
      .from('contracts')
      .select(`
        journal_entry_id,
        journal_entries!journal_entry_id (
          *,
          lines:journal_entry_lines (
            *,
            account:chart_of_accounts (*)
          )
        )
      `)
      .eq('id', contractId)
      .single();

    if (error) throw error;
    return data?.journal_entries || null;
  },

  // إنشاء قيد تحصيل دفعة من العقد
  async createContractPaymentEntry(contractId: string, paymentData: {
    customer_name: string;
    vehicle_info: string;
    amount: number;
    payment_method: 'cash' | 'bank_transfer' | 'check';
    payment_date?: string;
    bank_account_id?: string;
    reference_number?: string;
  }): Promise<string> {
    try {
      const paymentDate = paymentData.payment_date || new Date().toISOString().split('T')[0];
      
      // إنشاء القيد المحاسبي لتحصيل دفعة العقد
      const journalEntry = await accountingService.createJournalEntry({
        entry_date: paymentDate,
        description: `تحصيل دفعة عقد - ${paymentData.customer_name} - ${paymentData.vehicle_info}`,
        reference_type: 'payment',
        reference_id: contractId,
        total_debit: paymentData.amount,
        total_credit: paymentData.amount,
        status: 'posted'
      });

      // الحصول على معرفات الحسابات
      const accounts = await accountingService.getChartOfAccounts();
      const contractReceivableAccount = accounts.find(acc => acc.account_code === '110201')?.id;
      
      let cashAccount;
      if (paymentData.payment_method === 'bank_transfer' && paymentData.bank_account_id) {
        // استخدام حساب البنك المحدد
        const bankAccounts = await supabase
          .from('bank_accounts')
          .select('account_id')
          .eq('id', paymentData.bank_account_id)
          .single();
        cashAccount = bankAccounts.data?.account_id;
      } else {
        // استخدام حساب النقدية العام
        cashAccount = accounts.find(acc => 
          acc.account_type === 'asset' && 
          acc.account_category === 'current_asset' &&
          (acc.account_name.includes('نقدية') || acc.account_name.includes('صندوق'))
        )?.id;
      }

      if (!contractReceivableAccount || !cashAccount) {
        throw new Error('لا يمكن العثور على الحسابات المحاسبية المطلوبة');
      }

      // إنشاء سطور القيد
      await accountingService.createJournalEntryLine({
        journal_entry_id: journalEntry.id,
        account_id: cashAccount,
        description: `نقدية محصلة من عقد - ${paymentData.customer_name}`,
        debit_amount: paymentData.amount,
        credit_amount: 0,
        line_number: 1
      });

      await accountingService.createJournalEntryLine({
        journal_entry_id: journalEntry.id,
        account_id: contractReceivableAccount,
        description: `تخفيض مديونية عقد - ${paymentData.customer_name}`,
        debit_amount: 0,
        credit_amount: paymentData.amount,
        line_number: 2
      });

      // ربط القيد بالعقد
      const { error: linkError } = await supabase
        .from('contract_accounting_entries')
        .insert({
          contract_id: contractId,
          journal_entry_id: journalEntry.id,
          entry_type: 'collection',
          amount: paymentData.amount,
          notes: `تحصيل دفعة - ${paymentData.payment_method}`
        });

      if (linkError) throw linkError;

      return journalEntry.id;
    } catch (error) {
      console.error('خطأ في إنشاء قيد تحصيل دفعة العقد:', error);
      throw error;
    }
  },

  // إنشاء قيد إرجاع العربون
  async createDepositReturnEntry(contractId: string, depositData: {
    customer_name: string;
    vehicle_info: string;
    deposit_amount: number;
    deductions: number;
    net_return: number;
    return_date?: string;
  }): Promise<string> {
    try {
      const returnDate = depositData.return_date || new Date().toISOString().split('T')[0];
      
      const journalEntry = await accountingService.createJournalEntry({
        entry_date: returnDate,
        description: `إرجاع عربون عقد - ${depositData.customer_name} - ${depositData.vehicle_info}`,
        reference_type: 'manual',
        reference_id: contractId,
        total_debit: depositData.deposit_amount,
        total_credit: depositData.deposit_amount,
        status: 'posted'
      });

      const accounts = await accountingService.getChartOfAccounts();
      const depositAccount = accounts.find(acc => acc.account_code === '210301')?.id;
      const cashAccount = accounts.find(acc => 
        acc.account_type === 'asset' && 
        acc.account_category === 'current_asset' &&
        (acc.account_name.includes('نقدية') || acc.account_name.includes('صندوق'))
      )?.id;
      const revenueAccount = accounts.find(acc => acc.account_code === '410101')?.id;

      if (!depositAccount || !cashAccount || !revenueAccount) {
        throw new Error('لا يمكن العثور على الحسابات المطلوبة لإرجاع العربون');
      }

      // سطور القيد
      await accountingService.createJournalEntryLine({
        journal_entry_id: journalEntry.id,
        account_id: depositAccount,
        description: `إبراء التزام العربون - ${depositData.customer_name}`,
        debit_amount: depositData.deposit_amount,
        credit_amount: 0,
        line_number: 1
      });

      if (depositData.net_return > 0) {
        await accountingService.createJournalEntryLine({
          journal_entry_id: journalEntry.id,
          account_id: cashAccount,
          description: `نقدية مردودة للعميل - ${depositData.customer_name}`,
          debit_amount: 0,
          credit_amount: depositData.net_return,
          line_number: 2
        });
      }

      if (depositData.deductions > 0) {
        await accountingService.createJournalEntryLine({
          journal_entry_id: journalEntry.id,
          account_id: revenueAccount,
          description: `استقطاع من العربون - ${depositData.customer_name}`,
          debit_amount: 0,
          credit_amount: depositData.deductions,
          line_number: 3
        });
      }

      // ربط القيد بالعقد
      const { error: linkError } = await supabase
        .from('contract_accounting_entries')
        .insert({
          contract_id: contractId,
          journal_entry_id: journalEntry.id,
          entry_type: 'deposit',
          amount: depositData.deposit_amount,
          notes: `إرجاع عربون - خصم: ${depositData.deductions} د.ك`
        });

      if (linkError) throw linkError;

      return journalEntry.id;
    } catch (error) {
      console.error('خطأ في إنشاء قيد إرجاع العربون:', error);
      throw error;
    }
  },

  // جلب تقرير محاسبي للعقود
  async getContractAccountingReport(filters: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    status?: string;
  }) {
    try {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          customers!customer_id (
            customer_number,
            name,
            phone,
            email
          ),
          vehicles!vehicle_id (
            vehicle_number,
            make,
            model,
            license_plate
          ),
          journal_entries!journal_entry_id (
            id,
            entry_number,
            entry_date,
            total_debit,
            total_credit,
            status
          ),
          contract_accounting_entries!contract_id (
            id,
            entry_type,
            amount,
            journal_entry_id
          )
        `)
        .not('journal_entry_id', 'is', null)
        .order('created_at', { ascending: false });

      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate);
      }
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status as any);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((contract: any) => ({
        contract_id: contract.id,
        contract_number: contract.contract_number,
        customer_name: contract.customers?.name || '',
        customer_number: contract.customers?.customer_number || '',
        vehicle_info: contract.vehicles ? 
          `${contract.vehicles.make} ${contract.vehicles.model} - ${contract.vehicles.vehicle_number}` : '',
        start_date: contract.start_date,
        end_date: contract.end_date,
        total_amount: contract.total_amount,
        final_amount: contract.final_amount,
        journal_entry: contract.journal_entries,
        accounting_entries: contract.contract_accounting_entries,
        status: contract.status
      }));
    } catch (error) {
      console.error('خطأ في جلب تقرير محاسبة العقود:', error);
      throw error;
    }
  },

  // جلب ملخص محاسبي للعقود
  async getContractAccountingSummary(period: { year: number; month?: number }) {
    try {
      const startDate = period.month 
        ? `${period.year}-${period.month.toString().padStart(2, '0')}-01`
        : `${period.year}-01-01`;
      
      const endDate = period.month
        ? `${period.year}-${period.month.toString().padStart(2, '0')}-31`
        : `${period.year}-12-31`;

      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .not('journal_entry_id', 'is', null);

      if (error) throw error;

      const contracts = data || [];
      
      return {
        total_contracts: contracts.length,
        total_revenue: contracts.reduce((sum, c) => sum + (c.total_amount || 0), 0),
        total_final_amount: contracts.reduce((sum, c) => sum + (c.final_amount || 0), 0),
        total_deposits: contracts.reduce((sum, c) => sum + (c.security_deposit || 0), 0),
        total_insurance: contracts.reduce((sum, c) => sum + (c.insurance_amount || 0), 0),
        total_discounts: contracts.reduce((sum, c) => sum + (c.discount_amount || 0), 0),
        active_contracts: contracts.filter(c => c.status === 'active').length,
        completed_contracts: contracts.filter(c => c.status === 'completed').length,
        pending_contracts: contracts.filter(c => c.status === 'pending').length
      };
    } catch (error) {
      console.error('خطأ في جلب ملخص محاسبة العقود:', error);
      throw error;
    }
  },

  // التحقق من وجود قيود محاسبية للعقد
  async hasAccountingEntries(contractId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('contract_accounting_entries')
      .select('id')
      .eq('contract_id', contractId)
      .limit(1);

    if (error) throw error;
    return (data || []).length > 0;
  },

  // حذف القيود المحاسبية للعقد (للتراجع)
  async deleteContractAccountingEntries(contractId: string): Promise<void> {
    try {
      // جلب معرف القيد المحاسبي
      const { data: contract } = await supabase
        .from('contracts')
        .select('journal_entry_id')
        .eq('id', contractId)
        .single();

      if (contract?.journal_entry_id) {
        // حذف القيد المحاسبي (سيحذف تلقائياً من جدول الربط)
        await accountingService.reverseJournalEntry(
          contract.journal_entry_id, 
          'إلغاء عقد إيجار'
        );

        // إزالة الربط من جدول العقود
        await supabase
          .from('contracts')
          .update({ journal_entry_id: null })
          .eq('id', contractId);
      }
    } catch (error) {
      console.error('خطأ في حذف القيود المحاسبية للعقد:', error);
      throw error;
    }
  }
};