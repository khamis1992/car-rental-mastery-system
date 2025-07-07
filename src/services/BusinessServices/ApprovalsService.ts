import { supabase } from '@/integrations/supabase/client';
import { UserHelperService } from './UserHelperService';

export interface Approval {
  id: string;
  approval_type: string;
  reference_table: string;
  reference_id: string;
  requesting_department_id: string;
  approving_department_id: string;
  requested_by: string;
  assigned_to?: string;
  current_approver?: string;
  status: string;
  priority: string;
  approval_level: number;
  max_approval_level: number;
  amount: number;
  request_details: any;
  approval_comments?: string;
  rejection_reason?: string;
  requested_at: string;
  approved_at?: string;
  rejected_at?: string;
  expires_at?: string;
}

export interface CreateApprovalData {
  approval_type: string;
  reference_table: string;
  reference_id: string;
  requesting_department_id: string;
  approving_department_id: string;
  requested_by: string;
  amount?: number;
  request_details?: any;
  priority?: string;
}

export interface ApprovalFilters {
  status?: string;
  approval_type?: string;
  requesting_department_id?: string;
  approving_department_id?: string;
  assigned_to?: string;
  priority?: string;
  date_from?: string;
  date_to?: string;
}

export class ApprovalsService {

  async getAllApprovals(filters?: ApprovalFilters): Promise<Approval[]> {
    let query = supabase
      .from('approvals')
      .select(`
        *,
        requesting_department:departments!approvals_requesting_department_id_fkey(department_name),
        approving_department:departments!approvals_approving_department_id_fkey(department_name),
        requester:employees!approvals_requested_by_fkey(first_name, last_name),
        assignee:employees!approvals_assigned_to_fkey(first_name, last_name)
      `)
      .order('requested_at', { ascending: false });

    // تطبيق المرشحات
    if (filters) {
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.approval_type) {
        query = query.eq('approval_type', filters.approval_type);
      }
      if (filters.requesting_department_id) {
        query = query.eq('requesting_department_id', filters.requesting_department_id);
      }
      if (filters.approving_department_id) {
        query = query.eq('approving_department_id', filters.approving_department_id);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.date_from) {
        query = query.gte('requested_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('requested_at', filters.date_to);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching approvals:', error);
      throw new Error(`فشل في جلب الموافقات: ${error.message}`);
    }

    return data || [];
  }

  async getApprovalsByEmployee(employeeId: string): Promise<Approval[]> {
    const { data, error } = await supabase
      .from('approvals')
      .select(`
        *,
        requesting_department:departments!approvals_requesting_department_id_fkey(department_name),
        approving_department:departments!approvals_approving_department_id_fkey(department_name),
        requester:employees!approvals_requested_by_fkey(first_name, last_name)
      `)
      .or(`assigned_to.eq.${employeeId},requested_by.eq.${employeeId}`)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching approvals by employee:', error);
      throw new Error(`فشل في جلب موافقات الموظف: ${error.message}`);
    }

