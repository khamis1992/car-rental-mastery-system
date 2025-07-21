import { supabase } from "@/integrations/supabase/client";
import type { CollectionRecord, CollectionRecordFormData } from "@/types/invoice";

export class CollectionRecordService {
  async getCollectionRecords() {
    const { data, error } = await supabase
      .from('collection_records')
      .select(`
        *,
        payment:payments(
          *,
          invoice:invoices(*),
          customer:customers(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CollectionRecord[];
  }

  async getCollectionRecordById(id: string) {
    const { data, error } = await supabase
      .from('collection_records')
      .select(`
        *,
        payment:payments(
          *,
          invoice:invoices(*),
          customer:customers(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as CollectionRecord;
  }

  async createCollectionRecord(formData: CollectionRecordFormData) {
    const { data, error } = await supabase
      .from('collection_records')
      .insert({
        ...formData,
        collector_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select(`
        *,
        payment:payments(
          *,
          invoice:invoices(*),
          customer:customers(*)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateCollectionRecord(id: string, updates: Partial<CollectionRecord>) {
    const { data, error } = await supabase
      .from('collection_records')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        payment:payments(
          *,
          invoice:invoices(*),
          customer:customers(*)
        )
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async verifyCollectionRecord(id: string, status: 'verified' | 'rejected') {
    const currentUser = (await supabase.auth.getUser()).data.user;
    
    const { data, error } = await supabase
      .from('collection_records')
      .update({
        verification_status: status,
        verified_by: currentUser?.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCollectionRecord(id: string) {
    const { error } = await supabase
      .from('collection_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getCollectionRecordsByPayment(paymentId: string) {
    const { data, error } = await supabase
      .from('collection_records')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CollectionRecord[];
  }

  async getCollectionSummary(dateFrom?: string, dateTo?: string) {
    let query = supabase
      .from('collection_records')
      .select('collection_type, collection_amount, verification_status');

    if (dateFrom) {
      query = query.gte('collection_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('collection_date', dateTo);
    }

    const { data, error } = await query;
    if (error) throw error;

    // تجميع البيانات
    const summary = data.reduce((acc, record) => {
      const type = record.collection_type;
      const status = record.verification_status;
      
      if (!acc[type]) {
        acc[type] = { total: 0, verified: 0, pending: 0, rejected: 0 };
      }
      
      acc[type].total += Number(record.collection_amount);
      acc[type][status] += Number(record.collection_amount);
      
      return acc;
    }, {} as Record<string, any>);

    return summary;
  }
}

export const collectionRecordService = new CollectionRecordService();