import { supabase } from '@/integrations/supabase/client';
import {
  CustomerSubsidiaryLedger,
  CustomerStatement,
  CustomerAgingAnalysis,
  CustomerTransactionLog,
  CustomerTrackingSettings,
  CustomerStatementFormData,
  AgingAnalysisFormData,
  CustomerLedgerFormData,
  CustomerTrackingStats,
  CustomerWithBalance,
  CustomerTrackingFilters
} from '@/types/customerTracking';

export class CustomerTrackingService {
  
  // ==== إدارة سجلات العملاء التفصيلية ====
  
  async getCustomerSubsidiaryLedger(filters: CustomerLedgerFormData): Promise<CustomerSubsidiaryLedger[]> {
    let query = supabase
      .from('customer_subsidiary_ledger')
      .select(`
        *,
        customers!customer_id (
          name,
          customer_type
        )
      `)
      .eq('customer_id', filters.customer_id)
      .order('transaction_date', { ascending: false });

    if (filters.from_date) {
      query = query.gte('transaction_date', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('transaction_date', filters.to_date);
    }

    if (filters.reference_type && filters.reference_type !== 'all') {
      query = query.eq('reference_type', filters.reference_type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      reference_type: item.reference_type as 'invoice' | 'payment' | 'adjustment' | 'refund'
    }));
  }

