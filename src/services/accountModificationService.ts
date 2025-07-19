
import { supabase } from '@/integrations/supabase/client';
import { 
  AccountModificationRequest, 
  AccountAuditLog, 
  CanModifyAccountResult, 
  ModificationRequestFormData 
} from '@/types/accountModification';

export class AccountModificationService {
  
  // التحقق من إمكانية تعديل الحساب
  async canModifyAccount(accountId: string): Promise<CanModifyAccountResult> {
    const { data, error } = await supabase.rpc('can_modify_account', {
      account_id_param: accountId,
      user_id_param: null // سيتم تحديده تلقائياً من auth.uid()
    });
    
    if (error) throw error;
    return data as CanModifyAccountResult;
  }

  // إنشاء طلب تعديل حساب
  async createModificationRequest(
    accountId: string, 
    currentValues: Record<string, any>,
    requestData: ModificationRequestFormData
  ): Promise<AccountModificationRequest> {
    const { data, error } = await supabase
      .from('account_modification_requests')
      .insert({
        account_id: accountId,
        requester_id: (await supabase.auth.getUser()).data.user?.id,
        tenant_id: null, // سيتم تحديده من RLS
        request_type: requestData.request_type,
        current_values: currentValues,
        proposed_values: requestData.proposed_values,
        justification: requestData.justification,
        priority: requestData.priority,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as AccountModificationRequest;
  }

  // الحصول على طلبات التعديل
  async getModificationRequests(status?: string): Promise<AccountModificationRequest[]> {
    let query = supabase
      .from('account_modification_requests')
      .select(`
        *,
        chart_of_accounts!inner(account_name, account_code)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AccountModificationRequest[];
  }

  // موافقة على طلب التعديل
  async approveModificationRequest(
    requestId: string, 
    comments?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('account_modification_requests')
      .update({
        status: 'approved',
        approver_id: (await supabase.auth.getUser()).data.user?.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) throw error;

    // تطبيق التعديلات على الحساب
    await this.applyApprovedModification(requestId);
  }

  // رفض طلب التعديل
  async rejectModificationRequest(
    requestId: string, 
    rejectionReason: string
  ): Promise<void> {
    const { error } = await supabase
      .from('account_modification_requests')
      .update({
        status: 'rejected',
        approver_id: (await supabase.auth.getUser()).data.user?.id,
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) throw error;
  }

  // تطبيق التعديل المعتمد
  private async applyApprovedModification(requestId: string): Promise<void> {
    // الحصول على طلب التعديل
    const { data: request, error: requestError } = await supabase
      .from('account_modification_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) throw requestError;

    // تطبيق التعديلات على الحساب
    const { error: updateError } = await supabase
      .from('chart_of_accounts')
      .update(request.proposed_values)
      .eq('id', request.account_id);

    if (updateError) throw updateError;

    // تسجيل في سجل التدقيق
    await this.logAccountChange(
      request.account_id,
      'approved_modification',
      request.current_values,
      request.proposed_values,
      requestId,
      'تم تطبيق التعديل المعتمد'
    );
  }

  // الحصول على سجل التدقيق للحساب
  async getAccountAuditLog(accountId: string): Promise<AccountAuditLog[]> {
    const { data, error } = await supabase
      .from('account_audit_log')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AccountAuditLog[];
  }

  // تسجيل تغيير في سجل التدقيق
  async logAccountChange(
    accountId: string,
    actionType: AccountAuditLog['action_type'],
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    modificationRequestId?: string,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('account_audit_log')
      .insert({
        account_id: accountId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        tenant_id: null, // سيتم تحديده من RLS
        action_type: actionType,
        old_values: oldValues,
        new_values: newValues,
        modification_request_id: modificationRequestId,
        notes: notes
      });

    if (error) throw error;
  }

  // فتح قفل الحساب (للمديرين فقط)
  async unlockAccount(accountId: string, reason: string): Promise<void> {
    const { data: account, error: fetchError } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('chart_of_accounts')
      .update({
        is_locked: false,
        locked_at: null,
        locked_by: null,
        modification_requires_approval: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId);

    if (error) throw error;

    // تسجيل في سجل التدقيق
    await this.logAccountChange(
      accountId,
      'unlocked',
      { is_locked: true },
      { is_locked: false },
      undefined,
      `تم فتح قفل الحساب: ${reason}`
    );
  }

  // قفل الحساب يدوياً
  async lockAccount(accountId: string, reason: string): Promise<void> {
    const { error } = await supabase
      .from('chart_of_accounts')
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
        locked_by: (await supabase.auth.getUser()).data.user?.id,
        modification_requires_approval: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId);

    if (error) throw error;

    // تسجيل في سجل التدقيق
    await this.logAccountChange(
      accountId,
      'locked',
      { is_locked: false },
      { is_locked: true },
      undefined,
      `تم قفل الحساب يدوياً: ${reason}`
    );
  }
}

export const accountModificationService = new AccountModificationService();
