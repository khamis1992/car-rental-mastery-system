import { supabase } from '@/integrations/supabase/client';
import { 
  SaasPayment,
  SadadPayment,
  CreatePaymentFormData,
  PaymentStatus,
  PaymentGateway,
  PaymentMethod,
  Currency,
  PaymentStats,
  PaymentFilters,
  formatCurrency,
  isValidPaymentStatus,
  isValidCurrency
} from '@/types/unified-saas';

// =======================================================
// خدمة الدفع الموحدة للنظام
// =======================================================

export class UnifiedPaymentService {
  // إدارة الذاكرة المؤقتة مع TTL محسن
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_CACHE_TTL = 3 * 60 * 1000; // 3 دقائق
  private readonly STATS_CACHE_TTL = 2 * 60 * 1000; // دقيقتان للإحصائيات

  // =======================================================
  // دوال مساعدة للذاكرة المؤقتة
  // =======================================================

  private getCacheKey(prefix: string, ...params: string[]): string {
    return `unified_payment:${prefix}:${params.join(':')}`;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.DEFAULT_CACHE_TTL): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private getCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // =======================================================
  // إدارة مدفوعات SaaS
  // =======================================================

  async getSaasPayments(filters?: PaymentFilters): Promise<SaasPayment[]> {
    const cacheKey = this.getCacheKey('saas', JSON.stringify(filters || {}));
    const cached = this.getCache<SaasPayment[]>(cacheKey);
    if (cached) return cached;

    let query = supabase
      .from('saas_payments')
      .select(`
        *,
        invoice:saas_invoices(id, invoice_number, status),
        tenant:tenants(id, name, email)
      `);

    if (filters?.tenant_id) {
      query = query.eq('tenant_id', filters.tenant_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.payment_method) {
      query = query.eq('payment_method', filters.payment_method);
    }

    if (filters?.from_date) {
      query = query.gte('payment_date', filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte('payment_date', filters.to_date);
    }

    if (filters?.min_amount) {
      query = query.gte('amount', filters.min_amount);
    }

    if (filters?.max_amount) {
      query = query.lte('amount', filters.max_amount);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query.order('payment_date', { ascending: false });

    if (error) throw new Error(`فشل في جلب مدفوعات SaaS: ${error.message}`);

    const payments = (data || []) as unknown as SaasPayment[];
    this.setCache(cacheKey, payments);
    
    return payments;
  }

  async createSaasPayment(paymentData: CreatePaymentFormData): Promise<SaasPayment> {
    // التحقق من صحة البيانات
    this.validatePaymentData(paymentData);

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('المستخدم غير مسجل دخول');
    }

    const { data, error } = await supabase
      .from('saas_payments')
      .insert({
        tenant_id: paymentData.tenant_id,
        invoice_id: paymentData.invoice_id,
        subscription_id: paymentData.subscription_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        payment_method: paymentData.payment_method,
        payment_gateway: paymentData.payment_gateway,
        payment_date: paymentData.payment_date || new Date().toISOString(),
        status: 'pending',
        payment_reference: paymentData.payment_reference,
        description: paymentData.description,
        created_by: user.user.id
      })
      .select(`
        *,
        invoice:saas_invoices(id, invoice_number, status),
        tenant:tenants(id, name, email)
      `)
      .single();

    if (error) throw new Error(`فشل في إنشاء مدفوعة SaaS: ${error.message}`);

    // تنظيف الذاكرة المؤقتة
    this.clearCache('saas');
    this.clearCache('stats');

    return data as unknown as SaasPayment;
  }

  async updateSaasPaymentStatus(
    paymentId: string, 
    status: PaymentStatus,
    additionalData?: Partial<SaasPayment>
  ): Promise<void> {
    if (!isValidPaymentStatus(status)) {
      throw new Error('حالة الدفعة غير صحيحة');
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    if (status === 'succeeded') {
      updateData.processed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('saas_payments')
      .update(updateData)
      .eq('id', paymentId);

    if (error) throw new Error(`فشل في تحديث حالة مدفوعة SaaS: ${error.message}`);

    // تنظيف الذاكرة المؤقتة
    this.clearCache('saas');
    this.clearCache('stats');
  }

  // =======================================================
  // إدارة مدفوعات SADAD
  // =======================================================

  async getSadadPayments(filters?: PaymentFilters): Promise<SadadPayment[]> {
    const cacheKey = this.getCacheKey('sadad', JSON.stringify(filters || {}));
    const cached = this.getCache<SadadPayment[]>(cacheKey);
    if (cached) return cached;

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

    if (filters?.min_amount) {
      query = query.gte('amount', filters.min_amount);
    }

    if (filters?.max_amount) {
      query = query.lte('amount', filters.max_amount);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`فشل في جلب مدفوعات SADAD: ${error.message}`);

    const payments = (data || []) as SadadPayment[];
    this.setCache(cacheKey, payments);
    
    return payments;
  }

  async createSadadPayment(paymentData: CreatePaymentFormData): Promise<SadadPayment> {
    // التحقق من صحة البيانات
    this.validatePaymentData(paymentData);

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('المستخدم غير مسجل دخول');
    }

    // الحصول على معرف المؤسسة
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.user.id)
      .eq('status', 'active')
      .single();

    if (!tenantUser) {
      throw new Error('المستخدم غير مرتبط بمؤسسة');
    }

    const { data, error } = await supabase
      .from('sadad_payments')
      .insert({
        tenant_id: tenantUser.tenant_id,
        saas_invoice_id: paymentData.invoice_id,
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
        sadad_status: 'pending',
        created_by: user.user.id
      })
      .select()
      .single();

    if (error) throw new Error(`فشل في إنشاء مدفوعة SADAD: ${error.message}`);

    // تنظيف الذاكرة المؤقتة
    this.clearCache('sadad');
    this.clearCache('stats');

    return data as SadadPayment;
  }

  async updateSadadPaymentStatus(
    paymentId: string, 
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
      .eq('id', paymentId);

    if (error) throw new Error(`فشل في تحديث حالة مدفوعة SADAD: ${error.message}`);

    // تنظيف الذاكرة المؤقتة
    this.clearCache('sadad');
    this.clearCache('stats');
  }

  // =======================================================
  // إدارة المدفوعات الموحدة
  // =======================================================

  async getAllPayments(filters?: PaymentFilters): Promise<Array<SaasPayment | SadadPayment>> {
    const cacheKey = this.getCacheKey('all', JSON.stringify(filters || {}));
    const cached = this.getCache<Array<SaasPayment | SadadPayment>>(cacheKey);
    if (cached) return cached;

    const [saasPayments, sadadPayments] = await Promise.all([
      this.getSaasPayments(filters),
      this.getSadadPayments(filters)
    ]);

    // دمج وترتيب النتائج
    const allPayments = [
      ...saasPayments.map(p => ({ ...p, payment_type: 'saas' as const })),
      ...sadadPayments.map(p => ({ ...p, payment_type: 'sadad' as const }))
    ].sort((a, b) => {
      const dateA = new Date('payment_date' in a ? a.payment_date : a.created_at);
      const dateB = new Date('payment_date' in b ? b.payment_date : b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

    this.setCache(cacheKey, allPayments);
    
    return allPayments;
  }

  async getPaymentStats(filters?: PaymentFilters): Promise<PaymentStats> {
    const cacheKey = this.getCacheKey('stats', JSON.stringify(filters || {}));
    const cached = this.getCache<PaymentStats>(cacheKey);
    if (cached) return cached;

    const [saasPayments, sadadPayments] = await Promise.all([
      this.getSaasPayments(filters),
      this.getSadadPayments(filters)
    ]);

    // حساب إحصائيات SaaS
    const saasSucceeded = saasPayments.filter(p => p.status === 'succeeded');
    const saasFailed = saasPayments.filter(p => p.status === 'failed');
    const saasPending = saasPayments.filter(p => p.status === 'processing' || p.status === 'requires_action');

    // حساب إحصائيات SADAD
    const sadadSucceeded = sadadPayments.filter(p => p.sadad_status === 'paid');
    const sadadFailed = sadadPayments.filter(p => p.sadad_status === 'failed');
    const sadadPending = sadadPayments.filter(p => 
      p.sadad_status === 'pending' || p.sadad_status === 'processing'
    );

    // حساب الإجماليات
    const totalPayments = saasPayments.length + sadadPayments.length;
    const totalSucceeded = saasSucceeded.length + sadadSucceeded.length;
    const totalFailed = saasFailed.length + sadadFailed.length;
    const totalPending = saasPending.length + sadadPending.length;

    const totalAmount = [
      ...saasSucceeded.map(p => p.amount),
      ...sadadSucceeded.map(p => p.amount)
    ].reduce((sum, amount) => sum + Number(amount), 0);

    const successRate = totalPayments > 0 ? (totalSucceeded / totalPayments) * 100 : 0;
    const averageAmount = totalSucceeded > 0 ? totalAmount / totalSucceeded : 0;

    const stats: PaymentStats = {
      total_payments: totalPayments,
      successful_payments: totalSucceeded,
      failed_payments: totalFailed,
      pending_payments: totalPending,
      total_amount: totalAmount,
      success_rate: successRate,
      average_payment_amount: averageAmount,
      saas_stats: {
        total: saasPayments.length,
        succeeded: saasSucceeded.length,
        failed: saasFailed.length,
        pending: saasPending.length,
        amount: saasSucceeded.reduce((sum, p) => sum + Number(p.amount), 0)
      },
      sadad_stats: {
        total: sadadPayments.length,
        succeeded: sadadSucceeded.length,
        failed: sadadFailed.length,
        pending: sadadPending.length,
        amount: sadadSucceeded.reduce((sum, p) => sum + Number(p.amount), 0)
      }
    };

    this.setCache(cacheKey, stats, this.STATS_CACHE_TTL);
    
    return stats;
  }

  // =======================================================
  // البحث والاستعلامات المتقدمة
  // =======================================================

  async searchPayments(searchTerm: string, filters?: PaymentFilters): Promise<Array<SaasPayment | SadadPayment>> {
    const allPayments = await this.getAllPayments(filters);
    
    const searchLower = searchTerm.toLowerCase();
    
    return allPayments.filter(payment => {
      // البحث في المعلومات المشتركة
      const amountMatch = payment.amount.toString().includes(searchTerm);
      const currencyMatch = payment.currency?.toLowerCase().includes(searchLower);
      
      if ('payment_type' in payment && payment.payment_type === 'saas') {
        const saasPayment = payment as SaasPayment & { payment_type: 'saas' };
        return amountMatch || currencyMatch ||
          saasPayment.payment_reference?.toLowerCase().includes(searchLower) ||
          saasPayment.description?.toLowerCase().includes(searchLower);
      } else {
        const sadadPayment = payment as SadadPayment & { payment_type: 'sadad' };
        return amountMatch || currencyMatch ||
          sadadPayment.customer_name?.toLowerCase().includes(searchLower) ||
          sadadPayment.customer_email?.toLowerCase().includes(searchLower) ||
          sadadPayment.sadad_transaction_id?.includes(searchTerm) ||
          sadadPayment.sadad_reference_number?.includes(searchTerm) ||
          sadadPayment.description?.toLowerCase().includes(searchLower);
      }
    });
  }

  async getPaymentsByStatus(status: PaymentStatus | SadadPayment['sadad_status']): Promise<Array<SaasPayment | SadadPayment>> {
    const filters: PaymentFilters = { status: status as PaymentStatus };
    return this.getAllPayments(filters);
  }

  async getPaymentsByDateRange(fromDate: string, toDate: string): Promise<Array<SaasPayment | SadadPayment>> {
    const filters: PaymentFilters = { from_date: fromDate, to_date: toDate };
    return this.getAllPayments(filters);
  }

  async getPaymentsByAmount(minAmount?: number, maxAmount?: number): Promise<Array<SaasPayment | SadadPayment>> {
    const filters: PaymentFilters = { min_amount: minAmount, max_amount: maxAmount };
    return this.getAllPayments(filters);
  }

  // =======================================================
  // دوال مساعدة ومشتركة
  // =======================================================

  private validatePaymentData(paymentData: CreatePaymentFormData): void {
    const errors: string[] = [];

    // التحقق من المبلغ
    if (!paymentData.amount || paymentData.amount <= 0) {
      errors.push('المبلغ يجب أن يكون أكبر من صفر');
    }

    if (paymentData.amount > 999999.999) {
      errors.push('المبلغ لا يمكن أن يتجاوز 999,999.999');
    }

    // التحقق من العملة
    if (paymentData.currency && !isValidCurrency(paymentData.currency)) {
      errors.push('العملة غير صحيحة');
    }

    // التحقق من البريد الإلكتروني
    if (paymentData.customer_email && !this.isValidEmail(paymentData.customer_email)) {
      errors.push('تنسيق البريد الإلكتروني غير صحيح');
    }

    // التحقق من رقم الهاتف
    if (paymentData.customer_phone && !this.isValidPhone(paymentData.customer_phone)) {
      errors.push('تنسيق رقم الهاتف غير صحيح');
    }

    if (errors.length > 0) {
      throw new Error(`بيانات غير صحيحة: ${errors.join(', ')}`);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // نمط للرقم الكويتي أو الدولي
    const phoneRegex = /^(\+965|965)?[569][0-9]{7}$/;
    return phoneRegex.test(phone.replace(/\s|-/g, ''));
  }

  // =======================================================
  // دوال التنسيق والعرض
  // =======================================================

  formatPaymentAmount(amount: number, currency: Currency = 'KWD'): string {
    return formatCurrency(amount, currency);
  }

  getPaymentStatusLabel(status: PaymentStatus | SadadPayment['sadad_status']): string {
    const statusLabels = {
      // حالات SaaS
      'succeeded': 'نجح',
      'processing': 'قيد المعالجة',
      'failed': 'فشل',
      'canceled': 'ملغي',
      'requires_action': 'يتطلب إجراء',
      
      // حالات SADAD
      'paid': 'مدفوع',
      'pending': 'معلق',
      'expired': 'منتهي الصلاحية',
      'cancelled': 'ملغي'
    };

    return statusLabels[status as keyof typeof statusLabels] || status;
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    const methodLabels = {
      'credit_card': 'بطاقة ائتمان',
      'bank_transfer': 'تحويل بنكي',
      'cash': 'نقدي',
      'check': 'شيك',
      'manual': 'يدوي'
    };

    return methodLabels[method] || method;
  }

  getPaymentGatewayLabel(gateway: PaymentGateway): string {
    const gatewayLabels = {
      'sadad': 'سداد',
      'stripe': 'سترايب',
      'manual': 'يدوي'
    };

    return gatewayLabels[gateway] || gateway;
  }

  // =======================================================
  // إدارة تنظيف البيانات والصيانة
  // =======================================================

  async cleanupExpiredPayments(): Promise<{ cleaned: number; errors: number }> {
    try {
      const now = new Date().toISOString();
      let cleaned = 0;
      let errors = 0;

      // تنظيف مدفوعات SADAD المنتهية الصلاحية
      try {
        const { data: expiredSadadPayments } = await supabase
          .from('sadad_payments')
          .select('id')
          .eq('sadad_status', 'pending')
          .lt('expires_at', now);

        if (expiredSadadPayments && expiredSadadPayments.length > 0) {
          const { error } = await supabase
            .from('sadad_payments')
            .update({ sadad_status: 'expired' })
            .in('id', expiredSadadPayments.map(p => p.id));

          if (error) {
            console.error('Error updating expired SADAD payments:', error);
            errors += expiredSadadPayments.length;
          } else {
            cleaned += expiredSadadPayments.length;
          }
        }
      } catch (error) {
        console.error('Error processing expired SADAD payments:', error);
        errors++;
      }

      // تنظيف الذاكرة المؤقتة بعد التنظيف
      if (cleaned > 0) {
        this.clearCache();
      }

      return { cleaned, errors };
    } catch (error) {
      console.error('Error in cleanup process:', error);
      return { cleaned: 0, errors: 1 };
    }
  }

  async retryFailedPayments(maxRetries: number = 3): Promise<{ retried: number; failed: number }> {
    try {
      let retriedCount = 0;
      let stillFailedCount = 0;

      // إعادة المحاولة لمدفوعات SaaS الفاشلة
      const failedSaasPayments = await this.getSaasPayments({ status: 'failed' });
      
      for (const payment of failedSaasPayments) {
        try {
          await this.updateSaasPaymentStatus(payment.id, 'processing');
          retriedCount++;
        } catch (error) {
          console.error(`Failed to retry SaaS payment ${payment.id}:`, error);
          stillFailedCount++;
        }
      }

      // إعادة المحاولة لمدفوعات SADAD الفاشلة
      const failedSadadPayments = await this.getSadadPayments({ status: 'failed' });
      
      for (const payment of failedSadadPayments) {
        try {
          await this.updateSadadPaymentStatus(payment.id, 'pending');
          retriedCount++;
        } catch (error) {
          console.error(`Failed to retry SADAD payment ${payment.id}:`, error);
          stillFailedCount++;
        }
      }

      return { retried: retriedCount, failed: stillFailedCount };
    } catch (error) {
      console.error('Error in retry process:', error);
      throw error;
    }
  }

  // تنظيف الذاكرة المؤقتة يدوياً
  clearAllCache(): void {
    this.cache.clear();
    console.log('تم تنظيف جميع بيانات الذاكرة المؤقتة للدفع');
  }

  // الحصول على حالة الذاكرة المؤقتة
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// إنشاء مثيل مشترك للخدمة
export const unifiedPaymentService = new UnifiedPaymentService();