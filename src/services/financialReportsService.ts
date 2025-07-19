import { supabase } from "@/integrations/supabase/client";
import { accountingService } from "./accountingService";

export interface FinancialReport {
  id: string;
  tenant_id: string;
  report_name: string;
  report_type: 'trial_balance' | 'income_statement' | 'balance_sheet' | 'cash_flow' | 'custom';
  report_parameters: Record<string, any>;
  report_data?: Record<string, any>;
  generated_by?: string;
  generated_at: string;
  is_scheduled: boolean;
  schedule_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  next_generation_date?: string;
  report_format: 'json' | 'pdf' | 'excel';
  created_at: string;
}

export interface CreateReportData {
  report_name: string;
  report_type: FinancialReport['report_type'];
  report_parameters: Record<string, any>;
  is_scheduled?: boolean;
  schedule_frequency?: FinancialReport['schedule_frequency'];
  report_format?: FinancialReport['report_format'];
}

export const financialReportsService = {
  async createReport(data: CreateReportData): Promise<FinancialReport> {
    const tenantId = await accountingService.getCurrentTenantId();
    
    const { data: report, error } = await supabase
      .from('financial_reports')
      .insert({
        tenant_id: tenantId,
        report_name: data.report_name,
        report_type: data.report_type,
        report_parameters: data.report_parameters,
        is_scheduled: data.is_scheduled || false,
        schedule_frequency: data.schedule_frequency,
        report_format: data.report_format || 'json'
      })
      .select()
      .single();

    if (error) throw error;
    return report as FinancialReport;
  },

  async getReports(): Promise<FinancialReport[]> {
    const { data, error } = await supabase
      .from('financial_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as FinancialReport[];
  },

  async getReportsByType(reportType: string): Promise<FinancialReport[]> {
    const { data, error } = await supabase
      .from('financial_reports')
      .select('*')
      .eq('report_type', reportType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as FinancialReport[];
  },

  async generateTrialBalance(parameters: {
    startDate?: string;
    endDate?: string;
    includeZeroBalances?: boolean;
  }): Promise<any> {
    const tenantId = await accountingService.getCurrentTenantId();
    
    let query = supabase
      .from('chart_of_accounts')
      .select('account_code, account_name, current_balance, account_type')
      .eq('tenant_id', tenantId)
      .eq('allow_posting', true);

    if (!parameters.includeZeroBalances) {
      query = query.neq('current_balance', 0);
    }

    const { data, error } = await query.order('account_code');

    if (error) throw error;

    const trialBalance = (data || []).map(account => ({
      account_code: account.account_code,
      account_name: account.account_name,
      debit_balance: ['asset', 'expense'].includes(account.account_type) && account.current_balance > 0 
        ? account.current_balance : 0,
      credit_balance: ['liability', 'equity', 'revenue'].includes(account.account_type) && account.current_balance > 0 
        ? account.current_balance : 0
    }));

    const totals = trialBalance.reduce((acc, item) => ({
      total_debits: acc.total_debits + item.debit_balance,
      total_credits: acc.total_credits + item.credit_balance
    }), { total_debits: 0, total_credits: 0 });

    return {
      items: trialBalance,
      totals,
      generated_at: new Date().toISOString(),
      parameters
    };
  },

  async generateIncomeStatement(parameters: {
    startDate: string;
    endDate: string;
  }): Promise<any> {
    const tenantId = await accountingService.getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('account_type, account_category, current_balance, account_name, account_code')
      .eq('tenant_id', tenantId)
      .in('account_type', ['revenue', 'expense'])
      .order('account_code');

    if (error) throw error;

    const accounts = data || [];
    
    const revenues = accounts.filter(a => a.account_type === 'revenue');
    const expenses = accounts.filter(a => a.account_type === 'expense');

    const operating_revenue = revenues
      .filter(a => a.account_category === 'operating_revenue')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const other_revenue = revenues
      .filter(a => a.account_category === 'other_revenue')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const operating_expense = expenses
      .filter(a => a.account_category === 'operating_expense')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const other_expense = expenses
      .filter(a => a.account_category === 'other_expense')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const total_revenue = operating_revenue + other_revenue;
    const total_expense = operating_expense + other_expense;

    return {
      revenue: {
        operating_revenue,
        other_revenue,
        total_revenue,
        details: revenues
      },
      expenses: {
        operating_expense,
        other_expense,
        total_expense,
        details: expenses
      },
      net_income: total_revenue - total_expense,
      generated_at: new Date().toISOString(),
      parameters
    };
  },

  async generateBalanceSheet(parameters: {
    asOfDate: string;
  }): Promise<any> {
    const tenantId = await accountingService.getCurrentTenantId();
    
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('account_type, account_category, current_balance, account_name, account_code')
      .eq('tenant_id', tenantId)
      .in('account_type', ['asset', 'liability', 'equity'])
      .order('account_code');

    if (error) throw error;

    const accounts = data || [];
    
    const assets = accounts.filter(a => a.account_type === 'asset');
    const liabilities = accounts.filter(a => a.account_type === 'liability');
    const equity = accounts.filter(a => a.account_type === 'equity');

    const current_assets = assets
      .filter(a => a.account_category === 'current_asset')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const non_current_assets = assets
      .filter(a => a.account_category === 'non_current_asset')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const current_liabilities = liabilities
      .filter(a => a.account_category === 'current_liability')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const non_current_liabilities = liabilities
      .filter(a => a.account_category === 'non_current_liability')
      .reduce((sum, a) => sum + a.current_balance, 0);
    
    const total_equity = equity.reduce((sum, a) => sum + a.current_balance, 0);
    
    const total_assets = current_assets + non_current_assets;
    const total_liabilities = current_liabilities + non_current_liabilities;

    return {
      assets: {
        current_assets,
        non_current_assets,
        total_assets,
        details: assets
      },
      liabilities: {
        current_liabilities,
        non_current_liabilities,
        total_liabilities,
        details: liabilities
      },
      equity: {
        total_equity,
        details: equity
      },
      total_liabilities_and_equity: total_liabilities + total_equity,
      generated_at: new Date().toISOString(),
      parameters
    };
  },

  async saveReport(reportId: string, reportData: any): Promise<void> {
    const { error } = await supabase
      .from('financial_reports')
      .update({
        report_data: reportData,
        generated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) throw error;
  },

  async deleteReport(id: string): Promise<void> {
    const { error } = await supabase
      .from('financial_reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};