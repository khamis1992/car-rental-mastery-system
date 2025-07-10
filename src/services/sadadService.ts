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

  // دالة للتحقق من صحة البيانات المدخلة
  validatePaymentData(paymentData: CreateSadadPaymentFormData): void {
    const errors: string[] = [];

    // التحقق من المبلغ
    if (paymentData.amount <= 0 || paymentData.amount > 999999.999) {
      errors.push('المبلغ يجب أن يكون بين 0.001 و 999999.999');
    }

    // التحقق من العملة
    const validCurrencies = ['KWD', 'USD', 'EUR'];
    if (paymentData.currency && !validCurrencies.includes(paymentData.currency)) {
      errors.push(`العملة يجب أن تكون واحدة من: ${validCurrencies.join(', ')}`);
    }

    // التحقق من الوصف
    if (paymentData.description && paymentData.description.length > 500) {
      errors.push('الوصف لا يمكن أن يتجاوز 500 حرف');
    }

    // التحقق من البريد الإلكتروني
    if (paymentData.customer_email && !this.isValidEmail(paymentData.customer_email)) {
      errors.push('تنسيق البريد الإلكتروني غير صحيح');
    }

    // التحقق من رقم الهاتف
    if (paymentData.customer_phone && !this.isValidPhone(paymentData.customer_phone)) {
      errors.push('تنسيق رقم الهاتف غير صحيح');
    }

    // التحقق من مدة انتهاء الصلاحية
    if (paymentData.expires_in_minutes && (paymentData.expires_in_minutes < 1 || paymentData.expires_in_minutes > 10080)) {
      errors.push('مدة انتهاء الصلاحية يجب أن تكون بين 1 دقيقة و 10080 دقيقة (أسبوع)');
    }

    if (errors.length > 0) {
      throw new Error(`بيانات غير صحيحة: ${errors.join(', ')}`);
    }
  }

  // التحقق من صحة البريد الإلكتروني
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // التحقق من صحة رقم الهاتف
  private isValidPhone(phone: string): boolean {
    // نمط للرقم الكويتي أو الدولي
    const phoneRegex = /^(\+965|965)?[569][0-9]{7}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
  }

  // دالة للتحقق من صحة التوقيع
  async verifySignature(data: any, signature: string, merchantKey: string): Promise<boolean> {
    try {
      const signatureString = [
        data.merchant_id,
        data.amount?.toString() || '',
        data.currency || '',
        data.reference || '',
        merchantKey
      ].join('|');

      const encoder = new TextEncoder();
      const encodedData = encoder.encode(signatureString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
      
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return computedSignature.toLowerCase() === signature.toLowerCase();
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // دالة إعادة المحاولة للطلبات الفاشلة
  async retryFailedPayments(filters?: {
    tenant_id?: string;
    older_than_minutes?: number;
    max_retries?: number;
  }): Promise<{ retried: number; failed: number }> {
    try {
      let query = supabase
        .from('sadad_payments')
        .select('*')
        .eq('sadad_status', 'failed');

      if (filters?.tenant_id) {
        query = query.eq('tenant_id', filters.tenant_id);
      }

      if (filters?.older_than_minutes) {
        const cutoffTime = new Date(Date.now() - filters.older_than_minutes * 60 * 1000).toISOString();
        query = query.lt('updated_at', cutoffTime);
      }

      const { data: failedPayments, error } = await query;
      
      if (error) throw error;
      if (!failedPayments || failedPayments.length === 0) {
        return { retried: 0, failed: 0 };
      }

      let retriedCount = 0;
      let stillFailedCount = 0;

      for (const payment of failedPayments) {
        try {
          // محاولة إعادة معالجة الدفعة
          await this.updateSadadPaymentStatus(payment.id, 'pending');
          retriedCount++;
        } catch (retryError) {
          console.error(`Failed to retry payment ${payment.id}:`, retryError);
          stillFailedCount++;
        }
      }

      return { retried: retriedCount, failed: stillFailedCount };
    } catch (error) {
      console.error('Retry failed payments error:', error);
      throw error;
    }
  }
}

export const sadadService = new SadadService();