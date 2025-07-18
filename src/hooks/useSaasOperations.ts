import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanCode } from '@/types/subscription-plans';
import type { 
  SubscriptionPlan, 
  SaasSubscription, 
  SaasInvoice, 
  SaasPayment,
  TenantUsage,
  SaasBillingStats
} from '@/types/unified-saas';

// =======================================================
// Hook لإدارة خطط الاشتراك
// =======================================================

export const useSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (fetchError) {
        throw fetchError;
      }

      setPlans(data || []);
    } catch (err: any) {
      console.error('خطأ في جلب خطط الاشتراك:', err);
      setError(err.message);
      
      // استخدام البيانات الافتراضية في حالة الخطأ
      const defaultPlans: SubscriptionPlan[] = Object.values(SUBSCRIPTION_PLANS).map(plan => ({
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
      
      setPlans(defaultPlans);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (planData: Partial<SubscriptionPlan>) => {
    try {
      const planToInsert = {
        plan_code: planData.plan_code || '',
        plan_name: planData.plan_name || '',
        description: planData.description,
        features: planData.features || [],
        price_monthly: planData.price_monthly,
        price_yearly: planData.price_yearly,
        max_tenants: planData.max_tenants,
        max_users_per_tenant: planData.max_users_per_tenant,
        max_contracts: planData.max_contracts,
        storage_limit_gb: planData.storage_limit_gb,
        is_active: planData.is_active ?? true,
        is_popular: planData.is_popular ?? false
      };

      const { data, error } = await supabase
        .from('subscription_plans')
        .insert([planToInsert])
        .select()
        .single();

      if (error) throw error;

      await fetchPlans(); // إعادة تحميل البيانات
      
      toast({
        title: 'تم إنشاء الخطة بنجاح',
        description: `تم إنشاء خطة "${planData.plan_name}" بنجاح`,
      });

      return data;
    } catch (err: any) {
      console.error('خطأ في إنشاء خطة الاشتراك:', err);
      toast({
        title: 'خطأ في إنشاء الخطة',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updatePlan = async (id: string, updates: Partial<SubscriptionPlan>) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchPlans();
      
      toast({
        title: 'تم تحديث الخطة بنجاح',
        description: 'تم حفظ التغييرات',
      });
    } catch (err: any) {
      console.error('خطأ في تحديث خطة الاشتراك:', err);
      toast({
        title: 'خطأ في تحديث الخطة',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchPlans();
      
      toast({
        title: 'تم حذف الخطة بنجاح',
        description: 'تم حذف خطة الاشتراك',
      });
    } catch (err: any) {
      console.error('خطأ في حذف خطة الاشتراك:', err);
      toast({
        title: 'خطأ في حذف الخطة',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    error,
    refresh: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
  };
};

// =======================================================
// Hook لإدارة الاشتراكات
// =======================================================

export const useSaasSubscriptions = (tenantId?: string) => {
  const [subscriptions, setSubscriptions] = useState<SaasSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('saas_subscriptions')
        .select(`
          *,
          tenant:tenants(id, name, contact_email),
          plan:subscription_plans(*)
        `);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // تحويل البيانات لتتطابق مع الواجهة
      const transformedData = (data || []).map((sub: any) => ({
        ...sub,
        discount_percentage: sub.discount_percentage || 0,
        next_billing_date: sub.current_period_end,
        plan: sub.plan || null,
        tenant: sub.tenant || null
      }));
      setSubscriptions(transformedData);
    } catch (err: any) {
      console.error('خطأ في جلب الاشتراكات:', err);
      setError(err.message);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (subscriptionData: Partial<SaasSubscription>) => {
    try {
      const subscriptionToInsert = {
        tenant_id: subscriptionData.tenant_id || '',
        plan_id: subscriptionData.plan_id || '',
        amount: subscriptionData.amount || 0,
        current_period_start: subscriptionData.current_period_start || new Date().toISOString(),
        current_period_end: subscriptionData.current_period_end || new Date().toISOString(),
        billing_cycle: subscriptionData.billing_cycle,
        auto_renew: subscriptionData.auto_renew,
        currency: subscriptionData.currency,
        discount_percentage: subscriptionData.discount_percentage || 0
      };

      const { data, error } = await supabase
        .from('saas_subscriptions')
        .insert([subscriptionToInsert])
        .select()
        .single();

      if (error) throw error;

      await fetchSubscriptions();
      
      toast({
        title: 'تم إنشاء الاشتراك بنجاح',
        description: 'تم إنشاء اشتراك جديد',
      });

      return data;
    } catch (err: any) {
      console.error('خطأ في إنشاء الاشتراك:', err);
      toast({
        title: 'خطأ في إنشاء الاشتراك',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateSubscriptionStatus = async (id: string, status: SaasSubscription['status']) => {
    try {
      const { error } = await supabase
        .from('saas_subscriptions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await fetchSubscriptions();
      
      toast({
        title: 'تم تحديث حالة الاشتراك',
        description: `تم تغيير الحالة إلى: ${status}`,
      });
    } catch (err: any) {
      console.error('خطأ في تحديث حالة الاشتراك:', err);
      toast({
        title: 'خطأ في تحديث الاشتراك',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [tenantId]);

  return {
    subscriptions,
    loading,
    error,
    refresh: fetchSubscriptions,
    createSubscription,
    updateSubscriptionStatus,
  };
};

// =======================================================
// Hook لإدارة الفواتير
// =======================================================

export const useSaasInvoices = (tenantId?: string) => {
  const [invoices, setInvoices] = useState<SaasInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('saas_invoices')
        .select(`
          *,
          tenant:tenants(id, name, contact_email),
          subscription:saas_subscriptions(id, plan_id),
          items:saas_invoice_items(*),
          payments:saas_payments(*)
        `);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // تحويل البيانات لتتطابق مع الواجهة
      const transformedData = (data || []).map((invoice: any) => ({
        ...invoice,
        subtotal: invoice.subtotal || invoice.amount_due || 0,
        tax_amount: invoice.tax_amount || 0,
        discount_amount: invoice.discount_amount || 0,
        total_amount: invoice.total_amount || invoice.amount_due || 0
      }));
      setInvoices(transformedData);
    } catch (err: any) {
      console.error('خطأ في جلب الفواتير:', err);
      setError(err.message);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const createInvoice = async (invoiceData: Partial<SaasInvoice>) => {
    try {
      const invoiceToInsert = {
        tenant_id: invoiceData.tenant_id || '',
        subscription_id: invoiceData.subscription_id || '',
        invoice_number: invoiceData.invoice_number || '',
        billing_period_start: invoiceData.billing_period_start || new Date().toISOString(),
        billing_period_end: invoiceData.billing_period_end || new Date().toISOString(),
        subtotal: invoiceData.subtotal || 0,
        tax_amount: invoiceData.tax_amount || 0,
        discount_amount: invoiceData.discount_amount || 0,
        total_amount: invoiceData.total_amount || 0,
        // هذه الحقول لا تتطابق مع واجهة SaasInvoice، سيتم حسابها تلقائياً
        due_date: invoiceData.due_date,
        status: invoiceData.status,
        currency: invoiceData.currency,
        description: invoiceData.description
      };

      const { data, error } = await supabase
        .from('saas_invoices')
        .insert([invoiceToInsert])
        .select()
        .single();

      if (error) throw error;

      await fetchInvoices();
      
      toast({
        title: 'تم إنشاء الفاتورة بنجاح',
        description: `فاتورة رقم: ${data.invoice_number}`,
      });

      return data;
    } catch (err: any) {
      console.error('خطأ في إنشاء الفاتورة:', err);
      toast({
        title: 'خطأ في إنشاء الفاتورة',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateInvoiceStatus = async (id: string, status: SaasInvoice['status']) => {
    try {
      const { error } = await supabase
        .from('saas_invoices')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await fetchInvoices();
      
      toast({
        title: 'تم تحديث حالة الفاتورة',
        description: `تم تغيير الحالة إلى: ${status}`,
      });
    } catch (err: any) {
      console.error('خطأ في تحديث حالة الفاتورة:', err);
      toast({
        title: 'خطأ في تحديث الفاتورة',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [tenantId]);

  return {
    invoices,
    loading,
    error,
    refresh: fetchInvoices,
    createInvoice,
    updateInvoiceStatus,
  };
};

// =======================================================
// Hook لإدارة المدفوعات
// =======================================================

export const useSaasPayments = (tenantId?: string) => {
  const [payments, setPayments] = useState<SaasPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('saas_payments')
        .select(`
          *,
          tenant:tenants(id, name, contact_email),
          invoice:saas_invoices(id, invoice_number, total_amount),
          subscription:saas_subscriptions(id, plan_id)
        `);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // تحويل البيانات لتتطابق مع الواجهة
      const transformedData = (data || []).map((payment: any) => ({
        ...payment,
        payment_date: payment.paid_at || payment.created_at
      }));
      setPayments(transformedData);
    } catch (err: any) {
      console.error('خطأ في جلب المدفوعات:', err);
      setError(err.message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (paymentData: Partial<SaasPayment>) => {
    try {
      const paymentToInsert = {
        invoice_id: paymentData.invoice_id || '',
        subscription_id: paymentData.subscription_id || '',
        tenant_id: paymentData.tenant_id || '',
        amount: paymentData.amount || 0,
        payment_date: paymentData.payment_date || new Date().toISOString(),
        payment_method: paymentData.payment_method,
        payment_reference: paymentData.payment_reference,
        status: paymentData.status,
        currency: paymentData.currency,
        metadata: paymentData.metadata,
        failure_reason: paymentData.failure_reason,
        paid_at: paymentData.paid_at
      };

      const { data, error } = await supabase
        .from('saas_payments')
        .insert([paymentToInsert])
        .select()
        .single();

      if (error) throw error;

      await fetchPayments();
      
      toast({
        title: 'تم إنشاء الدفعة بنجاح',
        description: 'تم تسجيل دفعة جديدة',
      });

      return data;
    } catch (err: any) {
      console.error('خطأ في إنشاء الدفعة:', err);
      toast({
        title: 'خطأ في إنشاء الدفعة',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [tenantId]);

  return {
    payments,
    loading,
    error,
    refresh: fetchPayments,
    createPayment,
  };
};

// =======================================================
// Hook لإحصائيات الفوترة
// =======================================================

export const useBillingStats = () => {
  const [stats, setStats] = useState<SaasBillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب إحصائيات من جداول مختلفة
      const [subscriptionsData, invoicesData, paymentsData, tenantsData] = await Promise.all([
        supabase.from('saas_subscriptions').select('status, amount'),
        supabase.from('saas_invoices').select('status, total_amount'),
        supabase.from('saas_payments').select('status, amount'),
        supabase.from('tenants').select('status'),
      ]);

      const subscriptions = subscriptionsData.data || [];
      const invoices = invoicesData.data || [];
      const payments = paymentsData.data || [];
      const tenants = tenantsData.data || [];

      // حساب الإحصائيات
      const stats: SaasBillingStats = {
        // الإيرادات
        total_revenue: payments.filter(p => p.status === 'succeeded').reduce((sum, p) => sum + (p.amount || 0), 0),
        monthly_revenue: 0, // يمكن تحسينه لاحقاً
        yearly_revenue: 0,  // يمكن تحسينه لاحقاً
        
        // الاشتراكات
        active_subscriptions: subscriptions.filter(s => s.status === 'active').length,
        trial_subscriptions: subscriptions.filter(s => s.status === 'trialing').length,
        canceled_subscriptions: subscriptions.filter(s => s.status === 'canceled').length,
        total_subscriptions: subscriptions.length,
        
        // الفواتير
        pending_invoices: invoices.filter((i: any) => i.status === 'sent' || i.status === 'draft').length,
        overdue_invoices: invoices.filter((i: any) => i.status === 'overdue').length,
        paid_invoices: invoices.filter((i: any) => i.status === 'paid').length,
        total_invoices: invoices.length,
        
        // المؤسسات
        total_tenants: tenants.length,
        active_tenants: tenants.filter(t => t.status === 'active').length,
        
        // معدلات
        growth_rate: 0, // يحتاج حساب معقد
        churn_rate: 0,  // يحتاج حساب معقد
        
        // متوسطات
        average_revenue_per_user: subscriptions.length > 0 ? 
          subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0) / subscriptions.length : 0,
        average_subscription_value: subscriptions.length > 0 ?
          subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0) / subscriptions.length : 0,
      };

      setStats(stats);
    } catch (err: any) {
      console.error('خطأ في جلب إحصائيات الفوترة:', err);
      setError(err.message);
      
      // إحصائيات افتراضية في حالة الخطأ
      setStats({
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
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
};

// =======================================================
// Hook لاستخدام المؤسسات
// =======================================================

export const useTenantUsage = (tenantId: string) => {
  const [usage, setUsage] = useState<TenantUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError(null);

      // استخدام دالة قاعدة البيانات المُحدثة
      const { data, error: functionError } = await supabase
        .rpc('update_tenant_usage', { tenant_id_param: tenantId });

      if (functionError) {
        throw functionError;
      }

      setUsage(data as unknown as TenantUsage);
    } catch (err: any) {
      console.error('خطأ في جلب استخدام المؤسسة:', err);
      setError(err.message);
      setUsage(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchUsage();
    }
  }, [tenantId]);

  return {
    usage,
    loading,
    error,
    refresh: fetchUsage,
  };
}; 