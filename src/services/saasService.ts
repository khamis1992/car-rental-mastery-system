import { supabase } from '@/integrations/supabase/client';
import { 
  SubscriptionPlan, 
  SaasSubscription, 
  SaasInvoice,
  SaasPayment,
  TenantUsage,
  PlanFormData,
  SubscriptionFormData,
  SubscriptionUpdateData,
  CreateInvoiceFormData,
  CreatePaymentFormData,
  SadadPaymentRequest,
  SadadPaymentResponse,
  SaasBillingStats,
  BillingProcessResult,
  UsageUpdateData,
  SAAS_CONSTANTS,
  calculateInvoiceTotal,
  calculateTaxAmount,
  calculateDiscountAmount,
  calculateNextBillingDate,
  formatCurrency
} from '@/types/unified-saas';

// =======================================================
// خدمة SaaS المحسنة والموحدة
// =======================================================

export class EnhancedSaasService {
  // إدارة الذاكرة المؤقتة مع TTL محسن
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 دقائق
  private readonly PLANS_CACHE_TTL = 10 * 60 * 1000; // 10 دقائق للخطط
  private readonly STATS_CACHE_TTL = 2 * 60 * 1000; // دقيقتان للإحصائيات

  // =======================================================
  // دوال مساعدة للذاكرة المؤقتة
  // =======================================================

  private getCacheKey(prefix: string, ...params: string[]): string {
    return `${prefix}:${params.join(':')}`;
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
  // إدارة خطط الاشتراك المحسنة
  // =======================================================

  async getSubscriptionPlans(useCache: boolean = true): Promise<SubscriptionPlan[]> {
    const cacheKey = this.getCacheKey('plans', 'active');
    
    if (useCache) {
      const cached = this.getCache<SubscriptionPlan[]>(cacheKey);
      if (cached) return cached;
    }

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw new Error(`فشل في جلب خطط الاشتراك: ${error.message}`);
    
    const plans = (data || []) as SubscriptionPlan[];
    this.setCache(cacheKey, plans, this.PLANS_CACHE_TTL);
    
    return plans;
  }

  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const cacheKey = this.getCacheKey('plans', 'all');
    const cached = this.getCache<SubscriptionPlan[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw new Error(`فشل في جلب جميع خطط الاشتراك: ${error.message}`);
    
    const plans = (data || []) as SubscriptionPlan[];
    this.setCache(cacheKey, plans, this.PLANS_CACHE_TTL);
    
    return plans;
  }

  async getSubscriptionPlanById(planId: string): Promise<SubscriptionPlan> {
    const cacheKey = this.getCacheKey('plan', planId);
    const cached = this.getCache<SubscriptionPlan>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) throw new Error(`فشل في جلب خطة الاشتراك: ${error.message}`);
    
    const plan = data as SubscriptionPlan;
    this.setCache(cacheKey, plan, this.PLANS_CACHE_TTL);
    
    return plan;
  }