    return data || [];
  }

  async getPendingApprovals(employeeId?: string): Promise<Approval[]> {
    let query = supabase
      .from('approvals')
      .select(`
        *,
        requesting_department:departments!approvals_requesting_department_id_fkey(department_name),
        approving_department:departments!approvals_approving_department_id_fkey(department_name),
        requester:employees!approvals_requested_by_fkey(first_name, last_name)
      `)
      .eq('status', 'pending')
      .order('priority', { ascending: true })
      .order('requested_at', { ascending: true });

    if (employeeId) {
      query = query.eq('assigned_to', employeeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching pending approvals:', error);
      throw new Error(`فشل في جلب الموافقات المعلقة: ${error.message}`);
    }

    return data || [];
  }

  async createApprovalRequest(approvalData: CreateApprovalData): Promise<string> {
    const { data, error } = await supabase.rpc('create_approval_request', {
      p_approval_type: approvalData.approval_type,
      p_reference_table: approvalData.reference_table,
      p_reference_id: approvalData.reference_id,
      p_requesting_dept_id: approvalData.requesting_department_id,
      p_approving_dept_id: approvalData.approving_department_id,
      p_requested_by: approvalData.requested_by,
      p_amount: approvalData.amount || 0,
      p_details: approvalData.request_details || {},
      p_priority: approvalData.priority || 'normal'
    });

    if (error) {
      console.error('Error creating approval request:', error);
      throw new Error(`فشل في إنشاء طلب الموافقة: ${error.message}`);
    }

    return data;
  }

  async approveRequest(
    id: string, 
    approverId: string, 
    comments?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('approvals')
      .update({
        status: 'approved',
        current_approver: approverId,
        approval_comments: comments,
        approved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error approving request:', error);
      throw new Error(`فشل في الموافقة على الطلب: ${error.message}`);
    }

    // تسجيل المعاملة
    await this.logApprovalAction(id, 'approved', approverId, comments);
  }

  async rejectRequest(
    id: string, 
    approverId: string, 
    rejectionReason: string
  ): Promise<void> {
    const { error } = await supabase
      .from('approvals')
      .update({
        status: 'rejected',
        current_approver: approverId,
        rejection_reason: rejectionReason,
        rejected_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error rejecting request:', error);
      throw new Error(`فشل في رفض الطلب: ${error.message}`);
    }

    // تسجيل المعاملة
    await this.logApprovalAction(id, 'rejected', approverId, rejectionReason);
  }

  async reassignApproval(id: string, newAssigneeId: string): Promise<void> {
    const { error } = await supabase
      .from('approvals')
      .update({
        assigned_to: newAssigneeId
      })
      .eq('id', id);

    if (error) {
      console.error('Error reassigning approval:', error);
      throw new Error(`فشل في إعادة تعيين الموافقة: ${error.message}`);
    }

    // تسجيل المعاملة
    await this.logApprovalAction(id, 'reassigned', newAssigneeId);
  }

  async cancelApproval(id: string, cancelledBy: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('approvals')
      .update({
        status: 'cancelled',
        rejection_reason: reason || 'تم إلغاء الطلب'
      })
      .eq('id', id);

    if (error) {
      console.error('Error cancelling approval:', error);
      throw new Error(`فشل في إلغاء الموافقة: ${error.message}`);
    }

    // تسجيل المعاملة
    await this.logApprovalAction(id, 'cancelled', cancelledBy, reason);
  }

  async getApprovalMetrics() {
    const { data, error } = await supabase
      .from('approvals')
      .select('status, approval_type, priority, amount, requested_at, approved_at');

    if (error) {
      console.error('Error fetching approval metrics:', error);
      throw new Error(`فشل في جلب إحصائيات الموافقات: ${error.message}`);
    }

    const now = new Date();
    const metrics = {
      total: data.length,
      pending: data.filter(a => a.status === 'pending').length,
      approved: data.filter(a => a.status === 'approved').length,
      rejected: data.filter(a => a.status === 'rejected').length,
      cancelled: data.filter(a => a.status === 'cancelled').length,
      high_priority: data.filter(a => a.priority === 'high' || a.priority === 'urgent').length,
      total_amount: data.reduce((sum, a) => sum + (a.amount || 0), 0),
      average_approval_time: this.calculateAverageApprovalTime(data.filter(a => a.approved_at)),
      by_type: {} as Record<string, number>,
      by_status: {} as Record<string, number>
    };

    // تجميع حسب النوع والحالة
    data.forEach(approval => {
      if (!metrics.by_type[approval.approval_type]) {
        metrics.by_type[approval.approval_type] = 0;
      }
      metrics.by_type[approval.approval_type]++;

      if (!metrics.by_status[approval.status]) {
        metrics.by_status[approval.status] = 0;
      }
      metrics.by_status[approval.status]++;
    });

    return metrics;
  }

  private calculateAverageApprovalTime(approvedRequests: any[]): number {
    if (approvedRequests.length === 0) return 0;

    const totalHours = approvedRequests.reduce((sum, approval) => {
      const requestTime = new Date(approval.requested_at);
      const approvalTime = new Date(approval.approved_at);
      const hoursDiff = (approvalTime.getTime() - requestTime.getTime()) / (1000 * 60 * 60);
      return sum + hoursDiff;
    }, 0);

    return Math.round(totalHours / approvedRequests.length);
  }

  private async logApprovalAction(
    approvalId: string, 
    action: string, 
    userId: string, 
    comments?: string
  ): Promise<void> {
    try {
      // الحصول على معلومات الموافقة
      const approval = await this.getApprovalById(approvalId);
      if (!approval) {
        console.warn('Approval not found for logging action:', approvalId);
        return;
      }

      // Use TransactionLogService instead of direct RPC call
      const { TransactionLogService } = await import('./TransactionLogService');
      const transactionLogService = new TransactionLogService();
      
      await transactionLogService.logTransaction(
        `approval_${action}`,
        'approvals',
        approvalId, // TransactionLogService will handle the UUID conversion
        `${action} موافقة ${approval.approval_type}`,
        {
          employeeId: userId, // The database function will handle user_id to employee_id conversion
          amount: approval.amount,
          details: {
            approval_id: approvalId,
            action: action,
            comments: comments,
            reference_table: approval.reference_table,
            reference_id: approval.reference_id
          }
        }
      );

      console.log('Successfully logged approval action:', { approvalId, action });
    } catch (error) {
      console.error('Error logging approval action:', error);
      // لا نرمي خطأ هنا لتجنب فشل العملية الأساسية
    }
  }

  private async getApprovalById(id: string): Promise<Approval | null> {
    const { data, error } = await supabase
      .from('approvals')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  async deleteApproval(id: string): Promise<void> {
    const { error } = await supabase
      .from('approvals')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting approval:', error);
      throw new Error(`فشل في حذف الموافقة: ${error.message}`);
    }
  }
}