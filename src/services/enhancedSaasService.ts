import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanCode } from '@/types/subscription-plans';
import type { 
  SubscriptionPlan, 
  SaasSubscription, 
  SaasInvoice, 
  SaasPayment,
  TenantUsage,
  SaasBillingStats
} from '@/types/unified-saas';

/**
 * خدمة SaaS محسنة ومتوافقة مع النظام الجديد
 */
export class EnhancedSaasService {
  
  // =======================================================
  // خطط الاشتراك (Subscription Plans)
  // =======================================================

  /**
   * الحصول على جميع خطط الاشتراك النشطة
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('خطأ في جلب خطط الاشتراك:', error);
        
        // إرجاع الخطط الافتراضية في حالة الخطأ
        return this.getDefaultPlans();
      }

      return data || this.getDefaultPlans();
    } catch (error) {
      console.error('خطأ في خدمة خطط الاشتراك:', error);
      return this.getDefaultPlans();
    }
  }

  /**
   * الحصول على خطة اشتراك محددة
   */
  async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (error) {
        console.error('خطأ في جلب خطة الاشتراك:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('خطأ في خدمة خطة الاشتراك:', error);
      return null;
    }
  }

  /**
   * إنشاء خطة اشتراك جديدة
   */
  async createSubscriptionPlan(planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([{
          ...planData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`فشل في إنشاء خطة الاشتراك: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('خطأ في إنشاء خطة الاشتراك:', error);
      throw error;
    }
  }

  /**
   * تحديث خطة اشتراك
   */
  async updateSubscriptionPlan(planId: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', planId)
        .select()
        .single();

      if (error) {
        throw new Error(`فشل في تحديث خطة الاشتراك: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('خطأ في تحديث خطة الاشتراك:', error);
      throw error;
    }
  }

  /**
   * حذف خطة اشتراك
   */
  async deleteSubscriptionPlan(planId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        throw new Error(`فشل في حذف خطة الاشتراك: ${error.message}`);
      }

      return true;
    } catch (error: any) {
      console.error('خطأ في حذف خطة الاشتراك:', error);
      throw error;
    }
  }

  // =======================================================
  // الاشتراكات (SaaS Subscriptions)
  // =======================================================

