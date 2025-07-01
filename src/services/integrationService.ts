import { supabase } from '@/integrations/supabase/client';
import { accountingService } from './accountingService';
import { invoiceService } from './invoiceService';
import { contractService } from './contractService';
import { paymentService } from './paymentService';
import { JournalEntry, JournalEntryLine } from '@/types/accounting';

export interface AutoAccountingEntry {
  reference_type: 'contract' | 'invoice' | 'payment' | 'manual';
  reference_id: string;
  description: string;
  lines: {
    account_code: string;
    debit_amount: number;
    credit_amount: number;
    description?: string;
  }[];
}

export interface IntegrationConfig {
  auto_journal_entries: boolean;
  ai_classification: boolean;
  real_time_sync: boolean;
  notification_alerts: boolean;
}

export const integrationService = {
  // Auto Journal Entry Creation
  async createContractJournalEntry(contractId: string): Promise<JournalEntry | null> {
    try {
      const contract = await contractService.getContractById(contractId);
      if (!contract) return null;

      const entry: AutoAccountingEntry = {
        reference_type: 'contract',
        reference_id: contractId,
        description: `قيد عقد إيجار ${contract.contract_number} - ${contract.customers.name}`,
        lines: [
          {
            account_code: '1301', // حسابات العملاء
            debit_amount: contract.final_amount,
            credit_amount: 0,
            description: `مستحق من العميل ${contract.customers.name}`
          },
          {
            account_code: '4101', // إيرادات الإيجار
            debit_amount: 0,
            credit_amount: contract.total_amount,
            description: `إيراد إيجار ${contract.vehicles.make} ${contract.vehicles.model}`
          }
        ]
      };

      // Add tax line if applicable
      if (contract.tax_amount > 0) {
        entry.lines.push({
          account_code: '2301', // ضريبة القيمة المضافة
          debit_amount: 0,
          credit_amount: contract.tax_amount,
          description: 'ضريبة القيمة المضافة'
        });
      }

      // Add security deposit line if applicable
      if (contract.security_deposit > 0) {
        entry.lines.push({
          account_code: '2501', // ودائع العملاء
          debit_amount: 0,
          credit_amount: contract.security_deposit,
          description: 'وديعة تأمين'
        });
      }

      return await this.createJournalEntryFromAuto(entry);
    } catch (error) {
      console.error('Error creating contract journal entry:', error);
      throw error;
    }
  },

  async createPaymentJournalEntry(paymentId: string): Promise<JournalEntry | null> {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoices(
            invoice_number,
            contracts(
              contract_number,
              customers(name)
            )
          )
        `)
        .eq('id', paymentId)
        .single();

      if (error || !payment) return null;

      const entry: AutoAccountingEntry = {
        reference_type: 'payment',
        reference_id: paymentId,
        description: `قيد دفعة ${payment.payment_number} - فاتورة ${payment.invoices.invoice_number}`,
        lines: [
          {
            account_code: this.getBankAccountCode(payment.payment_method),
            debit_amount: payment.amount,
            credit_amount: 0,
            description: `دفعة ${payment.payment_method}`
          },
          {
            account_code: '1301', // حسابات العملاء
            debit_amount: 0,
            credit_amount: payment.amount,
            description: `دفعة من العميل ${payment.invoices.contracts.customers.name}`
          }
        ]
      };

      return await this.createJournalEntryFromAuto(entry);
    } catch (error) {
      console.error('Error creating payment journal entry:', error);
      throw error;
    }
  },

  async createExpenseJournalEntry(expenseData: {
    description: string;
    amount: number;
    category: string;
    account_code: string;
    payment_method: string;
    reference_id?: string;
  }): Promise<JournalEntry | null> {
    try {
      const entry: AutoAccountingEntry = {
        reference_type: 'manual',
        reference_id: expenseData.reference_id || '',
        description: `مصروف ${expenseData.category} - ${expenseData.description}`,
        lines: [
          {
            account_code: expenseData.account_code,
            debit_amount: expenseData.amount,
            credit_amount: 0,
            description: expenseData.description
          },
          {
            account_code: this.getBankAccountCode(expenseData.payment_method),
            debit_amount: 0,
            credit_amount: expenseData.amount,
            description: `دفع ${expenseData.payment_method}`
          }
        ]
      };

      return await this.createJournalEntryFromAuto(entry);
    } catch (error) {
      console.error('Error creating expense journal entry:', error);
      throw error;
    }
  },

  // AI Classification Integration
  async classifyAndCreateEntry(transactionData: {
    description: string;
    amount: number;
    transaction_type: string;
    transaction_id: string;
  }): Promise<{ entry: JournalEntry | null; classification: any }> {
    try {
      // Call AI classification function
      const { data: classification, error } = await supabase.functions.invoke(
        'ai-classify-transaction',
        {
          body: transactionData
        }
      );

      if (error) throw error;

      // Create journal entry based on AI classification
      if (classification?.classification?.suggested_account_id) {
        const entry = await this.createJournalEntryFromClassification(
          transactionData,
          classification.classification
        );
        return { entry, classification: classification.classification };
      }

      return { entry: null, classification: classification?.classification };
    } catch (error) {
      console.error('Error in AI classification:', error);
      throw error;
    }
  },

  // Real-time Integration Hooks
  async setupRealTimeListeners(): Promise<void> {
    // Listen for contract status changes
    supabase
      .channel('contract-changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'contracts' },
        async (payload) => {
          const { new: newContract, old: oldContract } = payload;
          
          if (oldContract.status !== newContract.status && newContract.status === 'active') {
            await this.createContractJournalEntry(newContract.id);
          }
        }
      )
      .subscribe();

    // Listen for payment completions
    supabase
      .channel('payment-changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments' },
        async (payload) => {
          const payment = payload.new;
          if (payment.status === 'completed') {
            await this.createPaymentJournalEntry(payment.id);
          }
        }
      )
      .subscribe();

    // Listen for invoice status changes
    supabase
      .channel('invoice-changes')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'invoices' },
        async (payload) => {
          const { new: newInvoice, old: oldInvoice } = payload;
          
          if (oldInvoice.status !== newInvoice.status && newInvoice.status === 'sent') {
            // Auto-create accounting entry when invoice is sent
            await this.createInvoiceJournalEntry(newInvoice.id);
          }
        }
      )
      .subscribe();
  },

  // Smart Dashboard Integration
  async getIntegratedDashboardData(): Promise<{
    financial_summary: any;
    recent_transactions: any[];
    alerts: any[];
    kpis: any[];
  }> {
    try {
      const [
        contractStats,
        invoiceStats,
        paymentStats,
        recentJournalEntries,
        trialBalance
      ] = await Promise.all([
        contractService.getContractStats(),
        invoiceService.getInvoiceStats(),
        paymentService.getPaymentStats(),
        accountingService.getJournalEntries(),
        accountingService.getTrialBalance()
      ]);

      const financial_summary = {
        total_revenue: contractStats.monthlyRevenue,
        outstanding_receivables: invoiceStats.outstandingRevenue,
        cash_received: paymentStats.monthlyAmount,
        net_income: contractStats.monthlyRevenue - invoiceStats.outstandingRevenue
      };

      const recent_transactions = recentJournalEntries
        .slice(0, 10)
        .map(entry => ({
          id: entry.id,
          date: entry.entry_date,
          description: entry.description,
          amount: entry.total_debit,
          type: entry.reference_type || 'manual',
          status: entry.status
        }));

      const alerts = await this.generateSmartAlerts(financial_summary, invoiceStats);
      const kpis = await this.calculateIntegratedKPIs(financial_summary, contractStats);

      return {
        financial_summary,
        recent_transactions,
        alerts,
        kpis
      };
    } catch (error) {
      console.error('Error getting integrated dashboard data:', error);
      throw error;
    }
  },

  // Financial Analytics Integration
  async generateFinancialForecast(
    forecast_type: 'revenue' | 'expense' | 'cash_flow',
    periods_ahead: number = 3
  ): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'ai-financial-forecast',
        {
          body: {
            forecast_type,
            period_type: 'monthly',
            periods_ahead
          }
        }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating financial forecast:', error);
      throw error;
    }
  },

  // Automated Reconciliation
  async reconcileBankTransactions(bankAccountId: string): Promise<{
    matched: any[];
    unmatched: any[];
    suggestions: any[];
  }> {
    try {
      // Get bank transactions
      const { data: bankTransactions, error: bankError } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('bank_account_id', bankAccountId)
        .eq('status', 'pending');

      if (bankError) throw bankError;

      // Get journal entries
      const journalEntries = await accountingService.getJournalEntries();

      const matched: any[] = [];
      const unmatched: any[] = [];
      const suggestions: any[] = [];

      // Simple matching logic (can be enhanced with AI)
      for (const transaction of bankTransactions || []) {
        const matchingEntries = journalEntries.filter(entry => 
          Math.abs(entry.total_debit - transaction.debit_amount) < 0.01 ||
          Math.abs(entry.total_credit - transaction.credit_amount) < 0.01
        );

        if (matchingEntries.length > 0) {
          matched.push({
            bank_transaction: transaction,
            journal_entries: matchingEntries
          });
        } else {
          unmatched.push(transaction);
          
          // Generate AI suggestions for unmatched transactions
          suggestions.push({
            transaction,
            suggested_classification: await this.suggestTransactionClassification(transaction)
          });
        }
      }

      return { matched, unmatched, suggestions };
    } catch (error) {
      console.error('Error reconciling bank transactions:', error);
      throw error;
    }
  },

  // Helper Methods
  getBankAccountCode(paymentMethod: string): string {
    const accountCodes: { [key: string]: string } = {
      'cash': '1101', // النقدية
      'bank_transfer': '1201', // البنك
      'check': '1201', // البنك
      'credit_card': '1202', // بطاقات ائتمان
      'online': '1201' // البنك
    };
    return accountCodes[paymentMethod] || '1201';
  },

  async createJournalEntryFromAuto(autoEntry: AutoAccountingEntry): Promise<JournalEntry> {
    // Get account IDs from codes
    const accounts = await accountingService.getChartOfAccounts();
    const accountMap = accounts.reduce((map, acc) => {
      map[acc.account_code] = acc.id;
      return map;
    }, {} as { [key: string]: string });

    // Create journal entry
    const entry = await accountingService.createJournalEntry({
      entry_date: new Date().toISOString().split('T')[0],
      reference_type: autoEntry.reference_type,
      reference_id: autoEntry.reference_id,
      description: autoEntry.description,
      total_debit: autoEntry.lines.reduce((sum, line) => sum + line.debit_amount, 0),
      total_credit: autoEntry.lines.reduce((sum, line) => sum + line.credit_amount, 0),
      status: 'draft'
    });

    // Create journal entry lines
    for (let i = 0; i < autoEntry.lines.length; i++) {
      const line = autoEntry.lines[i];
      const accountId = accountMap[line.account_code];
      
      if (accountId) {
        await accountingService.createJournalEntryLine({
          journal_entry_id: entry.id,
          account_id: accountId,
          description: line.description || autoEntry.description,
          debit_amount: line.debit_amount,
          credit_amount: line.credit_amount,
          line_number: i + 1
        });
      }
    }

    return entry;
  },

  async createJournalEntryFromClassification(
    transactionData: any,
    classification: any
  ): Promise<JournalEntry | null> {
    try {
      const entry = await accountingService.createJournalEntry({
        entry_date: new Date().toISOString().split('T')[0],
        reference_type: 'manual',
        reference_id: transactionData.transaction_id,
        description: `${transactionData.description} (مصنف بالذكاء الاصطناعي)`,
        total_debit: transactionData.amount,
        total_credit: transactionData.amount,
        status: 'draft'
      });

      // Create lines based on AI classification
      await accountingService.createJournalEntryLine({
        journal_entry_id: entry.id,
        account_id: classification.suggested_account_id,
        description: transactionData.description,
        debit_amount: transactionData.transaction_type === 'expense' ? transactionData.amount : 0,
        credit_amount: transactionData.transaction_type === 'revenue' ? transactionData.amount : 0,
        line_number: 1
      });

      return entry;
    } catch (error) {
      console.error('Error creating journal entry from classification:', error);
      return null;
    }
  },

  async createInvoiceJournalEntry(invoiceId: string): Promise<JournalEntry | null> {
    try {
      const invoice = await invoiceService.getInvoiceById(invoiceId);
      if (!invoice) return null;

      const entry: AutoAccountingEntry = {
        reference_type: 'invoice',
        reference_id: invoiceId,
        description: `قيد فاتورة ${invoice.invoice_number}`,
        lines: [
          {
            account_code: '1301', // حسابات العملاء
            debit_amount: invoice.total_amount,
            credit_amount: 0,
            description: `فاتورة ${invoice.invoice_number}`
          },
          {
            account_code: '4101', // إيرادات الإيجار
            debit_amount: 0,
            credit_amount: invoice.subtotal,
            description: 'إيراد خدمات'
          }
        ]
      };

      if (invoice.tax_amount > 0) {
        entry.lines.push({
          account_code: '2301',
          debit_amount: 0,
          credit_amount: invoice.tax_amount,
          description: 'ضريبة القيمة المضافة'
        });
      }

      return await this.createJournalEntryFromAuto(entry);
    } catch (error) {
      console.error('Error creating invoice journal entry:', error);
      return null;
    }
  },

  async generateSmartAlerts(financialSummary: any, invoiceStats: any): Promise<any[]> {
    const alerts = [];

    // Cash flow alert
    if (financialSummary.cash_received < financialSummary.total_revenue * 0.7) {
      alerts.push({
        type: 'warning',
        title: 'تحذير التدفق النقدي',
        message: 'المبالغ المحصلة أقل من 70% من الإيرادات المتوقعة',
        priority: 'high'
      });
    }

    // Outstanding receivables alert
    if (invoiceStats.outstandingRevenue > financialSummary.total_revenue * 0.3) {
      alerts.push({
        type: 'warning',
        title: 'مستحقات عالية',
        message: 'المستحقات تتجاوز 30% من إجمالي الإيرادات',
        priority: 'medium'
      });
    }

    return alerts;
  },

  async calculateIntegratedKPIs(financialSummary: any, contractStats: any): Promise<any[]> {
    return [
      {
        name: 'معدل التحصيل',
        value: (financialSummary.cash_received / financialSummary.total_revenue * 100).toFixed(1),
        unit: '%',
        trend: 'up'
      },
      {
        name: 'متوسط قيمة العقد',
        value: (financialSummary.total_revenue / contractStats.total).toFixed(0),
        unit: 'د.ك',
        trend: 'up'
      },
      {
        name: 'هامش الربح الصافي',
        value: (financialSummary.net_income / financialSummary.total_revenue * 100).toFixed(1),
        unit: '%',
        trend: 'stable'
      }
    ];
  },

  async suggestTransactionClassification(transaction: any): Promise<any> {
    // This could call AI classification service
    return {
      suggested_category: 'expense',
      suggested_account: '5101',
      confidence: 0.8
    };
  }
};