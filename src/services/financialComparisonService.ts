import { supabase } from "@/integrations/supabase/client";

export interface FinancialComparison {
  id: string;
  tenant_id: string;
  comparison_name: string;
  base_period_start: string;
  base_period_end: string;
  comparison_period_start: string;
  comparison_period_end: string;
  comparison_data: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ComparisonPeriod {
  start_date: string;
  end_date: string;
  data: {
    revenue: number;
    expenses: number;
    assets: number;
    liabilities: number;
  };
}

export interface VarianceData {
  base_period: ComparisonPeriod;
  comparison_period: ComparisonPeriod;
  variance: {
    revenue: number;
    expenses: number;
    assets: number;
    liabilities: number;
  };
}

export interface SavedFinancialReport {
  id: string;
  tenant_id: string;
  report_name: string;
  report_type: string;
  report_data: any;
  parameters: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ExportHistory {
  id: string;
  tenant_id: string;
  report_id?: string;
  report_type: string;
  export_format: string;
  file_path?: string;
  file_size?: number;
  exported_by?: string;
  exported_at: string;
  parameters: any;
}

export const financialComparisonService = {
  // Calculate financial variance between two periods
  async calculateFinancialVariance(
    baseStartDate: string,
    baseEndDate: string,
    comparisonStartDate: string,
    comparisonEndDate: string
  ): Promise<VarianceData> {
    const { data, error } = await supabase.rpc('calculate_financial_variance', {
      tenant_id_param: null, // Will be handled by RLS
      base_start_date: baseStartDate,
      base_end_date: baseEndDate,
      comparison_start_date: comparisonStartDate,
      comparison_end_date: comparisonEndDate
    });

    if (error) {
      console.error('Error calculating financial variance:', error);
      throw error;
    }

    return data as unknown as VarianceData;
  },

  // Save a financial comparison
  async saveFinancialComparison(
    comparisonName: string,
    baseStartDate: string,
    baseEndDate: string,
    comparisonStartDate: string,
    comparisonEndDate: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('save_financial_comparison', {
      tenant_id_param: null, // Will be handled by RLS
      comparison_name_param: comparisonName,
      base_start: baseStartDate,
      base_end: baseEndDate,
      comp_start: comparisonStartDate,
      comp_end: comparisonEndDate,
      created_by_param: null // Will be handled by auth
    });

    if (error) {
      console.error('Error saving financial comparison:', error);
      throw error;
    }

    return data;
  },

  // Get all financial comparisons
  async getFinancialComparisons(): Promise<FinancialComparison[]> {
    const { data, error } = await supabase
      .from('financial_comparisons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching financial comparisons:', error);
      throw error;
    }

    return data || [];
  },

  // Get a specific financial comparison
  async getFinancialComparison(id: string): Promise<FinancialComparison | null> {
    const { data, error } = await supabase
      .from('financial_comparisons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching financial comparison:', error);
      throw error;
    }

    return data;
  },

  // Delete a financial comparison
  async deleteFinancialComparison(id: string): Promise<void> {
    const { error } = await supabase
      .from('financial_comparisons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting financial comparison:', error);
      throw error;
    }
  },

  // Save a financial report
  async saveFinancialReport(
    reportName: string,
    reportType: string,
    reportData: any,
    parameters: any = {}
  ): Promise<string> {
    // Get current user info for tenant_id (will be auto-set by RLS trigger)
    const { data, error } = await supabase
      .from('saved_financial_reports')
      .insert({
        report_name: reportName,
        report_type: reportType,
        report_data: reportData,
        parameters: parameters
      } as any)
      .select('id')
      .single();

    if (error) {
      console.error('Error saving financial report:', error);
      throw error;
    }

    return data.id;
  },

  // Get all saved financial reports
  async getSavedFinancialReports(): Promise<SavedFinancialReport[]> {
    const { data, error } = await supabase
      .from('saved_financial_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved financial reports:', error);
      throw error;
    }

    return data || [];
  },

  // Get saved financial reports by type
  async getSavedFinancialReportsByType(reportType: string): Promise<SavedFinancialReport[]> {
    const { data, error } = await supabase
      .from('saved_financial_reports')
      .select('*')
      .eq('report_type', reportType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved financial reports by type:', error);
      throw error;
    }

    return data || [];
  },

  // Delete a saved financial report
  async deleteSavedFinancialReport(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_financial_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting saved financial report:', error);
      throw error;
    }
  },

  // Log export history
  async logExportHistory(
    reportType: string,
    exportFormat: string,
    parameters: any = {},
    reportId?: string,
    filePath?: string,
    fileSize?: number
  ): Promise<string> {
    // Get current user info for tenant_id (will be auto-set by RLS trigger)
    const { data, error } = await supabase
      .from('export_history')
      .insert({
        report_id: reportId,
        report_type: reportType,
        export_format: exportFormat,
        file_path: filePath,
        file_size: fileSize,
        parameters: parameters
      } as any)
      .select('id')
      .single();

    if (error) {
      console.error('Error logging export history:', error);
      throw error;
    }

    return data.id;
  },

  // Get export history
  async getExportHistory(): Promise<ExportHistory[]> {
    const { data, error } = await supabase
      .from('export_history')
      .select('*')
      .order('exported_at', { ascending: false });

    if (error) {
      console.error('Error fetching export history:', error);
      throw error;
    }

    return data || [];
  },

  // Get export history by report type
  async getExportHistoryByType(reportType: string): Promise<ExportHistory[]> {
    const { data, error } = await supabase
      .from('export_history')
      .select('*')
      .eq('report_type', reportType)
      .order('exported_at', { ascending: false });

    if (error) {
      console.error('Error fetching export history by type:', error);
      throw error;
    }

    return data || [];
  }
};