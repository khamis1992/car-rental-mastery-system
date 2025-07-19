import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface AutoReverseRequest {
  entryId: string;
  reverseDate: Date;
  reason: string;
}

export interface JournalEntryWithAutoReverse {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  auto_reverse_date?: string;
  is_reversed: boolean;
  is_reversal: boolean;
  reversal_entry_id?: string;
  reversed_by_entry_id?: string;
}

class AutoReverseService {
  async setAutoReverse(request: AutoReverseRequest): Promise<void> {
    const { entryId, reverseDate, reason } = request;
    
    const { error } = await supabase
      .from('journal_entries')
      .update({
        auto_reverse_date: format(reverseDate, 'yyyy-MM-dd'),
        notes: reason
      })
      .eq('id', entryId);

    if (error) {
      throw new Error(`فشل في إعداد العكس التلقائي: ${error.message}`);
    }
  }

  async cancelAutoReverse(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('journal_entries')
      .update({
        auto_reverse_date: null
      })
      .eq('id', entryId);

    if (error) {
      throw new Error(`فشل في إلغاء العكس التلقائي: ${error.message}`);
    }
  }

  async createManualReversal(entryId: string, reason: string): Promise<string> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', entryId)
      .single();

    if (error || !data) {
      throw new Error('القيد المحاسبي غير موجود');
    }

    // استخدام Supabase RPC functions
    const { data: reversalData, error: reversalError } = await supabase
      .rpc('create_reversal_entry', {
        original_entry_id: entryId,
        reversal_date: format(new Date(), 'yyyy-MM-dd'),
        reversal_reason: reason
      });

    if (reversalError) {
      throw new Error(`فشل في إنشاء القيد العكسي: ${reversalError.message}`);
    }

    return reversalData || '';
  }

  async getEntriesWithAutoReverse(): Promise<JournalEntryWithAutoReverse[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .not('auto_reverse_date', 'is', null)
      .eq('is_reversed', false)
      .eq('is_reversal', false)
      .order('auto_reverse_date', { ascending: true });

    if (error) {
      throw new Error(`فشل في جلب القيود المجدولة للعكس: ${error.message}`);
    }

    return (data || []).map(item => ({
      id: item.id,
      entry_number: item.entry_number,
      entry_date: item.entry_date,
      description: item.description,
      total_debit: item.total_debit,
      total_credit: item.total_credit,
      status: item.status,
      auto_reverse_date: item.auto_reverse_date,
      is_reversed: item.is_reversed || false,
      is_reversal: item.is_reversal || false,
      reversal_entry_id: item.reversal_entry_id,
      reversed_by_entry_id: item.reversed_by_entry_id
    }));
  }

  async getReversalHistory(entryId: string): Promise<JournalEntryWithAutoReverse | null> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('reversed_by_entry_id', entryId)
      .eq('is_reversal', true)
      .maybeSingle();

    if (error) {
      throw new Error(`فشل في جلب تاريخ العكس: ${error.message}`);
    }

    if (!data) return null;

    return {
      id: data.id,
      entry_number: data.entry_number,
      entry_date: data.entry_date,
      description: data.description,
      total_debit: data.total_debit,
      total_credit: data.total_credit,
      status: data.status,
      auto_reverse_date: data.auto_reverse_date,
      is_reversed: data.is_reversed || false,
      is_reversal: data.is_reversal || false,
      reversal_entry_id: data.reversal_entry_id,
      reversed_by_entry_id: data.reversed_by_entry_id
    };
  }

  async processAutoReverseEntries(): Promise<number> {
    const { data, error } = await supabase
      .rpc('process_auto_reverse_entries');

    if (error) {
      throw new Error(`فشل في معالجة القيود المجدولة للعكس: ${error.message}`);
    }

    return Number(data) || 0;
  }
}

export const autoReverseService = new AutoReverseService();