  /**
   * الحصول على اشتراكات المؤسسة
   */
  async getTenantSubscriptions(tenantId: string): Promise<SaasSubscription[]> {
    try {
      const { data, error } = await supabase
        .from('saas_subscriptions')
        .select(`
          *,
          tenant:tenants(id, name, contact_email),
          plan:subscription_plans(*)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب اشتراكات المؤسسة:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('خطأ في خدمة اشتراكات المؤسسة:', error);
      return [];
    }
  }

  /**
   * إنشاء اشتراك جديد
   */
  async createSubscription(subscriptionData: {
    tenant_id: string;
    plan_id: string;
    billing_cycle: 'monthly' | 'yearly';
    trial_days?: number;
  }): Promise<SaasSubscription> {
    try {
      // الحصول على معلومات الخطة
      const plan = await this.getSubscriptionPlan(subscriptionData.plan_id);
      if (!plan) {
        throw new Error('خطة الاشتراك غير موجودة');
      }

      const now = new Date();
      const amount = subscriptionData.billing_cycle === 'yearly' 
        ? plan.price_yearly 
        : plan.price_monthly;

      // حساب التواريخ
      const current_period_start = now.toISOString().split('T')[0];
      const current_period_end = new Date(
        subscriptionData.billing_cycle === 'yearly' 
          ? now.getFullYear() + 1 
          : now.getFullYear(),
        subscriptionData.billing_cycle === 'yearly' 
          ? now.getMonth() 
          : now.getMonth() + 1,
        now.getDate()
      ).toISOString().split('T')[0];
      
      const trial_ends_at = subscriptionData.trial_days 
        ? new Date(now.getTime() + (subscriptionData.trial_days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
        : null;

      const { data, error } = await supabase
        .from('saas_subscriptions')
        .insert([{
          tenant_id: subscriptionData.tenant_id,
          plan_id: subscriptionData.plan_id,
          status: trial_ends_at ? 'trialing' : 'active',
          billing_cycle: subscriptionData.billing_cycle,
          current_period_start,
          current_period_end,
          next_billing_date: current_period_end,
          trial_ends_at,
          amount,
          currency: 'KWD',
          discount_percentage: 0,
          auto_renew: true,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`فشل في إنشاء الاشتراك: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('خطأ في إنشاء الاشتراك:', error);
      throw error;
    }
  }

  /**
   * تحديث حالة الاشتراك
   */
  async updateSubscriptionStatus(
    subscriptionId: string, 
    status: SaasSubscription['status'],
    reason?: string
  ): Promise<SaasSubscription> {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'canceled' && reason) {
        updates.canceled_at = new Date().toISOString();
        updates.cancellation_reason = reason;
      }

      const { data, error } = await supabase
        .from('saas_subscriptions')
        .update(updates)
        .eq('id', subscriptionId)
        .select()
        .single();

      if (error) {
        throw new Error(`فشل في تحديث حالة الاشتراك: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('خطأ في تحديث حالة الاشتراك:', error);
      throw error;
    }
  }

  // =======================================================
  // الفواتير (SaaS Invoices)
  // =======================================================

  /**
   * إنشاء فاتورة للاشتراك
   */
  async createInvoiceForSubscription(subscriptionId: string): Promise<SaasInvoice> {
    try {
      // الحصول على معلومات الاشتراك
      const { data: subscription, error: subError } = await supabase
        .from('saas_subscriptions')
        .select(`
          *,
          tenant:tenants(id, name, contact_email),
          plan:subscription_plans(*)
        `)
        .eq('id', subscriptionId)
        .single();

      if (subError || !subscription) {
        throw new Error('الاشتراك غير موجود');
      }

      const now = new Date();
      const dueDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 يوم

      const { data, error } = await supabase
        .from('saas_invoices')
        .insert([{
          subscription_id: subscriptionId,
          tenant_id: subscription.tenant_id,
          status: 'draft',
          invoice_date: now.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          subtotal: subscription.amount,
          tax_rate: 0,
          tax_amount: 0,
          discount_percentage: subscription.discount_percentage || 0,
          discount_amount: (subscription.amount * (subscription.discount_percentage || 0)) / 100,
          total_amount: subscription.amount - ((subscription.amount * (subscription.discount_percentage || 0)) / 100),
          paid_amount: 0,
          currency: subscription.currency || 'KWD',
          billing_period_start: subscription.current_period_start,
          billing_period_end: subscription.current_period_end,
          notes: `فاتورة اشتراك ${subscription.plan?.plan_name}`,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`فشل في إنشاء الفاتورة: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('خطأ في إنشاء الفاتورة:', error);
      throw error;
    }
  }

  /**
   * الحصول على فواتير المؤسسة
   */
  async getTenantInvoices(tenantId: string): Promise<SaasInvoice[]> {
    try {
      const { data, error } = await supabase
        .from('saas_invoices')
        .select(`
          *,
          tenant:tenants(id, name, contact_email),
          subscription:saas_subscriptions(id, plan_id),
          items:saas_invoice_items(*),
          payments:saas_payments(*)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب فواتير المؤسسة:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('خطأ في خدمة فواتير المؤسسة:', error);
      return [];
    }
  }

  // =======================================================
  // الإحصائيات والتحليلات
  // =======================================================

  /**
   * الحصول على إحصائيات الفوترة
   */
  async getBillingStats(): Promise<SaasBillingStats> {
    try {
      const [subscriptions, invoices, payments, tenants] = await Promise.all([
        supabase.from('saas_subscriptions').select('status, amount, currency'),
        supabase.from('saas_invoices').select('status, total_amount, currency'),
        supabase.from('saas_payments').select('status, amount, currency'),
        supabase.from('tenants').select('status'),
      ]);

      const subscriptionsData = subscriptions.data || [];
      const invoicesData = invoices.data || [];
      const paymentsData = payments.data || [];
      const tenantsData = tenants.data || [];

      const totalRevenue = paymentsData
        .filter(p => p.status === 'succeeded')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const stats: SaasBillingStats = {
        // الإيرادات
        total_revenue: totalRevenue,
        monthly_revenue: 0, // يمكن تحسينه لاحقاً
        yearly_revenue: 0,

        // الاشتراكات
        active_subscriptions: subscriptionsData.filter(s => s.status === 'active').length,
        trial_subscriptions: subscriptionsData.filter(s => s.status === 'trialing').length,
        canceled_subscriptions: subscriptionsData.filter(s => s.status === 'canceled').length,
        total_subscriptions: subscriptionsData.length,

        // الفواتير
        pending_invoices: invoicesData.filter(i => ['sent', 'draft'].includes(i.status)).length,
        overdue_invoices: invoicesData.filter(i => i.status === 'overdue').length,
        paid_invoices: invoicesData.filter(i => i.status === 'paid').length,
        total_invoices: invoicesData.length,

        // المؤسسات
        total_tenants: tenantsData.length,
        active_tenants: tenantsData.filter(t => t.status === 'active').length,

        // معدلات
        growth_rate: 0,
        churn_rate: 0,

        // متوسطات
        average_revenue_per_user: subscriptionsData.length > 0 
          ? subscriptionsData.reduce((sum, s) => sum + (s.amount || 0), 0) / subscriptionsData.length 
          : 0,
        average_subscription_value: subscriptionsData.length > 0
          ? subscriptionsData.reduce((sum, s) => sum + (s.amount || 0), 0) / subscriptionsData.length
          : 0,
      };

      return stats;
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الفوترة:', error);
      
      // إرجاع إحصائيات فارغة في حالة الخطأ
      return {
        total_revenue: 0,
        monthly_revenue: 0,
        yearly_revenue: 0,
        active_subscriptions: 0,
        trial_subscriptions: 0,
        canceled_subscriptions: 0,
        total_subscriptions: 0,
        pending_invoices: 0,
        overdue_invoices: 0,
        paid_invoices: 0,
        total_invoices: 0,
        total_tenants: 0,
        active_tenants: 0,
        growth_rate: 0,
        churn_rate: 0,
        average_revenue_per_user: 0,
        average_subscription_value: 0,
      };
    }
  }

  /**
   * تحديث استخدام المؤسسة
   */
  async updateTenantUsage(tenantId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('update_tenant_usage', { tenant_id_param: tenantId });

      if (error) {
        console.error('خطأ في تحديث استخدام المؤسسة:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('خطأ في خدمة تحديث الاستخدام:', error);
      return null;
    }
  }

  // =======================================================
  // دوال مساعدة خاصة
  // =======================================================

  /**
   * الحصول على الخطط الافتراضية
   */
  private getDefaultPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      id: plan.code,
      plan_name: plan.name,
      plan_name_en: plan.name_en,
      plan_code: plan.code,
      description: plan.description,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_users_per_tenant: plan.limits.max_users_per_tenant,
      max_vehicles: plan.limits.max_vehicles,
      max_contracts: plan.limits.max_contracts,
      storage_limit_gb: plan.limits.storage_limit_gb,
      features: plan.features,
      is_active: true,
      is_popular: plan.is_popular,
      sort_order: plan.sort_order,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }

  /**
   * تنسيق المبلغ بالعملة الكويتية
   */
  formatCurrency(amount: number, currency = 'KWD'): string {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  }

  /**
   * حساب التوفير في الاشتراك السنوي
   */
  calculateYearlySavings(plan: SubscriptionPlan): number {
    const monthlyTotal = plan.price_monthly * 12;
    const yearlyTotal = plan.price_yearly;
    return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
  }
}

// إنشاء مثيل واحد للخدمة
export const enhancedSaasService = new EnhancedSaasService();

// تصدير افتراضي
export default enhancedSaasService; 