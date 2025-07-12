import { supabase } from '@/integrations/supabase/client';
import { eventBusService, BusinessEventTypes } from '@/services/EventBus/EventBusService';

// دالة مساعدة لإضافة الأيام بدلاً من date-fns
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// دالة مساعدة لإضافة الشهور بدلاً من date-fns
const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

// دالة مساعدة لحساب الفرق بالأيام بدلاً من date-fns
const differenceInDays = (laterDate: Date, earlierDate: Date): number => {
  const timeDiff = laterDate.getTime() - earlierDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// واجهة بيانات المستأجر
export interface TenantData {
  id?: string;
  name: string;
  domain: string;
  contact_email: string;
  contact_phone: string;
  business_type: string;
  registration_number?: string;
  tax_id?: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  settings: TenantSettings;
  subscription: SubscriptionData;
  branding: TenantBranding;
}

// إعدادات المستأجر
export interface TenantSettings {
  timezone: string;
  currency: string;
  language: string;
  date_format: string;
  number_format: string;
  fiscal_year_start: string; // MM-DD format
  business_hours: {
    start: string;
    end: string;
    days: string[];
  };
  features: {
    accounting: boolean;
    fleet_management: boolean;
    hr_management: boolean;
    crm: boolean;
    reporting: boolean;
    analytics: boolean;
    api_access: boolean;
    mobile_app: boolean;
  };
  limits: {
    max_users: number;
    max_vehicles: number;
    max_contracts: number;
    max_storage_gb: number;
    max_api_calls_per_month: number;
  };
  notifications: {
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
    webhook_url?: string;
  };
}

// بيانات الاشتراك
export interface SubscriptionData {
  plan_id: string;
  plan_name: string;
  plan_type: 'starter' | 'professional' | 'enterprise' | 'custom';
  status: 'active' | 'suspended' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  price_per_month: number;
  started_at: Date;
  expires_at: Date;
  auto_renewal: boolean;
  trial_days_remaining?: number;
  payment_method?: {
    type: 'credit_card' | 'bank_transfer' | 'invoice';
    last_four?: string;
    expiry?: string;
  };
}

// العلامة التجارية للمستأجر
export interface TenantBranding {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  custom_css?: string;
  email_templates: {
    header_html?: string;
    footer_html?: string;
    signature?: string;
  };
}

// موارد المستأجر
export interface TenantResources {
  tenant_id: string;
  allocated: {
    cpu_cores: number;
    memory_gb: number;
    storage_gb: number;
    bandwidth_gb: number;
    database_connections: number;
  };
  used: {
    cpu_percent: number;
    memory_gb: number;
    storage_gb: number;
    bandwidth_gb: number;
    database_connections: number;
  };
  limits: {
    api_calls_per_hour: number;
    concurrent_users: number;
    file_upload_size_mb: number;
    backup_retention_days: number;
  };
}

// مقاييس الاستخدام
export interface UsageMetrics {
  tenant_id: string;
  period_start: Date;
  period_end: Date;
  metrics: {
    active_users: number;
    total_sessions: number;
    api_calls: number;
    storage_used_gb: number;
    bandwidth_used_gb: number;
    database_queries: number;
    reports_generated: number;
    emails_sent: number;
    sms_sent: number;
  };
  costs: {
    compute: number;
    storage: number;
    bandwidth: number;
    database: number;
    api_calls: number;
    support: number;
    total: number;
  };
}

// معلومات الفوترة
export interface BillingInfo {
  tenant_id: string;
  current_period: {
    start: Date;
    end: Date;
    amount_due: number;
    amount_paid: number;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  };
  next_billing_date: Date;
  payment_history: PaymentRecord[];
  outstanding_balance: number;
  credit_balance: number;
  invoices: Invoice[];
}

// سجل الدفع
export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  payment_date: Date;
  payment_method: string;
  transaction_id?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  invoice_id?: string;
}

// الفاتورة
export interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: Date;
  due_date: Date;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  line_items: InvoiceLineItem[];
}

// بند الفاتورة
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
}

