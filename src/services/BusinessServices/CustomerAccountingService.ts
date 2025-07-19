import { supabase } from '@/integrations/supabase/client';

/**
 * خدمة محاسبة العملاء المتطورة
 * تدير جميع العمليات المحاسبية المتعلقة بالعملاء بطريقة شاملة ومتكاملة
 */
export class CustomerAccountingService {

  /**
   * الحصول على رصيد العميل الحالي
   */
  async getCustomerBalance(customerId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_customer_current_balance', {
        customer_id_param: customerId
      });

      if (error) {
        console.error('❌ Failed to get customer balance:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('❌ Error getting customer balance:', error);
      return 0;
    }
  }

  /**
   * الحصول على ملخص محاسبة العميل
   */
  async getCustomerAccountingSummary(customerId?: string, dateFrom?: string, dateTo?: string) {
    try {
      const { data, error } = await supabase.rpc('get_customer_accounting_summary', {
        customer_id_param: customerId,
        date_from: dateFrom,
        date_to: dateTo
      });

      if (error) {
        console.error('❌ Failed to get customer accounting summary:', error);
        throw error;
      }

      return data || {
        total_debits: 0,
        total_credits: 0,
        net_balance: 0,
        transaction_count: 0,
        last_transaction_date: null
      };
    } catch (error) {
      console.error('❌ Error getting customer accounting summary:', error);
      throw error;
    }
  }

  /**
   * الحصول على دفتر الأستاذ المساعد للعميل
   */
  async getCustomerSubsidiaryLedger(customerId: string, filters?: {
    dateFrom?: string;
    dateTo?: string;
    referenceType?: string;
  }) {
    try {
      let query = supabase
        .from('customer_subsidiary_ledger')
        .select(`
          *,
          customers!customer_id (
            name,
            customer_type
          )
        `)
        .eq('customer_id', customerId)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.dateFrom) {
        query = query.gte('transaction_date', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('transaction_date', filters.dateTo);
      }

      if (filters?.referenceType) {
        query = query.eq('reference_type', filters.referenceType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Failed to get customer subsidiary ledger:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error getting customer subsidiary ledger:', error);
      throw error;
    }
  }

  /**
   * إنشاء سجل في دفتر الأستاذ المساعد للعميل
   */
  async createCustomerLedgerEntry(entry: {
    customer_id: string;
    transaction_date: string;
    reference_id: string;
    reference_type: 'contract' | 'invoice' | 'payment' | 'adjustment' | 'refund';
    debit_amount?: number;
    credit_amount?: number;
    description: string;
    invoice_number?: string;
  }) {
    try {
      // الحصول على معرف المؤسسة
      const { data: { user } } = await supabase.auth.getUser();
      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user?.id)
        .single();

      const { data, error } = await supabase
        .from('customer_subsidiary_ledger')
        .insert({
          customer_id: entry.customer_id,
          transaction_date: entry.transaction_date,
          reference_id: entry.reference_id,
          reference_type: entry.reference_type,
          debit_amount: entry.debit_amount || 0,
          credit_amount: entry.credit_amount || 0,
          description: entry.description,
          invoice_number: entry.invoice_number || '',
          journal_entry_id: '', // سيتم تحديثه لاحقاً
          tenant_id: tenantUser?.tenant_id || '',
          created_by: user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create customer ledger entry:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error creating customer ledger entry:', error);
      throw error;
    }
  }

  /**
   * تحليل أعمار الديون للعميل
   */
  async getCustomerAgingAnalysis(customerId: string, analysisDate?: string) {
    try {
      const { data, error } = await supabase.rpc('calculate_customer_aging', {
        customer_id_param: customerId,
        analysis_date_param: analysisDate || new Date().toISOString().split('T')[0]
      });

      if (error) {
        console.error('❌ Failed to get customer aging analysis:', error);
        throw error;
      }

      return data || {
        current_amount: 0,
        days_30_60: 0,
        days_61_90: 0,
        days_91_120: 0,
        over_120_days: 0,
        total_outstanding: 0,
        oldest_invoice_date: null
      };
    } catch (error) {
      console.error('❌ Error getting customer aging analysis:', error);
      throw error;
    }
  }

  /**
   * الحصول على العملاء الذين لديهم أرصدة
   */
  async getCustomersWithBalances(filters?: {
    customerType?: 'individual' | 'company';
    balanceStatus?: 'with_balance' | 'overdue' | 'all';
    minBalance?: number;
    maxBalance?: number;
  }) {
    try {
      let query = supabase
        .from('customers')
        .select(`
          id,
          name,
          customer_type,
          email,
          phone,
          customer_subsidiary_ledger!customer_id (
            debit_amount,
            credit_amount,
            transaction_date
          )
        `);

      if (filters?.customerType) {
        query = query.eq('customer_type', filters.customerType);
      }

      const { data: customers, error } = await query;
      if (error) throw error;

      const customersWithBalance = [];

      for (const customer of customers || []) {
        if (!customer || typeof customer !== 'object') continue;
        
        const transactions = (customer as any).customer_subsidiary_ledger || [];
        const currentBalance = transactions.reduce((sum: number, t: any) => 
          sum + (t.debit_amount || 0) - (t.credit_amount || 0), 0);

        // تطبيق فلاتر الرصيد
        if (filters?.balanceStatus) {
          if (filters.balanceStatus === 'with_balance' && currentBalance === 0) continue;
          if (filters.balanceStatus === 'overdue' && currentBalance <= 0) continue;
        }

        if (filters?.minBalance && currentBalance < filters.minBalance) continue;
        if (filters?.maxBalance && currentBalance > filters.maxBalance) continue;

        customersWithBalance.push({
          ...(customer as any),
          current_balance: currentBalance,
          last_transaction_date: transactions.length > 0 
            ? Math.max(...transactions.map((t: any) => new Date(t.transaction_date).getTime()))
            : null
        });
      }

      return customersWithBalance.sort((a: any, b: any) => b.current_balance - a.current_balance);
    } catch (error) {
      console.error('❌ Error getting customers with balances:', error);
      throw error;
    }
  }

  /**
   * إنشاء كشف حساب للعميل
   */
  async generateCustomerStatement(customerId: string, filters: {
    fromDate: string;
    toDate: string;
    includeZeroBalance?: boolean;
  }) {
    try {
      // جلب بيانات العميل
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (customerError || !customer) {
        throw new Error('العميل غير موجود');
      }

      // جلب معاملات العميل للفترة المحددة
      const transactions = await this.getCustomerSubsidiaryLedger(customerId, {
        dateFrom: filters.fromDate,
        dateTo: filters.toDate
      });

      // حساب الرصيد الافتتاحي
      const { data: openingBalanceData, error: openingError } = await supabase
        .from('customer_subsidiary_ledger')
        .select('running_balance')
        .eq('customer_id', customerId)
        .lt('transaction_date', filters.fromDate)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);

      const openingBalance = openingBalanceData?.[0]?.running_balance || 0;

      // حساب الإجماليات
      const totalDebits = transactions.reduce((sum, t) => sum + (t.debit_amount || 0), 0);
      const totalCredits = transactions.reduce((sum, t) => sum + (t.credit_amount || 0), 0);
      const closingBalance = openingBalance + totalDebits - totalCredits;

      return {
        customer,
        opening_balance: openingBalance,
        transactions,
        total_debits: totalDebits,
        total_credits: totalCredits,
        closing_balance: closingBalance,
        statement_period: {
          from_date: filters.fromDate,
          to_date: filters.toDate
        },
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error generating customer statement:', error);
      throw error;
    }
  }

  /**
   * إنشاء تقرير تحليل أعمار الديون لجميع العملاء
   */
  async generateAgingReport(filters?: {
    customerType?: string;
    analysisDate?: string;
    includeZeroBalance?: boolean;
  }) {
    try {
      const customers = await this.getCustomersWithBalances({
        customerType: filters?.customerType as 'individual' | 'company' | undefined,
        balanceStatus: filters?.includeZeroBalance ? 'all' : 'with_balance'
      });

      const agingResults = [];

      for (const customer of customers) {
        if (!filters?.includeZeroBalance && customer.current_balance === 0) continue;

        const agingData = await this.getCustomerAgingAnalysis(
          customer.id, 
          filters?.analysisDate
        );

        agingResults.push({
          customer_id: customer.id,
          customer_name: customer.name,
          customer_type: customer.customer_type,
          contact_phone: customer.contact_phone,
          current_balance: customer.current_balance,
          aging_analysis: agingData
        });
      }

      // حساب الإجماليات
      const totals = agingResults.reduce((acc, item) => ({
        current_amount: acc.current_amount + (item.aging_analysis.current_amount || 0),
        days_30_60: acc.days_30_60 + (item.aging_analysis.days_30_60 || 0),
        days_61_90: acc.days_61_90 + (item.aging_analysis.days_61_90 || 0),
        days_91_120: acc.days_91_120 + (item.aging_analysis.days_91_120 || 0),
        over_120_days: acc.over_120_days + (item.aging_analysis.over_120_days || 0),
        total_outstanding: acc.total_outstanding + (item.aging_analysis.total_outstanding || 0)
      }), {
        current_amount: 0,
        days_30_60: 0,
        days_61_90: 0,
        days_91_120: 0,
        over_120_days: 0,
        total_outstanding: 0
      });

      return {
        customers: agingResults,
        totals,
        analysis_date: filters?.analysisDate || new Date().toISOString().split('T')[0],
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error generating aging report:', error);
      throw error;
    }
  }

  /**
   * إحصائيات محاسبة العملاء
   */
  async getCustomerAccountingStats() {
    try {
      // عدد العملاء الإجمالي
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // العملاء الذين لديهم أرصدة
      const customersWithBalances = await this.getCustomersWithBalances({
        balanceStatus: 'with_balance'
      });

      // إجمالي المديونيات
      const totalReceivables = customersWithBalances.reduce(
        (sum, customer) => sum + Math.max(0, customer.current_balance), 0
      );

      // إجمالي الأرصدة الدائنة
      const totalCredits = customersWithBalances.reduce(
        (sum, customer) => sum + Math.abs(Math.min(0, customer.current_balance)), 0
      );

      // العملاء المتأخرون (أكثر من 30 يوم)
      let overdueCustomers = 0;
      for (const customer of customersWithBalances) {
        if (customer.current_balance > 0) {
          const aging = await this.getCustomerAgingAnalysis(customer.id);
          const agingData = aging as any;
          if (agingData && (
            (agingData.days_30_60 || 0) + 
            (agingData.days_61_90 || 0) + 
            (agingData.days_91_120 || 0) + 
            (agingData.over_120_days || 0)) > 0) {
            overdueCustomers++;
          }
        }
      }

      return {
        total_customers: totalCustomers || 0,
        customers_with_balances: customersWithBalances.length,
        total_receivables: totalReceivables,
        total_credits: totalCredits,
        net_receivables: totalReceivables - totalCredits,
        overdue_customers: overdueCustomers,
        calculated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting customer accounting stats:', error);
      throw error;
    }
  }
}

// تصدير مثيل واحد للاستخدام في جميع أنحاء التطبيق
export const customerAccountingService = new CustomerAccountingService();