import { supabase } from '@/integrations/supabase/client';
import { 
  SadadSettings, 
  SadadPayment, 
  SadadWebhookEvent,
  SadadTransactionLog,
  CreateSadadPaymentFormData,
  SadadCreatePaymentRequest,
  SadadCreatePaymentResponse,
  SadadPaymentStatusResponse,
  SadadStats,
  SadadSettingsFormData
} from '@/types/sadad';

export class SadadService {
  
  // إدارة إعدادات SADAD
  async getSadadSettings(): Promise<SadadSettings | null> {
    const { data, error } = await supabase
      .from('sadad_settings')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return data;
  }

  async updateSadadSettings(settings: SadadSettingsFormData): Promise<SadadSettings> {
    // التحقق من وجود إعدادات موجودة
    const existingSettings = await this.getSadadSettings();
    
    if (existingSettings) {
      const { data, error } = await supabase
        .from('sadad_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('sadad_settings')
        .insert({
          ...settings,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  // إدارة المدفوعات
  async getSadadPayments(filters?: {
    tenant_id?: string;
    status?: string;
    from_date?: string;
    to_date?: string;
    limit?: number;
  }): Promise<SadadPayment[]> {
    let query = supabase
      .from('sadad_payments')
      .select('*');

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters?.status) {
      query = query.eq('sadad_status', filters.status);
    }

    if (filters?.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return (data || []) as SadadPayment[];
  }

  async getSadadPaymentById(id: string): Promise<SadadPayment | null> {
    const { data, error } = await supabase
      .from('sadad_payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data as SadadPayment | null;
  }

  async createSadadPayment(paymentData: CreateSadadPaymentFormData): Promise<SadadPayment> {
    // الحصول على معرف المؤسسة الحالية
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('المستخدم غير مسجل دخول');
    }

    // الحصول على معرف المؤسسة
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .single();

    if (!tenantUser) {
      throw new Error('المستخدم غير مرتبط بمؤسسة');
    }

    const { data, error } = await supabase
      .from('sadad_payments')
      .insert({
        tenant_id: tenantUser.tenant_id,
        saas_invoice_id: paymentData.saas_invoice_id,
        subscription_id: paymentData.subscription_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: paymentData.description,
        customer_name: paymentData.customer_name,
        customer_email: paymentData.customer_email,
        customer_phone: paymentData.customer_phone,
        expires_at: paymentData.expires_in_minutes 
          ? new Date(Date.now() + paymentData.expires_in_minutes * 60 * 1000).toISOString()
          : null,
        sadad_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data as SadadPayment;
  }

  async updateSadadPaymentStatus(
    id: string, 
    status: SadadPayment['sadad_status'],
    additionalData?: Partial<SadadPayment>
  ): Promise<void> {
    const updateData: any = {
      sadad_status: status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('sadad_payments')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  // إدارة أحداث webhook
  async createWebhookEvent(eventData: {
    event_type: string;
    sadad_transaction_id?: string;
    payment_id?: string;
    event_data: any;
  }): Promise<SadadWebhookEvent> {
    const { data, error } = await supabase
      .from('sadad_webhook_events')
      .insert(eventData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async markWebhookEventAsProcessed(id: string): Promise<void> {
    const { error } = await supabase
      .from('sadad_webhook_events')
      .update({ processed: true })
      .eq('id', id);

    if (error) throw error;
  }

  async getUnprocessedWebhookEvents(): Promise<SadadWebhookEvent[]> {
    const { data, error } = await supabase
      .from('sadad_webhook_events')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // إدارة سجل المعاملات
  async createTransactionLog(logData: {
    payment_id: string;
    action: string;
    request_data?: any;
    response_data?: any;
    status: string;
    error_message?: string;
  }): Promise<SadadTransactionLog> {
    const { data, error } = await supabase
      .from('sadad_transaction_log')
      .insert(logData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getTransactionLogs(paymentId: string): Promise<SadadTransactionLog[]> {
    const { data, error } = await supabase
      .from('sadad_transaction_log')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // الإحصائيات
  async getSadadStats(filters?: {
    tenant_id?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<SadadStats> {
    let query = supabase
      .from('sadad_payments')
      .select('sadad_status, amount');

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters?.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    const { data, error } = await query;
    if (error) throw error;

    const payments = data || [];
    const totalPayments = payments.length;
    const successfulPayments = payments.filter(p => p.sadad_status === 'paid').length;
    const failedPayments = payments.filter(p => p.sadad_status === 'failed').length;
    const pendingPayments = payments.filter(p => p.sadad_status === 'pending').length;
    const totalAmount = payments
      .filter(p => p.sadad_status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
    const averagePaymentAmount = successfulPayments > 0 ? totalAmount / successfulPayments : 0;

    return {
      total_payments: totalPayments,
      successful_payments: successfulPayments,
      failed_payments: failedPayments,
      pending_payments: pendingPayments,
      total_amount: totalAmount,
      success_rate: successRate,
      average_payment_amount: averagePaymentAmount
    };
  }

  // البحث عن الدفعة بمعرف المعاملة من SADAD
  async findPaymentByTransactionId(transactionId: string): Promise<SadadPayment | null> {
    const { data, error } = await supabase
      .from('sadad_payments')
      .select('*')
      .eq('sadad_transaction_id', transactionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data as SadadPayment | null;
  }
}

export const sadadService = new SadadService();