// حالة اشتراك المستأجر
export interface SubscriptionStatus {
  is_active: boolean;
  is_trial: boolean;
  is_suspended: boolean;
  days_until_expiry: number;
  features_available: string[];
  usage_within_limits: boolean;
  payment_current: boolean;
  renewal_required: boolean;
}

class TenantManagementService {
  private currentTenantId: string | null = null;

  constructor() {
    this.initializeCurrentTenant();
  }

  private async initializeCurrentTenant() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();
        this.currentTenantId = data?.tenant_id || null;
      }
    } catch (error) {
      console.error('Error initializing current tenant:', error);
    }
  }

  // إنشاء مستأجر جديد
  async createTenant(tenantData: TenantData): Promise<TenantData> {
    try {
      // التحقق من توفر النطاق
      await this.validateDomainAvailability(tenantData.domain);

      // إنشاء المستأجر في قاعدة البيانات
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: tenantData.name,
          domain: tenantData.domain,
          contact_email: tenantData.contact_email,
          contact_phone: tenantData.contact_phone,
          business_type: tenantData.business_type,
          registration_number: tenantData.registration_number,
          tax_id: tenantData.tax_id,
          address: tenantData.address,
          settings: tenantData.settings,
          branding: tenantData.branding,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (tenantError) {
        throw new Error(`Failed to create tenant: ${tenantError.message}`);
      }

      // إنشاء الاشتراك
      await this.createSubscription(tenant.id, tenantData.subscription);

      // تخصيص الموارد الأولية
      await this.allocateInitialResources(tenant.id, tenantData.subscription.plan_type);

      // إعداد قاعدة البيانات الأولية
      await this.setupTenantDatabase(tenant.id);

      // إنشاء المستخدم الأول (المدير)
      await this.createInitialAdminUser(tenant.id, tenantData.contact_email);

      // نشر حدث إنشاء المستأجر
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SYSTEM_MAINTENANCE_STARTED,
        source: 'tenant-management',
        data: {
          tenant_id: tenant.id,
          tenant_name: tenant.name,
          plan_type: tenantData.subscription.plan_type,
          action: 'tenant_created'
        },
        priority: 'high'
      });

      return {
        ...tenantData,
        id: tenant.id
      };

    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }

  // تكوين المستأجر
  async configureTenant(tenantId: string, config: Partial<TenantSettings>): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          settings: config,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) {
        throw new Error(`Failed to configure tenant: ${error.message}`);
      }

      // نشر حدث تحديث التكوين
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SYSTEM_MAINTENANCE_STARTED,
        source: 'tenant-management',
        data: {
          tenant_id: tenantId,
          config_changes: Object.keys(config),
          action: 'tenant_configured'
        }
      });

    } catch (error) {
      console.error('Error configuring tenant:', error);
      throw error;
    }
  }

  // تخصيص الموارد
  async allocateResources(tenantId: string, resources: TenantResources['allocated']): Promise<void> {
    try {
      // التحقق من توفر الموارد
      await this.validateResourceAvailability(resources);

      const { error } = await supabase
        .from('tenant_resources')
        .upsert({
          tenant_id: tenantId,
          allocated_cpu_cores: resources.cpu_cores,
          allocated_memory_gb: resources.memory_gb,
          allocated_storage_gb: resources.storage_gb,
          allocated_bandwidth_gb: resources.bandwidth_gb,
          allocated_db_connections: resources.database_connections,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to allocate resources: ${error.message}`);
      }

      // نشر حدث تخصيص الموارد
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SYSTEM_PERFORMANCE_ALERT,
        source: 'tenant-management',
        data: {
          tenant_id: tenantId,
          resources_allocated: resources,
          action: 'resources_allocated'
        }
      });

    } catch (error) {
      console.error('Error allocating resources:', error);
      throw error;
    }
  }

  // مراقبة الاستخدام
  async monitorUsage(tenantId: string): Promise<UsageMetrics> {
    try {
      const periodStart = new Date();
      periodStart.setDate(1); // بداية الشهر الحالي
      const periodEnd = new Date();

      // جمع مقاييس الاستخدام
      const [
        userMetrics,
        apiMetrics,
        storageMetrics,
        databaseMetrics
      ] = await Promise.all([
        this.collectUserMetrics(tenantId, periodStart, periodEnd),
        this.collectAPIMetrics(tenantId, periodStart, periodEnd),
        this.collectStorageMetrics(tenantId),
        this.collectDatabaseMetrics(tenantId, periodStart, periodEnd)
      ]);

      const metrics = {
        active_users: userMetrics.active_users,
        total_sessions: userMetrics.total_sessions,
        api_calls: apiMetrics.total_calls,
        storage_used_gb: storageMetrics.used_gb,
        bandwidth_used_gb: apiMetrics.bandwidth_gb,
        database_queries: databaseMetrics.total_queries,
        reports_generated: await this.getReportsCount(tenantId, periodStart, periodEnd),
        emails_sent: await this.getEmailsCount(tenantId, periodStart, periodEnd),
        sms_sent: await this.getSMSCount(tenantId, periodStart, periodEnd)
      };

      // حساب التكاليف
      const costs = await this.calculateUsageCosts(tenantId, metrics);

      const usageMetrics: UsageMetrics = {
        tenant_id: tenantId,
        period_start: periodStart,
        period_end: periodEnd,
        metrics,
        costs
      };

      // حفظ مقاييس الاستخدام
      await this.saveUsageMetrics(usageMetrics);

      return usageMetrics;

    } catch (error) {
      console.error('Error monitoring usage:', error);
      throw error;
    }
  }

  // إدارة الفوترة
  async manageBilling(tenantId: string): Promise<BillingInfo> {
    try {
      // الحصول على معلومات الاشتراك
      const { data: subscription } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // الحصول على الفترة الحالية
      const currentPeriod = this.getCurrentBillingPeriod(subscription);
      
      // الحصول على سجل المدفوعات
      const paymentHistory = await this.getPaymentHistory(tenantId);
      
      // الحصول على الفواتير
      const invoices = await this.getInvoices(tenantId);
      
      // حساب الأرصدة
      const outstandingBalance = await this.calculateOutstandingBalance(tenantId);
      const creditBalance = await this.calculateCreditBalance(tenantId);

      return {
        tenant_id: tenantId,
        current_period: currentPeriod,
        next_billing_date: addMonths(new Date(subscription.current_period_end), 1),
        payment_history: paymentHistory,
        outstanding_balance: outstandingBalance,
        credit_balance: creditBalance,
        invoices: invoices
      };

    } catch (error) {
      console.error('Error managing billing:', error);
      throw error;
    }
  }

  // تتبع حالة الاشتراك
  async trackSubscription(tenantId: string): Promise<SubscriptionStatus> {
    try {
      const { data: subscription } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const now = new Date();
      const expiryDate = new Date(subscription.expires_at);
      const daysUntilExpiry = Math.ceil(differenceInDays(expiryDate, now));

      // فحص الاستخدام ضمن الحدود
      const usage = await this.monitorUsage(tenantId);
      const limits = await this.getTenantLimits(tenantId);
      const usageWithinLimits = this.checkUsageWithinLimits(usage.metrics, limits);

      // فحص حالة الدفع
      const billing = await this.manageBilling(tenantId);
      const paymentCurrent = billing.outstanding_balance <= 0;

      const status: SubscriptionStatus = {
        is_active: subscription.status === 'active',
        is_trial: subscription.trial_end_date && new Date(subscription.trial_end_date) > now,
        is_suspended: subscription.status === 'suspended',
        days_until_expiry: daysUntilExpiry,
        features_available: await this.getAvailableFeatures(tenantId),
        usage_within_limits: usageWithinLimits,
        payment_current: paymentCurrent,
        renewal_required: daysUntilExpiry <= 7
      };

      // إرسال تنبيهات إذا لزم الأمر
      await this.sendSubscriptionAlerts(tenantId, status);

      return status;

    } catch (error) {
      console.error('Error tracking subscription:', error);
      throw error;
    }
  }

  // تحديث العلامة التجارية
  async updateBranding(tenantId: string, branding: TenantBranding): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          branding: branding,
          updated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) {
        throw new Error(`Failed to update branding: ${error.message}`);
      }

      // نشر حدث تحديث العلامة التجارية
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SYSTEM_MAINTENANCE_STARTED,
        source: 'tenant-management',
        data: {
          tenant_id: tenantId,
          branding_updated: true,
          action: 'branding_updated'
        }
      });

    } catch (error) {
      console.error('Error updating branding:', error);
      throw error;
    }
  }

  // ترقية/تخفيض الاشتراك
  async upgradeSubscription(tenantId: string, newPlanId: string, effectiveDate?: Date): Promise<void> {
    try {
      const { data: currentSubscription } = await supabase
        .from('tenant_subscriptions')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (!currentSubscription) {
        throw new Error('Current subscription not found');
      }

      const { data: newPlan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', newPlanId)
        .single();

      if (!newPlan) {
        throw new Error('New plan not found');
      }

      const effective = effectiveDate || new Date();

      // تحديث الاشتراك
      const { error } = await supabase
        .from('tenant_subscriptions')
        .update({
          plan_id: newPlanId,
          plan_name: newPlan.name,
          plan_type: newPlan.type,
          price_per_month: newPlan.price_per_month,
          upgrade_date: effective.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId);

      if (error) {
        throw new Error(`Failed to upgrade subscription: ${error.message}`);
      }

      // تحديث الموارد والحدود
      await this.updateResourcesForPlan(tenantId, newPlan.type);

      // إنشاء فاتورة للفرق في السعر (إن وجد)
      await this.createUpgradeInvoice(tenantId, currentSubscription, newPlan, effective);

      // نشر حدث ترقية الاشتراك
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SYSTEM_MAINTENANCE_STARTED,
        source: 'tenant-management',
        data: {
          tenant_id: tenantId,
          old_plan: currentSubscription.plan_name,
          new_plan: newPlan.name,
          effective_date: effective,
          action: 'subscription_upgraded'
        },
        priority: 'high'
      });

    } catch (error) {
      console.error('Error upgrading subscription:', error);
      throw error;
    }
  }

  // تعليق/إلغاء تعليق المستأجر
  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          status: 'suspended',
          suspension_reason: reason,
          suspended_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) {
        throw new Error(`Failed to suspend tenant: ${error.message}`);
      }

      // تعليق الاشتراك
      await supabase
        .from('tenant_subscriptions')
        .update({
          status: 'suspended',
          suspended_at: new Date().toISOString()
        })
        .eq('tenant_id', tenantId);

      // نشر حدث تعليق المستأجر
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SYSTEM_MAINTENANCE_STARTED,
        source: 'tenant-management',
        data: {
          tenant_id: tenantId,
          reason: reason,
          action: 'tenant_suspended'
        },
        priority: 'critical'
      });

    } catch (error) {
      console.error('Error suspending tenant:', error);
      throw error;
    }
  }

  async unsuspendTenant(tenantId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          status: 'active',
          suspension_reason: null,
          suspended_at: null,
          reactivated_at: new Date().toISOString()
        })
        .eq('id', tenantId);

      if (error) {
        throw new Error(`Failed to unsuspend tenant: ${error.message}`);
      }

      // إعادة تفعيل الاشتراك
      await supabase
        .from('tenant_subscriptions')
        .update({
          status: 'active',
          suspended_at: null
        })
        .eq('tenant_id', tenantId);

      // نشر حدث إلغاء التعليق
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SYSTEM_MAINTENANCE_STARTED,
        source: 'tenant-management',
        data: {
          tenant_id: tenantId,
          action: 'tenant_unsuspended'
        },
        priority: 'high'
      });

    } catch (error) {
      console.error('Error unsuspending tenant:', error);
      throw error;
    }
  }

  // دوال مساعدة خاصة

  private async validateDomainAvailability(domain: string): Promise<void> {
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('domain', domain)
      .single();

    if (existingTenant) {
      throw new Error(`Domain '${domain}' is already taken`);
    }
  }

  private async validateResourceAvailability(resources: TenantResources['allocated']): Promise<void> {
    // فحص توفر الموارد في النظام
    // في التطبيق الفعلي، سيتم فحص الموارد المتاحة
    const totalAvailable = {
      cpu_cores: 1000,
      memory_gb: 10000,
      storage_gb: 100000,
      bandwidth_gb: 50000,
      database_connections: 10000
    };

    Object.entries(resources).forEach(([key, value]) => {
      const available = totalAvailable[key as keyof typeof totalAvailable];
      if (value > available) {
        throw new Error(`Insufficient ${key}: requested ${value}, available ${available}`);
      }
    });
  }

  private async createSubscription(tenantId: string, subscriptionData: SubscriptionData): Promise<void> {
    const { error } = await supabase
      .from('tenant_subscriptions')
      .insert({
        tenant_id: tenantId,
        plan_id: subscriptionData.plan_id,
        plan_name: subscriptionData.plan_name,
        plan_type: subscriptionData.plan_type,
        status: 'active',
        billing_cycle: subscriptionData.billing_cycle,
        price_per_month: subscriptionData.price_per_month,
        started_at: subscriptionData.started_at.toISOString(),
        expires_at: subscriptionData.expires_at.toISOString(),
        auto_renewal: subscriptionData.auto_renewal,
        trial_end_date: subscriptionData.trial_days_remaining ? 
          addDays(new Date(), subscriptionData.trial_days_remaining).toISOString() : null
      });

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  private async allocateInitialResources(tenantId: string, planType: string): Promise<void> {
    const resourcesByPlan = {
      'starter': {
        cpu_cores: 1,
        memory_gb: 2,
        storage_gb: 10,
        bandwidth_gb: 50,
        database_connections: 10
      },
      'professional': {
        cpu_cores: 2,
        memory_gb: 4,
        storage_gb: 50,
        bandwidth_gb: 200,
        database_connections: 25
      },
      'enterprise': {
        cpu_cores: 4,
        memory_gb: 8,
        storage_gb: 200,
        bandwidth_gb: 1000,
        database_connections: 100
      },
      'custom': {
        cpu_cores: 8,
        memory_gb: 16,
        storage_gb: 500,
        bandwidth_gb: 2000,
        database_connections: 200
      }
    };

    const resources = resourcesByPlan[planType as keyof typeof resourcesByPlan];
    await this.allocateResources(tenantId, resources);
  }

  private async setupTenantDatabase(tenantId: string): Promise<void> {
    // إعداد قاعدة البيانات الأولية للمستأجر
    // إنشاء الجداول والمشاهدات المطلوبة
    // تطبيق Row Level Security
    // إدراج البيانات الأولية

    const setupQueries = [
      `INSERT INTO tenant_settings (tenant_id, setting_key, setting_value) VALUES ('${tenantId}', 'initialized', 'true')`,
      `INSERT INTO chart_of_accounts (tenant_id, account_code, account_name) SELECT '${tenantId}', account_code, account_name FROM default_chart_of_accounts`,
    ];

    for (const query of setupQueries) {
      try {
        await supabase.rpc('execute_sql', { sql_query: query });
      } catch (error) {
        console.error('Database setup error:', error);
      }
    }
  }

  private async createInitialAdminUser(tenantId: string, email: string): Promise<void> {
    // إنشاء المستخدم الأول كمدير
    // في التطبيق الفعلي، سيتم إرسال دعوة للمستخدم
    console.log(`Creating initial admin user for tenant ${tenantId}: ${email}`);
  }

  private async collectUserMetrics(tenantId: string, start: Date, end: Date): Promise<{
    active_users: number;
    total_sessions: number;
  }> {
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('user_id, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    const activeUsers = new Set(sessions?.map(s => s.user_id) || []).size;
    const totalSessions = sessions?.length || 0;

    return { active_users: activeUsers, total_sessions: totalSessions };
  }

  private async collectAPIMetrics(tenantId: string, start: Date, end: Date): Promise<{
    total_calls: number;
    bandwidth_gb: number;
  }> {
    const { data: apiCalls } = await supabase
      .from('api_requests_log')
      .select('id, response_size')
      .eq('tenant_id', tenantId)
      .gte('timestamp', start.toISOString())
      .lte('timestamp', end.toISOString());

    const totalCalls = apiCalls?.length || 0;
    const totalBytes = apiCalls?.reduce((sum, call) => sum + (call.response_size || 0), 0) || 0;
    const bandwidthGb = totalBytes / (1024 * 1024 * 1024);

    return { total_calls: totalCalls, bandwidth_gb: bandwidthGb };
  }

  private async collectStorageMetrics(tenantId: string): Promise<{ used_gb: number }> {
    const { data: storageUsage } = await supabase
      .from('storage_usage')
      .select('total_size_bytes')
      .eq('tenant_id', tenantId)
      .single();

    const usedGb = (storageUsage?.total_size_bytes || 0) / (1024 * 1024 * 1024);
    return { used_gb: usedGb };
  }

  private async collectDatabaseMetrics(tenantId: string, start: Date, end: Date): Promise<{
    total_queries: number;
  }> {
    const { data: queries } = await supabase
      .from('database_query_log')
      .select('id')
      .eq('tenant_id', tenantId)
      .gte('executed_at', start.toISOString())
      .lte('executed_at', end.toISOString());

    return { total_queries: queries?.length || 0 };
  }

  private async getReportsCount(tenantId: string, start: Date, end: Date): Promise<number> {
    const { count } = await supabase
      .from('generated_reports')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    return count || 0;
  }

  private async getEmailsCount(tenantId: string, start: Date, end: Date): Promise<number> {
    const { count } = await supabase
      .from('email_log')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('sent_at', start.toISOString())
      .lte('sent_at', end.toISOString());

    return count || 0;
  }

  private async getSMSCount(tenantId: string, start: Date, end: Date): Promise<number> {
    const { count } = await supabase
      .from('sms_log')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('sent_at', start.toISOString())
      .lte('sent_at', end.toISOString());

    return count || 0;
  }

  private async calculateUsageCosts(tenantId: string, metrics: any): Promise<UsageMetrics['costs']> {
    // حساب تكاليف الاستخدام بناءً على النموذج التسعيري
    const pricing = {
      compute_per_hour: 0.1,
      storage_per_gb_month: 0.05,
      bandwidth_per_gb: 0.02,
      database_per_query: 0.001,
      api_call_per_1000: 0.5,
      support_base: 10
    };

    const hoursInMonth = 24 * 30;
    
    return {
      compute: metrics.active_users * pricing.compute_per_hour * hoursInMonth,
      storage: metrics.storage_used_gb * pricing.storage_per_gb_month,
      bandwidth: metrics.bandwidth_used_gb * pricing.bandwidth_per_gb,
      database: metrics.database_queries * pricing.database_per_query,
      api_calls: (metrics.api_calls / 1000) * pricing.api_call_per_1000,
      support: pricing.support_base,
      total: 0 // سيتم حسابه كمجموع العناصر الأخرى
    };
  }

  private async saveUsageMetrics(metrics: UsageMetrics): Promise<void> {
    await supabase
      .from('tenant_usage_metrics')
      .upsert({
        tenant_id: metrics.tenant_id,
        period_start: metrics.period_start.toISOString(),
        period_end: metrics.period_end.toISOString(),
        metrics: metrics.metrics,
        costs: metrics.costs,
        created_at: new Date().toISOString()
      });
  }

  private getCurrentBillingPeriod(subscription: any): BillingInfo['current_period'] {
    const start = new Date(subscription.current_period_start);
    const end = new Date(subscription.current_period_end);
    
    return {
      start,
      end,
      amount_due: subscription.amount_due || 0,
      amount_paid: subscription.amount_paid || 0,
      status: subscription.payment_status || 'pending'
    };
  }

  private async getPaymentHistory(tenantId: string): Promise<PaymentRecord[]> {
    const { data: payments } = await supabase
      .from('tenant_payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('payment_date', { ascending: false })
      .limit(10);

    return payments?.map(p => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      payment_date: new Date(p.payment_date),
      payment_method: p.payment_method,
      transaction_id: p.transaction_id,
      status: p.status,
      invoice_id: p.invoice_id
    })) || [];
  }

  private async getInvoices(tenantId: string): Promise<Invoice[]> {
    const { data: invoices } = await supabase
      .from('tenant_invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('issue_date', { ascending: false })
      .limit(20);

    return invoices?.map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      issue_date: new Date(inv.issue_date),
      due_date: new Date(inv.due_date),
      amount: inv.amount,
      tax_amount: inv.tax_amount,
      total_amount: inv.total_amount,
      status: inv.status,
      line_items: inv.line_items || []
    })) || [];
  }

  private async calculateOutstandingBalance(tenantId: string): Promise<number> {
    const { data: result } = await supabase
      .from('tenant_invoices')
      .select('total_amount')
      .eq('tenant_id', tenantId)
      .in('status', ['sent', 'overdue']);

    return result?.reduce((sum, inv) => sum + inv.total_amount, 0) || 0;
  }

  private async calculateCreditBalance(tenantId: string): Promise<number> {
    const { data: result } = await supabase
      .from('tenant_credits')
      .select('amount')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    return result?.reduce((sum, credit) => sum + credit.amount, 0) || 0;
  }

  private async getTenantLimits(tenantId: string): Promise<any> {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single();

    return tenant?.settings?.limits || {};
  }

  private checkUsageWithinLimits(metrics: any, limits: any): boolean {
    const checks = [
      metrics.active_users <= (limits.max_users || Infinity),
      metrics.storage_used_gb <= (limits.max_storage_gb || Infinity),
      metrics.api_calls <= (limits.max_api_calls_per_month || Infinity)
    ];

    return checks.every(check => check);
  }

  private async getAvailableFeatures(tenantId: string): Promise<string[]> {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single();

    const features = tenant?.settings?.features || {};
    return Object.entries(features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature);
  }

  private async sendSubscriptionAlerts(tenantId: string, status: SubscriptionStatus): Promise<void> {
    if (status.renewal_required) {
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SYSTEM_PERFORMANCE_ALERT,
        source: 'tenant-management',
        data: {
          tenant_id: tenantId,
          alert_type: 'renewal_required',
          days_until_expiry: status.days_until_expiry
        },
        priority: 'high'
      });
    }

    if (!status.usage_within_limits) {
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SYSTEM_PERFORMANCE_ALERT,
        source: 'tenant-management',
        data: {
          tenant_id: tenantId,
          alert_type: 'usage_limit_exceeded'
        },
        priority: 'medium'
      });
    }

    if (!status.payment_current) {
      await eventBusService.publishEvent({
        type: BusinessEventTypes.SYSTEM_PERFORMANCE_ALERT,
        source: 'tenant-management',
        data: {
          tenant_id: tenantId,
          alert_type: 'payment_overdue'
        },
        priority: 'high'
      });
    }
  }

  private async updateResourcesForPlan(tenantId: string, planType: string): Promise<void> {
    // تحديث الموارد بناءً على الخطة الجديدة
    await this.allocateInitialResources(tenantId, planType);
  }

  private async createUpgradeInvoice(tenantId: string, oldSubscription: any, newPlan: any, effectiveDate: Date): Promise<void> {
    // إنشاء فاتورة للفرق في السعر
    const priceDifference = newPlan.price_per_month - oldSubscription.price_per_month;
    
    if (priceDifference > 0) {
      await supabase
        .from('tenant_invoices')
        .insert({
          tenant_id: tenantId,
          invoice_number: `UPG-${Date.now()}`,
          issue_date: effectiveDate.toISOString(),
          due_date: addDays(effectiveDate, 30).toISOString(),
          amount: priceDifference,
          tax_amount: priceDifference * 0.15, // 15% ضريبة
          total_amount: priceDifference * 1.15,
          status: 'sent',
          line_items: [{
            description: `Upgrade to ${newPlan.name}`,
            quantity: 1,
            unit_price: priceDifference,
            total_price: priceDifference,
            tax_rate: 0.15
          }]
        });
    }
  }
}

// إنشاء مثيل مشترك
export const tenantManagementService = new TenantManagementService(); 