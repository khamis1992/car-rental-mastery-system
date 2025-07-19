import { supabase } from "@/integrations/supabase/client";
import { accountingService } from "./accountingService";

export interface JournalEntryReview {
  id: string;
  tenant_id: string;
  journal_entry_id: string;
  reviewer_id: string;
  review_status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  review_comments?: string;
  reviewed_at?: string;
  required_documents: string[];
  missing_documents: string[];
  review_checklist: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewData {
  journal_entry_id: string;
  reviewer_id: string;
  required_documents?: string[];
  review_checklist?: Record<string, boolean>;
}

export interface ReviewDecisionData {
  review_status: 'approved' | 'rejected' | 'needs_revision';
  review_comments?: string;
  missing_documents?: string[];
}

export const journalEntryReviewService = {
  async createReview(data: CreateReviewData): Promise<JournalEntryReview> {
    const tenantId = await accountingService.getCurrentTenantId();
    
    const { data: review, error } = await supabase
      .from('journal_entry_reviews')
      .insert({
        tenant_id: tenantId,
        journal_entry_id: data.journal_entry_id,
        reviewer_id: data.reviewer_id,
        required_documents: data.required_documents || [],
        review_checklist: data.review_checklist || {}
      })
      .select()
      .single();

    if (error) throw error;
    return review as JournalEntryReview;
  },

  async getReviews(journalEntryId: string): Promise<JournalEntryReview[]> {
    const { data, error } = await supabase
      .from('journal_entry_reviews')
      .select('*')
      .eq('journal_entry_id', journalEntryId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as JournalEntryReview[];
  },

  async getPendingReviews(reviewerId?: string): Promise<JournalEntryReview[]> {
    let query = supabase
      .from('journal_entry_reviews')
      .select(`
        *,
        journal_entry:journal_entries(
          id,
          entry_number,
          description,
          total_debit,
          total_credit,
          entry_date
        )
      `)
      .eq('review_status', 'pending');

    if (reviewerId) {
      query = query.eq('reviewer_id', reviewerId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;
    return data as JournalEntryReview[];
  },

  async submitReviewDecision(reviewId: string, decision: ReviewDecisionData): Promise<void> {
    // تحديث مراجعة القيد
    const { error: reviewError } = await supabase
      .from('journal_entry_reviews')
      .update({
        review_status: decision.review_status,
        review_comments: decision.review_comments,
        missing_documents: decision.missing_documents || [],
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId);

    if (reviewError) throw reviewError;

    // جلب معرف القيد لتحديث حالته
    const { data: review, error: fetchError } = await supabase
      .from('journal_entry_reviews')
      .select('journal_entry_id')
      .eq('id', reviewId)
      .single();

    if (fetchError) throw fetchError;

    // تحديث حالة القيد المحاسبي
    const entryStatus = decision.review_status === 'approved' ? 'posted' : 
                       decision.review_status === 'rejected' ? 'rejected' : 'draft';

    const { error: entryError } = await supabase
      .from('journal_entries')
      .update({
        review_status: decision.review_status,
        status: entryStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', review.journal_entry_id);

    if (entryError) throw entryError;
  },

  async getReviewStatistics(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    needs_revision: number;
  }> {
    const { data, error } = await supabase
      .from('journal_entry_reviews')
      .select('review_status');

    if (error) throw error;

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      needs_revision: 0
    };

    data?.forEach(review => {
      stats[review.review_status as keyof typeof stats]++;
    });

    return stats;
  },

  async evaluateReview(entryId: string, reviewerId: string, status: string, comments?: string): Promise<any> {
    const { data, error } = await supabase.rpc('evaluate_journal_entry_review', {
      entry_id: entryId,
      reviewer_id: reviewerId,
      review_status: status,
      comments: comments
    });

    if (error) throw error;
    return data;
  }
};