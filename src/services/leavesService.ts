import { supabase } from "@/integrations/supabase/client";
import { LeaveRequest } from "@/types/hr";

export const leavesService = {
  async getLeaveRequests() {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees(
          id,
          first_name,
          last_name,
          employee_number
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert(request)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async approveLeaveRequest(requestId: string, approverId: string) {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    // الحصول على معلومات الموظف
    const { data: employee } = await supabase
      .from('employees')
      .select('user_id, first_name, last_name')
      .eq('id', data.employee_id)
      .single();

    // إرسال إشعار للموظف
    if (employee?.user_id) {
      await this.createNotification({
        title: 'تم اعتماد طلب الإجازة',
        message: `تم اعتماد طلب إجازتك من ${data.start_date} إلى ${data.end_date}`,
        notification_type: 'success',
        recipient_id: employee.user_id,
        sender_id: approverId,
        entity_type: 'leave_request',
        entity_id: requestId
      });
    }

    return data;
  },

  async rejectLeaveRequest(requestId: string, rejectionReason: string, rejectedBy: string) {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        approved_by: rejectedBy,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    // الحصول على معلومات الموظف
    const { data: employee } = await supabase
      .from('employees')
      .select('user_id, first_name, last_name')
      .eq('id', data.employee_id)
      .single();

    // إرسال إشعار للموظف
    if (employee?.user_id) {
      await this.createNotification({
        title: 'تم رفض طلب الإجازة',
        message: `تم رفض طلب إجازتك من ${data.start_date} إلى ${data.end_date}. السبب: ${rejectionReason}`,
        notification_type: 'error',
        recipient_id: employee.user_id,
        sender_id: rejectedBy,
        entity_type: 'leave_request',
        entity_id: requestId
      });
    }

    return data;
  },

  async createNotification(notification: {
    title: string;
    message: string;
    notification_type: string;
    recipient_id: string;
    sender_id: string;
    entity_type?: string;
    entity_id?: string;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getCurrentUserEmployee() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) return null;
    return data;
  }
};