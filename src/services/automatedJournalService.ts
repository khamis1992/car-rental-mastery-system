import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { accountingReportsService } from './accountingReportsService';

export interface AutomatedJournalEntry {
  id: string;
  entry_date: string;
  reference: string;
  description: string;
  debit_account: string;
  credit_account: string;
  debit_amount: number;
  credit_amount: number;
  source_type: 'invoice' | 'payment' | 'penalty' | 'depreciation' | 'contract_completion';
  source_id: string;
  contract_id?: string;
  customer_id?: string;
  vehicle_id?: string;
  user_id: string;
  tenant_id: string;
  status: 'pending' | 'posted' | 'reversed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryTemplate {
  source_type: string;
  debit_account: string;
  credit_account: string;
  account_mapping: {
    [key: string]: string;
  };
  description_template: string;
  reference_template: string;
}

class AutomatedJournalService {
  private tenant_id: string | null = null;
  private user_id: string | null = null;

  constructor() {
    this.initializeUser();
  }

  private async initializeUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      this.user_id = user.id;
      const { data } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
      this.tenant_id = data?.tenant_id || null;
    }
  }

  // Journal Entry Templates based on the 7-digit chart of accounts
  private journalTemplates: JournalEntryTemplate[] = [
    {
      source_type: 'invoice',
      debit_account: '1130101', // عملاء تجاريون شركات
      credit_account: '4110101', // إيرادات تأجير للشركات
      account_mapping: {
        'individual': '1130201', // عملاء أفراد
        'government': '1130301', // عملاء حكوميون
        'individual_revenue': '4110201', // إيرادات تأجير للأفراد
        'government_revenue': '4110301'  // إيرادات تأجير حكومية
      },
      description_template: 'فاتورة تأجير - عقد رقم {contract_number}',
      reference_template: 'INV-{contract_number}-{date}'
    },
    {
      source_type: 'payment',
      debit_account: '1110101', // الصندوق النقدي الرئيسي
      credit_account: '1130101', // عملاء تجاريون شركات
      account_mapping: {
        'bank': '1120101', // البنك الأهلي الحساب الرئيسي
        'kfh': '1120102', // بيت التمويل الكويتي
        'individual': '1130201', // عملاء أفراد
        'government': '1130301' // عملاء حكوميون
      },
      description_template: 'دفعة من العميل - عقد رقم {contract_number}',
      reference_template: 'PAY-{contract_number}-{date}'
    },
    {
      source_type: 'penalty',
      debit_account: '1130101', // عملاء تجاريون شركات
      credit_account: '4310104', // إيرادات أخرى
      account_mapping: {
        'individual': '1130201', // عملاء أفراد
        'government': '1130301' // عملاء حكوميون
      },
      description_template: 'غرامة تأخير - عقد رقم {contract_number}',
      reference_template: 'PEN-{contract_number}-{date}'
    },
    {
      source_type: 'depreciation',
      debit_account: '5130101', // مصروف إهلاك السيارات والباصات
      credit_account: '1210101', // مخصص إهلاك السيارات والباصات
      account_mapping: {
        'buses': '5130102', // مصروف إهلاك الباصات
        'buses_allowance': '1210102', // مخصص إهلاك الباصات
        'trucks': '5130103', // مصروف إهلاك الشاحنات
        'trucks_allowance': '1210103', // مخصص إهلاك الشاحنات
        'equipment': '5130104', // مصروف إهلاك المعدات
        'equipment_allowance': '1210104' // مخصص إهلاك المعدات
      },
      description_template: 'إهلاك شهري - {vehicle_plate}',
      reference_template: 'DEP-{vehicle_plate}-{date}'
    },
    {
      source_type: 'contract_completion',
      debit_account: '1110101', // الصندوق النقدي الرئيسي
      credit_account: '1130101', // عملاء تجاريون شركات
      account_mapping: {
        'deposit_return': '2120101', // ودائع العملاء قصيرة الأجل
        'individual': '1130201', // عملاء أفراد
        'government': '1130301' // عملاء حكوميون
      },
      description_template: 'إكمال عقد وإرجاع التأمين - عقد رقم {contract_number}',
      reference_template: 'COM-{contract_number}-{date}'
    }
  ];

  // 1. Create Journal Entry for Invoice
  async createInvoiceJournalEntry(invoiceData: {
    invoice_id: string;
    contract_id: string;
    customer_id: string;
    customer_type: 'company' | 'individual' | 'government';
    amount: number;
    contract_number: string;
    description?: string;
  }): Promise<string> {
    if (!this.tenant_id || !this.user_id) await this.initializeUser();

    const template = this.journalTemplates.find(t => t.source_type === 'invoice');
    if (!template) throw new Error('Invoice template not found');

    const debitAccount = template.debit_account;
    const creditAccount = invoiceData.customer_type === 'individual' 
      ? template.account_mapping.individual_revenue 
      : invoiceData.customer_type === 'government'
      ? template.account_mapping.government_revenue
      : template.credit_account;

    const customerAccount = invoiceData.customer_type === 'individual' 
      ? template.account_mapping.individual
      : invoiceData.customer_type === 'government'
      ? template.account_mapping.government
      : template.debit_account;

    const reference = template.reference_template
      .replace('{contract_number}', invoiceData.contract_number)
      .replace('{date}', format(new Date(), 'yyyyMMdd'));

    const description = invoiceData.description || template.description_template
      .replace('{contract_number}', invoiceData.contract_number);

    const journalEntry = await this.createJournalEntry({
      reference,
      description,
      debit_account: customerAccount,
      credit_account: creditAccount,
      debit_amount: invoiceData.amount,
      credit_amount: invoiceData.amount,
      source_type: 'invoice',
      source_id: invoiceData.invoice_id,
      contract_id: invoiceData.contract_id,
      customer_id: invoiceData.customer_id
    });

    return journalEntry;
  }

  // 2. Create Journal Entry for Payment
  async createPaymentJournalEntry(paymentData: {
    payment_id: string;
    contract_id: string;
    customer_id: string;
    customer_type: 'company' | 'individual' | 'government';
    amount: number;
    payment_method: 'cash' | 'bank' | 'kfh';
    contract_number: string;
    description?: string;
  }): Promise<string> {
    if (!this.tenant_id || !this.user_id) await this.initializeUser();

    const template = this.journalTemplates.find(t => t.source_type === 'payment');
    if (!template) throw new Error('Payment template not found');

    const debitAccount = paymentData.payment_method === 'bank' 
      ? template.account_mapping.bank
      : paymentData.payment_method === 'kfh'
      ? template.account_mapping.kfh
      : template.debit_account;

    const creditAccount = paymentData.customer_type === 'individual' 
      ? template.account_mapping.individual
      : paymentData.customer_type === 'government'
      ? template.account_mapping.government
      : template.credit_account;

    const reference = template.reference_template
      .replace('{contract_number}', paymentData.contract_number)
      .replace('{date}', format(new Date(), 'yyyyMMdd'));

    const description = paymentData.description || template.description_template
      .replace('{contract_number}', paymentData.contract_number);

    const journalEntry = await this.createJournalEntry({
      reference,
      description,
      debit_account: debitAccount,
      credit_account: creditAccount,
      debit_amount: paymentData.amount,
      credit_amount: paymentData.amount,
      source_type: 'payment',
      source_id: paymentData.payment_id,
      contract_id: paymentData.contract_id,
      customer_id: paymentData.customer_id
    });

    return journalEntry;
  }

  // 3. Create Journal Entry for Penalty
  async createPenaltyJournalEntry(penaltyData: {
    penalty_id: string;
    contract_id: string;
    customer_id: string;
    customer_type: 'company' | 'individual' | 'government';
    amount: number;
    contract_number: string;
    description?: string;
  }): Promise<string> {
    if (!this.tenant_id || !this.user_id) await this.initializeUser();

    const template = this.journalTemplates.find(t => t.source_type === 'penalty');
    if (!template) throw new Error('Penalty template not found');

    const debitAccount = penaltyData.customer_type === 'individual' 
      ? template.account_mapping.individual
      : penaltyData.customer_type === 'government'
      ? template.account_mapping.government
      : template.debit_account;

    const reference = template.reference_template
      .replace('{contract_number}', penaltyData.contract_number)
      .replace('{date}', format(new Date(), 'yyyyMMdd'));

    const description = penaltyData.description || template.description_template
      .replace('{contract_number}', penaltyData.contract_number);

    const journalEntry = await this.createJournalEntry({
      reference,
      description,
      debit_account: debitAccount,
      credit_account: template.credit_account,
      debit_amount: penaltyData.amount,
      credit_amount: penaltyData.amount,
      source_type: 'penalty',
      source_id: penaltyData.penalty_id,
      contract_id: penaltyData.contract_id,
      customer_id: penaltyData.customer_id
    });

    return journalEntry;
  }

  // 4. Create Journal Entry for Depreciation
  async createDepreciationJournalEntry(depreciationData: {
    vehicle_id: string;
    vehicle_type: 'car' | 'bus' | 'truck' | 'equipment';
    vehicle_plate: string;
    amount: number;
    month: string;
    description?: string;
  }): Promise<string> {
    if (!this.tenant_id || !this.user_id) await this.initializeUser();

    const template = this.journalTemplates.find(t => t.source_type === 'depreciation');
    if (!template) throw new Error('Depreciation template not found');

    const debitAccount = depreciationData.vehicle_type === 'bus' 
      ? template.account_mapping.buses
      : depreciationData.vehicle_type === 'truck'
      ? template.account_mapping.trucks
      : depreciationData.vehicle_type === 'equipment'
      ? template.account_mapping.equipment
      : template.debit_account;

    const creditAccount = depreciationData.vehicle_type === 'bus' 
      ? template.account_mapping.buses_allowance
      : depreciationData.vehicle_type === 'truck'
      ? template.account_mapping.trucks_allowance
      : depreciationData.vehicle_type === 'equipment'
      ? template.account_mapping.equipment_allowance
      : template.credit_account;

    const reference = template.reference_template
      .replace('{vehicle_plate}', depreciationData.vehicle_plate)
      .replace('{date}', format(new Date(), 'yyyyMMdd'));

    const description = depreciationData.description || template.description_template
      .replace('{vehicle_plate}', depreciationData.vehicle_plate);

    const journalEntry = await this.createJournalEntry({
      reference,
      description,
      debit_account: debitAccount,
      credit_account: creditAccount,
      debit_amount: depreciationData.amount,
      credit_amount: depreciationData.amount,
      source_type: 'depreciation',
      source_id: depreciationData.vehicle_id,
      vehicle_id: depreciationData.vehicle_id
    });

    return journalEntry;
  }

  // 5. Create Journal Entry for Contract Completion
  async createContractCompletionJournalEntry(completionData: {
    contract_id: string;
    customer_id: string;
    customer_type: 'company' | 'individual' | 'government';
    deposit_amount: number;
    contract_number: string;
    description?: string;
  }): Promise<string> {
    if (!this.tenant_id || !this.user_id) await this.initializeUser();

    const template = this.journalTemplates.find(t => t.source_type === 'contract_completion');
    if (!template) throw new Error('Contract completion template not found');

    const creditAccount = completionData.customer_type === 'individual' 
      ? template.account_mapping.individual
      : completionData.customer_type === 'government'
      ? template.account_mapping.government
      : template.credit_account;

    const reference = template.reference_template
      .replace('{contract_number}', completionData.contract_number)
      .replace('{date}', format(new Date(), 'yyyyMMdd'));

    const description = completionData.description || template.description_template
      .replace('{contract_number}', completionData.contract_number);

    // Create two journal entries for contract completion
    // 1. Return deposit to customer
    const depositEntry = await this.createJournalEntry({
      reference: reference + '-DEP',
      description: 'إرجاع التأمين - ' + description,
      debit_account: template.account_mapping.deposit_return,
      credit_account: template.debit_account,
      debit_amount: completionData.deposit_amount,
      credit_amount: completionData.deposit_amount,
      source_type: 'contract_completion',
      source_id: completionData.contract_id,
      contract_id: completionData.contract_id,
      customer_id: completionData.customer_id
    });

    // 2. Clear customer account
    const clearanceEntry = await this.createJournalEntry({
      reference: reference + '-CLR',
      description: 'تسوية حساب العميل - ' + description,
      debit_account: creditAccount,
      credit_account: creditAccount,
      debit_amount: 0,
      credit_amount: 0,
      source_type: 'contract_completion',
      source_id: completionData.contract_id,
      contract_id: completionData.contract_id,
      customer_id: completionData.customer_id
    });

    return depositEntry;
  }

  // 6. Generic Journal Entry Creator
  private async createJournalEntry(entryData: {
    reference: string;
    description: string;
    debit_account: string;
    credit_account: string;
    debit_amount: number;
    credit_amount: number;
    source_type: string;
    source_id: string;
    contract_id?: string;
    customer_id?: string;
    vehicle_id?: string;
  }): Promise<string> {
    if (!this.tenant_id || !this.user_id) throw new Error('User not initialized');

    const { data, error } = await supabase
      .from('automated_journal_entries')
      .insert([{
        entry_date: format(new Date(), 'yyyy-MM-dd'),
        reference: entryData.reference,
        description: entryData.description,
        debit_account: entryData.debit_account,
        credit_account: entryData.credit_account,
        debit_amount: entryData.debit_amount,
        credit_amount: entryData.credit_amount,
        source_type: entryData.source_type,
        source_id: entryData.source_id,
        contract_id: entryData.contract_id,
        customer_id: entryData.customer_id,
        vehicle_id: entryData.vehicle_id,
        user_id: this.user_id,
        tenant_id: this.tenant_id,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }

    return data.id;
  }

  // 7. Get Journal Entries
  async getJournalEntries(filters?: {
    start_date?: string;
    end_date?: string;
    source_type?: string;
    status?: string;
    customer_id?: string;
    contract_id?: string;
  }): Promise<AutomatedJournalEntry[]> {
    if (!this.tenant_id) await this.initializeUser();

    let query = supabase
      .from('automated_journal_entries')
      .select('*')
      .eq('tenant_id', this.tenant_id)
      .order('entry_date', { ascending: false });

    if (filters?.start_date) {
      query = query.gte('entry_date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('entry_date', filters.end_date);
    }
    if (filters?.source_type) {
      query = query.eq('source_type', filters.source_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.contract_id) {
      query = query.eq('contract_id', filters.contract_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching journal entries:', error);
      throw error;
    }

    return data || [];
  }

  // 8. Post Journal Entry
  async postJournalEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('automated_journal_entries')
      .update({ 
        status: 'posted',
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId);

    if (error) {
      console.error('Error posting journal entry:', error);
      throw error;
    }
  }

  // 9. Reverse Journal Entry
  async reverseJournalEntry(entryId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('automated_journal_entries')
      .update({ 
        status: 'reversed',
        notes: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId);

    if (error) {
      console.error('Error reversing journal entry:', error);
      throw error;
    }
  }

  // 10. Get Journal Entry by ID
  async getJournalEntryById(entryId: string): Promise<AutomatedJournalEntry | null> {
    const { data, error } = await supabase
      .from('automated_journal_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (error) {
      console.error('Error fetching journal entry:', error);
      throw error;
    }

    return data;
  }

  // 11. Process Monthly Depreciation for all vehicles
  async processMonthlyDepreciationForAllVehicles(): Promise<void> {
    const assets = await accountingReportsService.getFixedAssetsReport();
    const currentMonth = format(new Date(), 'yyyy-MM');

    for (const asset of assets) {
      // Check if depreciation already processed this month
      const existingEntries = await this.getJournalEntries({
        source_type: 'depreciation',
        start_date: `${currentMonth}-01`,
        end_date: `${currentMonth}-31`
      });

      const alreadyProcessed = existingEntries.some(entry => 
        entry.vehicle_id === asset.id && entry.status === 'posted'
      );

      if (!alreadyProcessed && asset.monthly_depreciation > 0) {
        await this.createDepreciationJournalEntry({
          vehicle_id: asset.id,
          vehicle_type: asset.vehicle_type as 'car' | 'bus' | 'truck' | 'equipment',
          vehicle_plate: asset.plate_number,
          amount: asset.monthly_depreciation,
          month: currentMonth
        });
      }
    }
  }

  // 12. Get Account Balance
  async getAccountBalance(accountNumber: string, asOfDate?: string): Promise<number> {
    if (!this.tenant_id) await this.initializeUser();

    let query = supabase
      .from('automated_journal_entries')
      .select('debit_amount, credit_amount, debit_account, credit_account')
      .eq('tenant_id', this.tenant_id)
      .eq('status', 'posted');

    if (asOfDate) {
      query = query.lte('entry_date', asOfDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching account balance:', error);
      throw error;
    }

    let balance = 0;
    data?.forEach(entry => {
      if (entry.debit_account === accountNumber) {
        balance += entry.debit_amount;
      }
      if (entry.credit_account === accountNumber) {
        balance -= entry.credit_amount;
      }
    });

    return balance;
  }

  // 13. Get Template by Source Type
  getTemplateBySourceType(sourceType: string): JournalEntryTemplate | null {
    return this.journalTemplates.find(t => t.source_type === sourceType) || null;
  }

  // 14. Validate Journal Entry
  async validateJournalEntry(entryData: {
    debit_account: string;
    credit_account: string;
    debit_amount: number;
    credit_amount: number;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check if debit amount equals credit amount
    if (entryData.debit_amount !== entryData.credit_amount) {
      errors.push('المبلغ المدين يجب أن يساوي المبلغ الدائن');
    }

    // Check if amounts are positive
    if (entryData.debit_amount <= 0 || entryData.credit_amount <= 0) {
      errors.push('المبالغ يجب أن تكون موجبة');
    }

    // Check if accounts are valid (7-digit format)
    const accountPattern = /^\d{7}$/;
    if (!accountPattern.test(entryData.debit_account)) {
      errors.push('رقم الحساب المدين غير صحيح');
    }
    if (!accountPattern.test(entryData.credit_account)) {
      errors.push('رقم الحساب الدائن غير صحيح');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const automatedJournalService = new AutomatedJournalService(); 