  async createSubscriptionPlan(planData: PlanFormData): Promise<SubscriptionPlan> {
    // التحقق من عدم وجود خطة بنفس الكود
    const existingPlan = await this.checkPlanCodeExists(planData.plan_code);
    if (existingPlan) {
      throw new Error('كود الخطة موجود مسبقاً');
    }

    const { data: user } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        ...planData,
        is_active: true,
        created_by: user.user?.id
      })
      .select()
      .single();

    if (error) throw new Error(`فشل في إنشاء خطة الاشتراك: ${error.message}`);
    
    // تنظيف الذاكرة المؤقتة
    this.clearCache('plans');
    
    return data as SubscriptionPlan;
  }

  async updateSubscriptionPlan(planId: string, planData: Partial<PlanFormData>): Promise<SubscriptionPlan> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update(planData)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw new Error(`فشل في تحديث خطة الاشتراك: ${error.message}`);
    
    // تنظيف الذاكرة المؤقتة
    this.clearCache('plans');
    this.clearCache('plan');
    
    return data as SubscriptionPlan;
  }

  async deleteSubscriptionPlan(planId: string): Promise<void> {
    // التحقق من عدم وجود اشتراكات نشطة لهذه الخطة
    const activeSubscriptions = await this.getActiveSubscriptionsByPlan(planId);
    if (activeSubscriptions.length > 0) {
      throw new Error('لا يمكن حذف خطة تحتوي على اشتراكات نشطة');
    }

    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: false })
      .eq('id', planId);

    if (error) throw new Error(`فشل في حذف خطة الاشتراك: ${error.message}`);
    
    // تنظيف الذاكرة المؤقتة
    this.clearCache('plans');
  }

  private async checkPlanCodeExists(planCode: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('plan_code', planCode)
      .limit(1);

    if (error) throw new Error(`فشل في التحقق من كود الخطة: ${error.message}`);
    
    return (data || []).length > 0;
  }

  private async getActiveSubscriptionsByPlan(planId: string): Promise<SaasSubscription[]> {
    const { data, error } = await supabase
      .from('saas_subscriptions')
      .select('*')
      .eq('plan_id', planId)
      .in('status', ['active', 'trialing']);

    if (error) throw new Error(`فشل في جلب الاشتراكات النشطة: ${error.message}`);
    
    // Map database fields to interface
    return (data || []).map(sub => ({
      id: sub.id,
      tenant_id: sub.tenant_id,
      plan_id: sub.plan_id,
      status: sub.status,
      billing_cycle: sub.billing_cycle,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      next_billing_date: sub.current_period_end,
      trial_ends_at: sub.trial_end,
      amount: sub.amount,
      currency: sub.currency,
      discount_percentage: 0,
      auto_renew: true, // Default since field doesn't exist in DB
      canceled_at: sub.canceled_at,
      cancellation_reason: undefined, // Field doesn't exist in DB
      stripe_subscription_id: sub.stripe_subscription_id,
      stripe_customer_id: sub.stripe_customer_id,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
      created_by: sub.created_at // Use created_at as fallback
    })) as SaasSubscription[];
  }

  // =======================================================
  // إدارة الاشتراكات المحسنة
  // =======================================================

  async getTenantSubscriptions(tenantId?: string): Promise<SaasSubscription[]> {
    const cacheKey = this.getCacheKey('subscriptions', tenantId || 'all');
    const cached = this.getCache<SaasSubscription[]>(cacheKey);
    if (cached) return cached;

    let query = supabase
      .from('saas_subscriptions')
      .select(`
        *,
        tenant:tenants(id, name, email),
        plan:subscription_plans(*)
      `);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`فشل في جلب الاشتراكات: ${error.message}`);
    
    const subscriptions = (data || []) as unknown as SaasSubscription[];
    this.setCache(cacheKey, subscriptions);
    
    return subscriptions;
  }

  async getSubscriptionById(subscriptionId: string): Promise<SaasSubscription> {
    const cacheKey = this.getCacheKey('subscription', subscriptionId);
    const cached = this.getCache<SaasSubscription>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('saas_subscriptions')
      .select(`
        *,
        tenant:tenants(id, name, email),
        plan:subscription_plans(*)
      `)
      .eq('id', subscriptionId)
      .single();

    if (error) throw new Error(`فشل في جلب الاشتراك: ${error.message}`);
    
    const subscription = data as unknown as SaasSubscription;
    this.setCache(cacheKey, subscription);
    
    return subscription;
  }

  async createSubscription(subscriptionData: SubscriptionFormData): Promise<SaasSubscription> {
    // جلب معلومات الخطة
    const plan = await this.getSubscriptionPlanById(subscriptionData.plan_id);
    
    // حساب التواريخ
    const now = new Date();
    const periodStart = now;
    const trialEnd = subscriptionData.trial_days ? 
      new Date(now.getTime() + subscriptionData.trial_days * 24 * 60 * 60 * 1000) : 
      undefined;

    const periodEnd = calculateNextBillingDate(periodStart, subscriptionData.billing_cycle);
    const nextBillingDate = calculateNextBillingDate(periodEnd, subscriptionData.billing_cycle);

    // حساب المبلغ
    const amount = subscriptionData.billing_cycle === 'monthly' ? 
      plan.price_monthly : 
      plan.price_yearly;

    const finalAmount = calculateDiscountAmount(amount, subscriptionData.discount_percentage || 0);

    const { data, error } = await supabase
      .from('saas_subscriptions')
      .insert({
        tenant_id: subscriptionData.tenant_id,
        plan_id: subscriptionData.plan_id,
        status: trialEnd ? 'trialing' : 'active',
        billing_cycle: subscriptionData.billing_cycle,
        current_period_start: periodStart.toISOString().split('T')[0],
        current_period_end: periodEnd.toISOString().split('T')[0],
        next_billing_date: nextBillingDate.toISOString().split('T')[0],
        trial_ends_at: trialEnd?.toISOString().split('T')[0],
        amount: finalAmount,
        currency: SAAS_CONSTANTS.DEFAULT_CURRENCY,
        discount_percentage: subscriptionData.discount_percentage || 0,
        auto_renew: subscriptionData.auto_renew ?? true
      })
      .select(`
        *,
        tenant:tenants(id, name, email),
        plan:subscription_plans(*)
      `)
      .single();

    if (error) throw new Error(`فشل في إنشاء الاشتراك: ${error.message}`);
    
    // تنظيف الذاكرة المؤقتة
    this.clearCache('subscriptions');
    
    return data as unknown as SaasSubscription;
  }

  async updateSubscription(subscriptionId: string, updates: SubscriptionUpdateData): Promise<SaasSubscription> {
    const { data, error } = await supabase
      .from('saas_subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select(`
        *,
        tenant:tenants(id, name, email),
        plan:subscription_plans(*)
      `)
      .single();

    if (error) throw new Error(`فشل في تحديث الاشتراك: ${error.message}`);
    
    // تنظيف الذاكرة المؤقتة
    this.clearCache('subscriptions');
    this.clearCache('subscription');
    
    return data as unknown as SaasSubscription;
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    const updates: SubscriptionUpdateData = {
      status: 'canceled',
      cancellation_reason: reason
    };

    await this.updateSubscription(subscriptionId, updates);
  }

  async pauseSubscription(subscriptionId: string): Promise<void> {
    await this.updateSubscription(subscriptionId, { status: 'paused' });
  }

  async resumeSubscription(subscriptionId: string): Promise<void> {
    await this.updateSubscription(subscriptionId, { status: 'active' });
  }

  // =======================================================
  // إدارة الفواتير المحسنة
  // =======================================================

  async getSaasInvoices(tenantId?: string, limit?: number): Promise<SaasInvoice[]> {
    const cacheKey = this.getCacheKey('invoices', tenantId || 'all', limit?.toString() || 'all');
    const cached = this.getCache<SaasInvoice[]>(cacheKey);
    if (cached) return cached;

    let query = supabase
      .from('saas_invoices')
      .select(`
        *,
        subscription:saas_subscriptions(*),
        tenant:tenants(id, name, email),
        items:saas_invoice_items(*),
        payments:saas_payments(*)
      `);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`فشل في جلب الفواتير: ${error.message}`);
    
    const invoices = (data || []) as unknown as SaasInvoice[];
    this.setCache(cacheKey, invoices);
    
    return invoices;
  }

  async createInvoice(invoiceData: CreateInvoiceFormData): Promise<SaasInvoice> {
    // توليد رقم الفاتورة
    const { data: invoiceNumber } = await supabase.rpc('generate_saas_invoice_number');
    
    const { data: user } = await supabase.auth.getUser();

    // حساب المبلغ الإجمالي إذا لم يكن محدداً
    const totalAmount = invoiceData.total_amount || calculateInvoiceTotal(
      invoiceData.subtotal,
      invoiceData.tax_amount || 0,
      invoiceData.discount_amount || 0
    );

    const { data, error } = await supabase
      .from('saas_invoices')
      .insert({
        subscription_id: invoiceData.subscription_id,
        tenant_id: invoiceData.tenant_id,
        invoice_number: invoiceNumber,
        status: 'draft',
        subtotal: invoiceData.subtotal,
        tax_amount: invoiceData.tax_amount || 0,
        discount_amount: invoiceData.discount_amount || 0,
        total_amount: totalAmount,
        currency: invoiceData.currency,
        billing_period_start: invoiceData.billing_period_start,
        billing_period_end: invoiceData.billing_period_end,
        due_date: invoiceData.due_date,
        description: invoiceData.description,
        created_by: user.user?.id
      })
      .select(`
        *,
        subscription:saas_subscriptions(*),
        tenant:tenants(id, name, email),
        items:saas_invoice_items(*),
        payments:saas_payments(*)
      `)
      .single();

    if (error) throw new Error(`فشل في إنشاء الفاتورة: ${error.message}`);

    // إضافة عناصر الفاتورة إذا كانت موجودة
    if (invoiceData.items && invoiceData.items.length > 0) {
      await this.addInvoiceItems(data.id, invoiceData.items);
    }
    
    // تنظيف الذاكرة المؤقتة
    this.clearCache('invoices');
    
    return data as unknown as SaasInvoice;
  }

  private async addInvoiceItems(invoiceId: string, items: any[]): Promise<void> {
    const { error } = await supabase
      .from('saas_invoice_items')
      .insert(
        items.map(item => ({
          invoice_id: invoiceId,
          ...item
        }))
      );

    if (error) throw new Error(`فشل في إضافة عناصر الفاتورة: ${error.message}`);
  }

  async updateInvoiceStatus(invoiceId: string, status: SaasInvoice['status']): Promise<void> {
    const updates: any = { status };
    
    if (status === 'paid') {
      updates.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('saas_invoices')
      .update(updates)
      .eq('id', invoiceId);

    if (error) throw new Error(`فشل في تحديث حالة الفاتورة: ${error.message}`);
    
    // تنظيف الذاكرة المؤقتة
    this.clearCache('invoices');
  }

  // =======================================================
  // إدارة المدفوعات المحسنة
  // =======================================================

  async getSaasPayments(tenantId?: string): Promise<SaasPayment[]> {
    const cacheKey = this.getCacheKey('payments', tenantId || 'all');
    const cached = this.getCache<SaasPayment[]>(cacheKey);
    if (cached) return cached;

    let query = supabase
      .from('saas_payments')
      .select(`
        *,
        invoice:saas_invoices(*),
        subscription:saas_subscriptions(*),
        tenant:tenants(id, name, email)
      `);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`فشل في جلب المدفوعات: ${error.message}`);
    
    const payments = (data || []) as unknown as SaasPayment[];
    this.setCache(cacheKey, payments);
    
    return payments;
  }

  async createPayment(paymentData: CreatePaymentFormData): Promise<SaasPayment> {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('saas_payments')
      .insert({
        amount: paymentData.amount,
        currency: paymentData.currency,
        // failure_reason: paymentData.failure_reason, // Commented out as this field doesn't exist
        invoice_id: paymentData.invoice_id,
        metadata: paymentData.metadata,
        payment_method: paymentData.payment_method,
        subscription_id: paymentData.subscription_id,
        tenant_id: paymentData.tenant_id,
        status: 'pending'
      })
      .select(`
        *,
        invoice:saas_invoices(*),
        subscription:saas_subscriptions(*),
        tenant:tenants(id, name, email)
      `)
      .single();

    if (error) throw new Error(`فشل في إنشاء المدفوعة: ${error.message}`);
    
    // تنظيف الذاكرة المؤقتة
    this.clearCache('payments');
    
    return data as unknown as SaasPayment;
  }

  // دفع SADAD المحسن
  async createSadadPayment(paymentData: SadadPaymentRequest): Promise<SadadPaymentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('sadad-create-payment', {
        body: paymentData
      });

      if (error) throw error;
      
      return data as SadadPaymentResponse;
    } catch (error) {
      throw new Error(`فشل في إنشاء دفعة SADAD: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }

  async updatePaymentStatus(
    paymentId: string, 
    status: SaasPayment['status'],
    metadata?: any
  ): Promise<void> {
    const updates: any = { status };
    
    if (status === 'succeeded') {
      updates.paid_at = new Date().toISOString();
    }
    
    if (metadata) {
      updates.metadata = metadata;
    }

    const { error } = await supabase
      .from('saas_payments')
      .update(updates)
      .eq('id', paymentId);

    if (error) throw new Error(`فشل في تحديث حالة المدفوعة: ${error.message}`);
    
    // تنظيف الذاكرة المؤقتة
    this.clearCache('payments');
  }

  // =======================================================
  // إدارة استخدام المؤسسات المحسنة
  // =======================================================

  async getTenantUsage(tenantId?: string, limit: number = 30): Promise<TenantUsage[]> {
    const cacheKey = this.getCacheKey('usage', tenantId || 'all', limit.toString());
    const cached = this.getCache<TenantUsage[]>(cacheKey);
    if (cached) return cached;

    let query = supabase
      .from('tenant_usage')
      .select(`
        *,
        tenant:tenants(id, name)
      `);

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query
      .order('usage_date', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`فشل في جلب بيانات الاستخدام: ${error.message}`);
    
    const usage = (data || []) as TenantUsage[];
    this.setCache(cacheKey, usage);
    
    return usage;
  }

  async updateTenantUsage(tenantId: string, usageData: UsageUpdateData): Promise<TenantUsage> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('tenant_usage')
      .upsert({
        tenant_id: tenantId,
        usage_date: today,
        ...usageData
      })
      .select(`
        *,
        tenant:tenants(id, name)
      `)
      .single();

    if (error) throw new Error(`فشل في تحديث بيانات الاستخدام: ${error.message}`);
    
    // تنظيف الذاكرة المؤقتة
    this.clearCache('usage');
    
    return data as TenantUsage;
  }

  async calculateCurrentUsage(tenantId: string): Promise<UsageUpdateData> {
    // حساب الاستخدام الحالي من الجداول الفعلية
    // استخدام استعلام مباشر بدلاً من RPC غير موجود
    const { data: invoices } = await supabase
      .from('saas_invoices')
      .select('amount_due')
      .eq('tenant_id', tenantId);
    
    const { data: subscriptions } = await supabase
      .from('saas_subscriptions')
      .select('amount')
      .eq('tenant_id', tenantId);

    return {
      total_invoices: invoices?.length || 0,
      total_revenue: invoices?.reduce((sum, inv) => sum + inv.amount_due, 0) || 0,
      active_subscriptions: subscriptions?.length || 0
    } as UsageUpdateData;
  }

  async syncTenantUsage(tenantId: string): Promise<void> {
    const usageData = await this.calculateCurrentUsage(tenantId);
    
    // تحديث إحصائيات الاستخدام في جدول tenant_usage بدلاً من جدول غير موجود
    await supabase
      .from('tenant_usage')
      .upsert({
        tenant_id: tenantId,
        usage_date: new Date().toISOString().split('T')[0],
        ...usageData
      });
    
    // تنظيف الذاكرة المؤقتة
    this.clearCache('usage');
  }

  // =======================================================
  // الإحصائيات والتقارير المحسنة
  // =======================================================

  async getBillingStats(): Promise<SaasBillingStats> {
    const cacheKey = this.getCacheKey('stats', 'billing');
    const cached = this.getCache<SaasBillingStats>(cacheKey);
    if (cached) return cached;

    // تنفيذ جميع الاستعلامات بشكل متوازي لتحسين الأداء
    const [
      totalRevenueResult,
      monthlyRevenueResult,
      activeSubscriptionsResult,
      trialSubscriptionsResult,
      canceledSubscriptionsResult,
      overdueInvoicesResult,
      totalTenantsResult
    ] = await Promise.all([
      // إجمالي الإيرادات
      supabase
        .from('saas_payments')
        .select('amount')
        .eq('status', 'succeeded'),
      
      // الإيرادات الشهرية
      supabase
        .from('saas_payments')
        .select('amount')
        .eq('status', 'succeeded')
        .gte('paid_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      
      // الاشتراكات النشطة
      supabase
        .from('saas_subscriptions')
        .select('*', { count: 'exact' })
        .eq('status', 'active'),
      
      // الاشتراكات التجريبية
      supabase
        .from('saas_subscriptions')
        .select('*', { count: 'exact' })
        .eq('status', 'trialing'),
      
      // الاشتراكات الملغاة
      supabase
        .from('saas_subscriptions')
        .select('*', { count: 'exact' })
        .eq('status', 'canceled'),
      
      // الفواتير المتأخرة
      supabase
        .from('saas_invoices')
        .select('*', { count: 'exact' })
        .eq('status', 'sent')
        .lt('due_date', new Date().toISOString()),
      
      // إجمالي المؤسسات
      supabase
        .from('tenants')
        .select('*', { count: 'exact' })
        .eq('status', 'active')
    ]);

    const stats: SaasBillingStats = {
      total_revenue: totalRevenueResult.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
      monthly_revenue: monthlyRevenueResult.data?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
      yearly_revenue: 0, // سيحسب لاحقاً
      active_subscriptions: activeSubscriptionsResult.count || 0,
      trial_subscriptions: trialSubscriptionsResult.count || 0,
      canceled_subscriptions: canceledSubscriptionsResult.count || 0,
      total_subscriptions: (activeSubscriptionsResult.count || 0) + (trialSubscriptionsResult.count || 0) + (canceledSubscriptionsResult.count || 0),
      pending_invoices: 0,
      overdue_invoices: overdueInvoicesResult.count || 0,
      paid_invoices: 0,
      total_invoices: 0,
      total_tenants: totalTenantsResult.count || 0,
      active_tenants: totalTenantsResult.count || 0,
      growth_rate: 0, // سيحسب بناءً على البيانات التاريخية
      churn_rate: 0,
      average_revenue_per_user: 0,
      average_subscription_value: 0
    };

    // حساب المتوسطات
    if (stats.total_tenants > 0) {
      stats.average_revenue_per_user = stats.total_revenue / stats.total_tenants;
    }

    if (stats.total_subscriptions > 0) {
      stats.average_subscription_value = stats.total_revenue / stats.total_subscriptions;
    }

    this.setCache(cacheKey, stats, this.STATS_CACHE_TTL);
    
    return stats;
  }

  // =======================================================
  // معالجة الفوترة التلقائية
  // =======================================================

  async processAutomaticBilling(): Promise<BillingProcessResult> {
    try {
      const { data, error } = await supabase.functions.invoke('automatic-billing');
      
      if (error) throw error;
      
      // تنظيف الذاكرة المؤقتة بعد المعالجة
      this.clearCache();
      
      return data as BillingProcessResult;
    } catch (error) {
      throw new Error(`فشل في معالجة الفوترة التلقائية: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }

  // =======================================================
  // دوال مساعدة إضافية
  // =======================================================

  async getUpcomingRenewals(days: number = 7): Promise<SaasSubscription[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const { data, error } = await supabase
      .from('saas_subscriptions')
      .select('*')
      .eq('status', 'active')
      .lte('current_period_end', endDate.toISOString().split('T')[0]);

    if (error) throw new Error(`فشل في جلب التجديدات القادمة: ${error.message}`);
    
    return (data || []) as unknown as SaasSubscription[];
  }

  async getOverdueInvoices(): Promise<SaasInvoice[]> {
    const { data, error } = await supabase
      .from('saas_invoices')
      .select(`
        *,
        subscription:saas_subscriptions(*),
        tenant:tenants(id, name, email)
      `)
      .eq('status', 'sent')
      .lt('due_date', new Date().toISOString());

    if (error) throw new Error(`فشل في جلب الفواتير المتأخرة: ${error.message}`);
    
    return (data || []) as unknown as SaasInvoice[];
  }

  // =======================================================
  // تنظيف الموارد
  // =======================================================

  dispose(): void {
    this.cache.clear();
  }
}

// إنشاء instance وحيد للخدمة
export const enhancedSaasService = new EnhancedSaasService();

// إعادة تصدير للتوافق مع الكود الموجود
export const saasService = enhancedSaasService;