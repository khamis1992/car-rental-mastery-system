import { supabase } from '@/integrations/supabase/client';
import { 
  SubscriptionPlan, 
  SaasSubscription, 
  SaasInvoice,
  SaasPayment,
  TenantUsage,
  PlanFormData,
  SubscriptionFormData,
  SaasBillingStats
} from '@/types/saas';

export class SaasService {
  // إدارة خطط الاشتراك
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as SubscriptionPlan[];
  }

  async createSubscriptionPlan(planData: PlanFormData): Promise<SubscriptionPlan> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert({
        ...planData,
        is_active: true,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as SubscriptionPlan;
  }

  async updateSubscriptionPlan(planId: string, planData: Partial<PlanFormData>): Promise<SubscriptionPlan> {
    const { data, error } = await supabase
      .from('subscription_plans')
      .update(planData)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data as SubscriptionPlan;
  }

  async deleteSubscriptionPlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('subscription_plans')
      .update({ is_active: false })
      .eq('id', planId);

    if (error) throw error;
  }

  // إدارة الاشتراكات
  async getTenantSubscriptions(): Promise<SaasSubscription[]> {
    const { data, error } = await supabase
      .from('saas_subscriptions')
      .select(`
        *,
        tenant:tenants(*),
        plan:subscription_plans(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as SaasSubscription[];
  }

  async createSubscription(subscriptionData: SubscriptionFormData): Promise<SaasSubscription> {
    const { data, error } = await supabase
      .from('saas_subscriptions')
      .insert({
        ...subscriptionData,
        status: 'trialing'
      })
      .select(`
        *,
        tenant:tenants(*),
        plan:subscription_plans(*)
      `)
      .single();

    if (error) throw error;
    return data as unknown as SaasSubscription;
  }

  async updateSubscription(subscriptionId: string, updates: Partial<SaasSubscription>): Promise<SaasSubscription> {
    const { data, error } = await supabase
      .from('saas_subscriptions')
      .update(updates)
      .eq('id', subscriptionId)
      .select(`
        *,
        tenant:tenants(*),
        plan:subscription_plans(*)
      `)
      .single();

    if (error) throw error;
    return data as unknown as SaasSubscription;
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { error } = await supabase
      .from('saas_subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) throw error;
  }

  // إدارة الفواتير
  async getSaasInvoices(): Promise<SaasInvoice[]> {
    const { data, error } = await supabase
      .from('saas_invoices')
      .select(`
        *,
        subscription:saas_subscriptions(*),
        tenant:tenants(*),
        items:saas_invoice_items(*),
        payments:saas_payments(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as SaasInvoice[];
  }

  async createInvoice(invoiceData: {
    subscription_id: string;
    tenant_id: string;
    subtotal: number;
    tax_amount?: number;
    discount_amount?: number;
    total_amount: number;
    currency: string;
    billing_period_start: string;
    billing_period_end: string;
    due_date?: string;
    description?: string;
  }): Promise<SaasInvoice> {
    // توليد رقم الفاتورة
    const { data: invoiceNumber } = await supabase.rpc('generate_saas_invoice_number');
    
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
        total_amount: invoiceData.total_amount,
        currency: invoiceData.currency,
        billing_period_start: invoiceData.billing_period_start,
        billing_period_end: invoiceData.billing_period_end,
        due_date: invoiceData.due_date,
        description: invoiceData.description
      })
      .select(`
        *,
        subscription:saas_subscriptions(*),
        tenant:tenants(*),
        items:saas_invoice_items(*),
        payments:saas_payments(*)
      `)
      .single();

    if (error) throw error;
    return data as unknown as SaasInvoice;
  }

  async updateInvoiceStatus(invoiceId: string, status: SaasInvoice['status']): Promise<void> {
    const { error } = await supabase
      .from('saas_invoices')
      .update({ status })
      .eq('id', invoiceId);

    if (error) throw error;
  }

  // إدارة المدفوعات
  async getSaasPayments(): Promise<SaasPayment[]> {
    const { data, error } = await supabase
      .from('saas_payments')
      .select(`
        *,
        invoice:saas_invoices(*),
        subscription:saas_subscriptions(*),
        tenant:tenants(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as SaasPayment[];
  }

  async createPayment(paymentData: {
    invoice_id: string;
    subscription_id: string;
    tenant_id: string;
    amount: number;
    currency: string;
    payment_method?: string;
    payment_gateway?: 'stripe' | 'sadad';
    sadad_transaction_id?: string;
    sadad_bill_id?: string;
  }): Promise<SaasPayment> {
    const { data, error } = await supabase
      .from('saas_payments')
      .insert({
        ...paymentData,
        status: 'processing'
      })
      .select(`
        *,
        invoice:saas_invoices(*),
        subscription:saas_subscriptions(*),
        tenant:tenants(*)
      `)
      .single();

    if (error) throw error;
    return data as unknown as SaasPayment;
  }

  // دفع SADAD
  async createSadadPayment(paymentData: {
    invoice_id: string;
    subscription_id: string;
    tenant_id: string;
    amount: number;
    currency: string;
    customer_mobile?: string;
    customer_email?: string;
    bill_description: string;
    due_date?: string;
  }): Promise<any> {
    const { data, error } = await supabase.functions.invoke('sadad-create-payment', {
      body: paymentData
    });

    if (error) throw error;
    return data;
  }

  async updatePaymentStatus(
    paymentId: string, 
    status: SaasPayment['status'],
    metadata?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('saas_payments')
      .update({ 
        status,
        ...(status === 'succeeded' && { paid_at: new Date().toISOString() }),
        ...(metadata && { metadata })
      })
      .eq('id', paymentId);

    if (error) throw error;
  }

  // الإحصائيات والتقارير
  async getBillingStats(): Promise<SaasBillingStats> {
    // إجمالي الإيرادات
    const { data: paymentsData } = await supabase
      .from('saas_payments')
      .select('amount')
      .eq('status', 'succeeded');

    const totalRevenue = paymentsData?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

    // الإيرادات الشهرية
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const { data: monthlyPayments } = await supabase
      .from('saas_payments')
      .select('amount')
      .eq('status', 'succeeded')
      .gte('paid_at', startOfMonth.toISOString());

    const monthlyRevenue = monthlyPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

    // عدد الاشتراكات النشطة
    const { count: activeSubscriptions } = await supabase
      .from('saas_subscriptions')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    // عدد الاشتراكات التجريبية
    const { count: trialSubscriptions } = await supabase
      .from('saas_subscriptions')
      .select('*', { count: 'exact' })
      .eq('status', 'trialing');

    // عدد الاشتراكات الملغاة
    const { count: canceledSubscriptions } = await supabase
      .from('saas_subscriptions')
      .select('*', { count: 'exact' })
      .eq('status', 'canceled');

    // الفواتير المتأخرة
    const { count: overdueInvoices } = await supabase
      .from('saas_invoices')
      .select('*', { count: 'exact' })
      .eq('status', 'open')
      .lt('due_date', new Date().toISOString());

    // إجمالي المؤسسات
    const { count: totalTenants } = await supabase
      .from('tenants')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    return {
      total_revenue: totalRevenue,
      monthly_revenue: monthlyRevenue,
      active_subscriptions: activeSubscriptions || 0,
      trial_subscriptions: trialSubscriptions || 0,
      canceled_subscriptions: canceledSubscriptions || 0,
      overdue_invoices: overdueInvoices || 0,
      total_tenants: totalTenants || 0,
      growth_rate: 0 // سيتم حسابها بناءً على البيانات التاريخية
    };
  }

  // إدارة استخدام المؤسسات
  async getTenantUsage(): Promise<TenantUsage[]> {
    const { data, error } = await supabase
      .from('tenant_usage')
      .select(`
        *,
        tenant:tenants(*)
      `)
      .order('usage_date', { ascending: false });

    if (error) throw error;
    return (data || []) as TenantUsage[];
  }

  async updateTenantUsage(tenantId: string, usageData: Partial<TenantUsage>): Promise<TenantUsage> {
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
        tenant:tenants(*)
      `)
      .single();

    if (error) throw error;
    return data as TenantUsage;
  }
}

export const saasService = new SaasService();