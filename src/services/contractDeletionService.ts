import { supabase } from '@/integrations/supabase/client';

export interface RelatedRecords {
  invoices: number;
  additional_charges: number;
  incidents: number;
  extensions: number;
  evaluations: number;
  has_related_records: boolean;
  total_related: number;
}

export interface DeletionResult {
  contract_number: string;
  deleted_related_records?: boolean;
  action?: string;
  reason?: string;
  counts?: {
    invoices: number;
    additional_charges: number;
    incidents: number;
    extensions: number;
    evaluations: number;
  };
}

export interface DeletionLogEntry {
  id: string;
  contract_id: string;
  contract_number: string;
  deleted_by: string;
  deletion_type: 'simple' | 'cascade' | 'soft_delete';
  deletion_reason?: string;
  related_records_deleted?: any;
  deleted_at: string;
  created_at: string;
}

export const contractDeletionService = {
  /**
   * Check related records for a contract before deletion
   */
  async checkRelatedRecords(contractId: string): Promise<RelatedRecords> {
    const { data, error } = await supabase.rpc('check_contract_related_records', {
      contract_id_param: contractId
    });
    
    if (error) throw error;
    return data as unknown as RelatedRecords;
  },

  /**
   * Safely delete contract with all related records
   */
  async cascadeDeleteContract(contractId: string): Promise<DeletionResult> {
    const { data, error } = await supabase.rpc('safe_delete_contract', {
      contract_id_param: contractId,
      delete_related: true
    });
    
    if (error) throw error;
    return data as unknown as DeletionResult;
  },

  /**
   * Mark contract as deleted (soft delete)
   */
  async markContractDeleted(contractId: string, reason?: string): Promise<DeletionResult> {
    const { data, error } = await supabase.rpc('mark_contract_deleted', {
      contract_id_param: contractId,
      reason: reason || null
    });
    
    if (error) throw error;
    return data as unknown as DeletionResult;
  },

  /**
   * Get deletion log entries
   */
  async getDeletionLog(limit?: number): Promise<DeletionLogEntry[]> {
    let query = supabase
      .from('contract_deletion_log')
      .select('*')
      .order('deleted_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return (data || []) as DeletionLogEntry[];
  },

  /**
   * Get deletion log for a specific contract
   */
  async getContractDeletionHistory(contractId: string): Promise<DeletionLogEntry[]> {
    const { data, error } = await supabase
      .from('contract_deletion_log')
      .select('*')
      .eq('contract_id', contractId)
      .order('deleted_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as DeletionLogEntry[];
  },

  /**
   * Get deletion statistics
   */
  async getDeletionStats(): Promise<{
    total_deletions: number;
    soft_deletions: number;
    cascade_deletions: number;
    recent_deletions: number;
  }> {
    const { data, error } = await supabase
      .from('contract_deletion_log')
      .select('deletion_type, deleted_at');
    
    if (error) throw error;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const stats = {
      total_deletions: data?.length || 0,
      soft_deletions: data?.filter(d => d.deletion_type === 'soft_delete').length || 0,
      cascade_deletions: data?.filter(d => d.deletion_type === 'cascade').length || 0,
      recent_deletions: data?.filter(d => new Date(d.deleted_at) >= thirtyDaysAgo).length || 0,
    };
    
    return stats;
  }
};