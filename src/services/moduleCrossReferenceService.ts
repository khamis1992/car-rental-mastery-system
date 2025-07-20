import { supabase } from '@/integrations/supabase/client';

export interface CrossReference {
  id?: string;
  source_module: string;
  source_id: string;
  target_module: string;
  target_id: string;
  relationship_type: string;
  notes?: string;
  is_active: boolean;
}

export interface RelatedModule {
  related_module: string;
  related_id: string;
  relationship_type: string;
  notes?: string;
}

class ModuleCrossReferenceService {
  /**
   * إضافة علاقة جديدة بين وحدتين
   */
  async createCrossReference(reference: Omit<CrossReference, 'id'>): Promise<CrossReference> {
    const { data, error } = await supabase
      .from('module_cross_references')
      .insert(reference)
      .select()
      .single();

    if (error) {
      console.error('Error creating cross reference:', error);
      throw error;
    }

    return data;
  }

  /**
   * الحصول على جميع الوحدات المرتبطة بوحدة معينة
   */
  async getRelatedModules(moduleType: string, entityId: string): Promise<RelatedModule[]> {
    const { data, error } = await supabase
      .rpc('get_related_modules', {
        module_name: moduleType,
        entity_id: entityId
      });

    if (error) {
      console.error('Error fetching related modules:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * تحديث علاقة موجودة
   */
  async updateCrossReference(id: string, updates: Partial<CrossReference>): Promise<CrossReference> {
    const { data, error } = await supabase
      .from('module_cross_references')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating cross reference:', error);
      throw error;
    }

    return data;
  }

  /**
   * حذف علاقة (إلغاء تفعيلها)
   */
  async deleteCrossReference(id: string): Promise<void> {
    const { error } = await supabase
      .from('module_cross_references')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting cross reference:', error);
      throw error;
    }
  }

  /**
   * البحث عن العلاقات بنوع علاقة محدد
   */
  async getCrossReferencesByType(relationshipType: string): Promise<CrossReference[]> {
    const { data, error } = await supabase
      .from('module_cross_references')
      .select('*')
      .eq('relationship_type', relationshipType)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cross references by type:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * ربط قيد محاسبي بعقد
   */
  async linkJournalEntryToContract(journalEntryId: string, contractId: string, notes?: string): Promise<CrossReference> {
    return this.createCrossReference({
      source_module: 'journal_entries',
      source_id: journalEntryId,
      target_module: 'contracts',
      target_id: contractId,
      relationship_type: 'accounting_entry',
      notes,
      is_active: true
    });
  }

  /**
   * ربط قيد محاسبي بفاتورة
   */
  async linkJournalEntryToInvoice(journalEntryId: string, invoiceId: string, notes?: string): Promise<CrossReference> {
    return this.createCrossReference({
      source_module: 'journal_entries',
      source_id: journalEntryId,
      target_module: 'invoices',
      target_id: invoiceId,
      relationship_type: 'accounting_entry',
      notes,
      is_active: true
    });
  }

  /**
   * ربط قيد محاسبي بأصل
   */
  async linkJournalEntryToAsset(journalEntryId: string, assetId: string, notes?: string): Promise<CrossReference> {
    return this.createCrossReference({
      source_module: 'journal_entries',
      source_id: journalEntryId,
      target_module: 'assets',
      target_id: assetId,
      relationship_type: 'accounting_entry',
      notes,
      is_active: true
    });
  }

  /**
   * ربط فاتورة بعقد
   */
  async linkInvoiceToContract(invoiceId: string, contractId: string, notes?: string): Promise<CrossReference> {
    return this.createCrossReference({
      source_module: 'invoices',
      source_id: invoiceId,
      target_module: 'contracts',
      target_id: contractId,
      relationship_type: 'billing',
      notes,
      is_active: true
    });
  }

  /**
   * ربط أصل بعقد
   */
  async linkAssetToContract(assetId: string, contractId: string, notes?: string): Promise<CrossReference> {
    return this.createCrossReference({
      source_module: 'assets',
      source_id: assetId,
      target_module: 'contracts',
      target_id: contractId,
      relationship_type: 'asset_usage',
      notes,
      is_active: true
    });
  }

  /**
   * الحصول على إحصائيات العلاقات المتبادلة
   */
  async getCrossReferenceStats(): Promise<{
    total_references: number;
    by_relationship_type: { [key: string]: number };
    by_module: { [key: string]: number };
  }> {
    const { data, error } = await supabase
      .from('module_cross_references')
      .select('relationship_type, source_module, target_module')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching cross reference stats:', error);
      throw error;
    }

    const stats = {
      total_references: data.length,
      by_relationship_type: {} as { [key: string]: number },
      by_module: {} as { [key: string]: number }
    };

    data.forEach(ref => {
      // إحصائيات نوع العلاقة
      stats.by_relationship_type[ref.relationship_type] = 
        (stats.by_relationship_type[ref.relationship_type] || 0) + 1;
      
      // إحصائيات الوحدات
      stats.by_module[ref.source_module] = 
        (stats.by_module[ref.source_module] || 0) + 1;
      stats.by_module[ref.target_module] = 
        (stats.by_module[ref.target_module] || 0) + 1;
    });

    return stats;
  }
}

export const moduleCrossReferenceService = new ModuleCrossReferenceService();