  async createCustomerLedgerEntry(entry: Omit<CustomerSubsidiaryLedger, 'id' | 'created_at' | 'running_balance'>): Promise<CustomerSubsidiaryLedger> {
    const { data, error } = await supabase
      .from('customer_subsidiary_ledger')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      reference_type: data.reference_type as 'invoice' | 'payment' | 'adjustment' | 'refund'
    };
  }

  // ==== إدارة كشوف حسابات العملاء ====
  
  async generateCustomerStatement(formData: CustomerStatementFormData): Promise<CustomerStatement> {
    // جلب معاملات العميل للفترة المحددة
    const { data: transactions, error: transactionsError } = await supabase
      .from('customer_subsidiary_ledger')
      .select('*')
      .eq('customer_id', formData.customer_id)
      .gte('transaction_date', formData.from_date)
      .lte('transaction_date', formData.to_date)
      .order('transaction_date', { ascending: true });

    if (transactionsError) throw transactionsError;

    // حساب الرصيد الافتتاحي
    const { data: openingBalanceData, error: openingError } = await supabase
      .from('customer_subsidiary_ledger')
      .select('running_balance')
      .eq('customer_id', formData.customer_id)
      .lt('transaction_date', formData.from_date)
      .order('transaction_date', { ascending: false })
      .limit(1);

    if (openingError) throw openingError;

    const opening_balance = openingBalanceData?.[0]?.running_balance || 0;
    const total_debits = transactions?.reduce((sum, t) => sum + (t.debit_amount || 0), 0) || 0;
    const total_credits = transactions?.reduce((sum, t) => sum + (t.credit_amount || 0), 0) || 0;
    const closing_balance = opening_balance + total_debits - total_credits;

    // إنشاء كشف الحساب
    const statementData = {
      customer_id: formData.customer_id,
      tenant_id: 'default-tenant', // temporary - should be from context
      statement_date: new Date().toISOString().split('T')[0],
      from_date: formData.from_date,
      to_date: formData.to_date,
      opening_balance,
      closing_balance,
      total_debits,
      total_credits,
      statement_data: JSON.stringify({
        transactions: transactions || [],
        generation_options: formData
      }),
      status: 'generated' as const
    };

    const { data, error } = await supabase
      .from('customer_statements')
      .insert(statementData)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      status: data.status as 'generated' | 'sent' | 'viewed'
    };
  }

  async getCustomerStatements(customer_id?: string): Promise<CustomerStatement[]> {
    let query = supabase
      .from('customer_statements')
      .select(`
        *,
        customers!customer_id (
          name,
          customer_type
        )
      `)
      .order('statement_date', { ascending: false });

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      status: item.status as 'generated' | 'sent' | 'viewed'
    }));
  }

  // ==== تحليل أعمار الديون ====
  
  async generateAgingAnalysis(formData: AgingAnalysisFormData): Promise<CustomerAgingAnalysis[]> {
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, customer_type');

    if (customersError) throw customersError;

    const customerIds = formData.customer_ids || customers?.map(c => c.id) || [];
    const analyses: CustomerAgingAnalysis[] = [];

    for (const customerId of customerIds) {
      // استخدام الدالة المخصصة لحساب أعمار الديون
      const { data: agingData, error: agingError } = await supabase
        .rpc('calculate_customer_aging', {
          customer_id_param: customerId,
          analysis_date_param: formData.analysis_date
        });

      if (agingError) {
        console.error('خطأ في حساب تحليل أعمار الديون:', agingError);
        continue;
      }

      // التعامل مع نوع Json
      const agingResult = agingData as any;

      // تخطي العملاء بدون أرصدة إذا لم يتم تضمينهم
      if (!formData.include_zero_balances && (agingResult?.total_outstanding || 0) === 0) {
        continue;
      }

      const analysisEntry = {
        customer_id: customerId,
        tenant_id: 'default-tenant', // temporary - should be from context
        analysis_date: formData.analysis_date,
        current_amount: agingResult?.current_amount || 0,
        days_30_60: agingResult?.days_30_60 || 0,
        days_61_90: agingResult?.days_61_90 || 0,
        days_91_120: agingResult?.days_91_120 || 0,
        over_120_days: agingResult?.over_120_days || 0,
        total_outstanding: agingResult?.total_outstanding || 0,
        oldest_invoice_date: agingResult?.oldest_invoice_date
      };

      const { data: savedAnalysis, error: saveError } = await supabase
        .from('customer_aging_analysis')
        .insert(analysisEntry)
        .select()
        .single();

      if (saveError) throw saveError;
      analyses.push(savedAnalysis);
    }

    return analyses;
  }

  async getCustomerAgingAnalysis(analysis_date?: string): Promise<CustomerAgingAnalysis[]> {
    let query = supabase
      .from('customer_aging_analysis')
      .select(`
        *,
        customers!customer_id (
          name,
          customer_type
        )
      `)
      .order('total_outstanding', { ascending: false });

    if (analysis_date) {
      query = query.eq('analysis_date', analysis_date);
    } else {
      // الحصول على أحدث تحليل لكل عميل
      const { data: latestDates, error: datesError } = await supabase
        .from('customer_aging_analysis')
        .select('customer_id, analysis_date')
        .order('analysis_date', { ascending: false });

      if (datesError) throw datesError;

      const latestDateByCustomer = latestDates?.reduce((acc, item) => {
        if (!acc[item.customer_id] || item.analysis_date > acc[item.customer_id]) {
          acc[item.customer_id] = item.analysis_date;
        }
        return acc;
      }, {} as Record<string, string>);

      if (latestDateByCustomer) {
        const conditions = Object.entries(latestDateByCustomer).map(([customerId, date]) => 
          `(customer_id.eq.${customerId},analysis_date.eq.${date})`
        );
        
        if (conditions.length > 0) {
          query = query.or(conditions.join(','));
        }
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // ==== سجل معاملات العملاء ====
  
  async getCustomerTransactionLog(customer_id: string, limit = 50): Promise<CustomerTransactionLog[]> {
    const { data, error } = await supabase
      .from('customer_transaction_log')
      .select('*')
      .eq('customer_id', customer_id)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      transaction_type: item.transaction_type as 'adjustment' | 'invoice_created' | 'payment_received' | 'credit_applied' | 'debit_entry' | 'credit_entry',
      reference_type: item.reference_type as 'invoice' | 'payment' | 'adjustment' | 'credit_note'
    }));
  }

  // ==== إحصائيات تتبع العملاء ====
  
  async getCustomerTrackingStats(): Promise<CustomerTrackingStats> {
    // إجمالي العملاء مع أرصدة
    const { data: customersWithBalance, error: balanceError } = await supabase
      .from('customer_subsidiary_ledger')
      .select('customer_id, debit_amount, credit_amount')
      .order('customer_id');

    if (balanceError) throw balanceError;

    // حساب الأرصدة لكل عميل
    const customerBalances = customersWithBalance?.reduce((acc, transaction) => {
      if (!acc[transaction.customer_id]) {
        acc[transaction.customer_id] = 0;
      }
      acc[transaction.customer_id] += (transaction.debit_amount || 0) - (transaction.credit_amount || 0);
      return acc;
    }, {} as Record<string, number>) || {};

    const customersWithPositiveBalance = Object.values(customerBalances).filter(balance => balance > 0);
    const totalOutstanding = customersWithPositiveBalance.reduce((sum, balance) => sum + balance, 0);

    // الحصول على أحدث تحليل أعمار الديون
    const { data: agingData, error: agingError } = await supabase
      .from('customer_aging_analysis')
      .select('*')
      .order('analysis_date', { ascending: false })
      .limit(100);

    if (agingError) throw agingError;

    const currentPeriodAmount = agingData?.reduce((sum, analysis) => sum + (analysis.current_amount || 0), 0) || 0;
    const overdueAmount = agingData?.reduce((sum, analysis) => 
      sum + (analysis.days_30_60 || 0) + (analysis.days_61_90 || 0) + (analysis.days_91_120 || 0) + (analysis.over_120_days || 0), 0) || 0;
    
    const criticalCustomers = agingData?.filter(analysis => (analysis.over_120_days || 0) > 0).length || 0;

    // العميل الأكثر تأخيراً
    let mostOverdueCustomer = null;
    if (agingData && agingData.length > 0) {
      const mostOverdue = agingData.reduce((max, current) => 
        (current.over_120_days || 0) > (max.over_120_days || 0) ? current : max
      );

      if ((mostOverdue.over_120_days || 0) > 0) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('name')
          .eq('id', mostOverdue.customer_id)
          .single();

        mostOverdueCustomer = {
          customer_id: mostOverdue.customer_id,
          customer_name: customerData?.name || 'غير معروف',
          amount: mostOverdue.over_120_days || 0,
          days_overdue: mostOverdue.oldest_invoice_date ? 
            Math.floor((new Date().getTime() - new Date(mostOverdue.oldest_invoice_date).getTime()) / (1000 * 60 * 60 * 24)) : 0
        };
      }
    }

    return {
      total_customers_with_balance: customersWithPositiveBalance.length,
      total_outstanding: totalOutstanding,
      current_period_amount: currentPeriodAmount,
      overdue_amount: overdueAmount,
      critical_customers: criticalCustomers,
      avg_days_outstanding: 0, // يحتاج حساب معقد
      largest_outstanding_amount: Math.max(...customersWithPositiveBalance, 0),
      most_overdue_customer: mostOverdueCustomer
    };
  }

  // ==== العملاء مع الأرصدة ====
  
  async getCustomersWithBalance(filters?: CustomerTrackingFilters): Promise<CustomerWithBalance[]> {
    let query = supabase
      .from('customers')
      .select(`
        id,
        name,
        customer_type,
        customer_subsidiary_ledger!customer_id (
          debit_amount,
          credit_amount,
          transaction_date
        )
      `);

    if (filters?.customer_type) {
      query = query.eq('customer_type', filters.customer_type);
    }

    const { data: customers, error } = await query;
    if (error) throw error;

    const customersWithBalance: CustomerWithBalance[] = [];

    for (const customer of customers || []) {
      const transactions = customer.customer_subsidiary_ledger || [];
      const currentBalance = transactions.reduce((sum: number, t: any) => 
        sum + (t.debit_amount || 0) - (t.credit_amount || 0), 0);

      // تطبيق فلاتر الرصيد
      if (filters?.balance_status) {
        if (filters.balance_status === 'with_balance' && currentBalance === 0) continue;
        if (filters.balance_status === 'overdue' && currentBalance <= 0) continue;
        if (filters.balance_status === 'credit' && currentBalance >= 0) continue;
      }

      // تطبيق فلاتر المبلغ
      if (filters?.amount_range) {
        if (Math.abs(currentBalance) < filters.amount_range.min_amount || 
            Math.abs(currentBalance) > filters.amount_range.max_amount) continue;
      }

      const lastTransactionDate = transactions.length > 0 ? 
        Math.max(...transactions.map((t: any) => new Date(t.transaction_date).getTime())) : null;

      const daysOutstanding = lastTransactionDate ? 
        Math.floor((new Date().getTime() - lastTransactionDate) / (1000 * 60 * 60 * 24)) : 0;

      customersWithBalance.push({
        id: customer.id,
        name: customer.name,
        customer_type: customer.customer_type,
        current_balance: currentBalance,
        last_transaction_date: lastTransactionDate ? new Date(lastTransactionDate).toISOString().split('T')[0] : undefined,
        overdue_amount: currentBalance > 0 && daysOutstanding > 30 ? currentBalance : 0,
        days_outstanding: daysOutstanding,
        credit_limit: undefined, // يحتاج إضافة للجدول
        payment_terms: undefined // يحتاج إضافة للجدول
      });
    }

    return customersWithBalance;
  }

  // ==== إعدادات تتبع العملاء ====
  
  async getCustomerTrackingSettings(): Promise<CustomerTrackingSettings | null> {
    const { data, error } = await supabase
      .from('customer_tracking_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? {
      ...data,
      statement_frequency: data.statement_frequency as 'weekly' | 'monthly' | 'quarterly',
      aging_analysis_frequency: data.aging_analysis_frequency as 'weekly' | 'monthly',
      aging_thresholds: data.aging_thresholds as any || { current: 30, warning: 60, overdue: 90, critical: 120 }
    } : null;
  }

  async updateCustomerTrackingSettings(settings: Partial<CustomerTrackingSettings>): Promise<CustomerTrackingSettings> {
    const existingSettings = await this.getCustomerTrackingSettings();

    if (existingSettings) {
      const { data, error } = await supabase
        .from('customer_tracking_settings')
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        statement_frequency: data.statement_frequency as 'weekly' | 'monthly' | 'quarterly',
        aging_analysis_frequency: data.aging_analysis_frequency as 'weekly' | 'monthly',
        aging_thresholds: data.aging_thresholds as any || { current: 30, warning: 60, overdue: 90, critical: 120 }
      };
    } else {
      const newSettings = {
        tenant_id: 'default-tenant', // temporary - should be from context
        auto_generate_statements: true,
        statement_frequency: 'monthly',
        aging_analysis_frequency: 'weekly',
        credit_limit_alerts: true,
        overdue_payment_alerts: true,
        aging_thresholds: { current: 30, warning: 60, overdue: 90, critical: 120 },
        auto_send_statements: false,
        ...settings
      };

      const { data, error } = await supabase
        .from('customer_tracking_settings')
        .insert(newSettings)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        statement_frequency: data.statement_frequency as 'weekly' | 'monthly' | 'quarterly',
        aging_analysis_frequency: data.aging_analysis_frequency as 'weekly' | 'monthly',
        aging_thresholds: data.aging_thresholds as any || { current: 30, warning: 60, overdue: 90, critical: 120 }
      };
    }
  }
}

export const customerTrackingService = new CustomerTrackingService();