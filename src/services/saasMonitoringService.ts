import { supabase } from '@/integrations/supabase/client';

// =======================================================
// أنواع البيانات للمراقبة والتنبيهات
// =======================================================

export type AlertType = 
  | 'billing_overdue' 
  | 'subscription_expiring' 
  | 'payment_failed' 
  | 'usage_limit_exceeded' 
  | 'system_performance' 
  | 'revenue_drop' 
  | 'churn_rate_high';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface SaasAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  tenant_id?: string;
  subscription_id?: string;
  invoice_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
}

export interface MonitoringMetrics {
  system_health: {
    cpu_usage: number;
    memory_usage: number;
    database_connections: number;
    response_time: number;
  };
  business_metrics: {
    total_revenue: number;
    monthly_revenue: number;
    active_subscriptions: number;
    churn_rate: number;
    conversion_rate: number;
  };
  operational_metrics: {
    overdue_invoices: number;
    failed_payments: number;
    expiring_subscriptions: number;
    support_tickets: number;
  };
  calculated_at: string;
}

export interface AlertRule {
  id: string;
  name: string;
  type: AlertType;
  condition: string;
  threshold: number;
  severity: AlertSeverity;
  is_active: boolean;
  notification_channels: string[];
  created_at: string;
}

// =======================================================
// خدمة المراقبة والتنبيهات المتقدمة
// =======================================================

export class SaasMonitoringService {
  private alertRules: Map<string, AlertRule> = new Map();
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 دقائق
  private monitoringTimer?: NodeJS.Timeout;

  // =======================================================
  // إدارة التنبيهات
  // =======================================================

  async getActiveAlerts(tenantId?: string): Promise<SaasAlert[]> {
    let query = supabase
      .from('saas_alerts')
      .select('*')
      .eq('status', 'active')
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;
    if (error) throw new Error(`فشل في جلب التنبيهات: ${error.message}`);

    return (data || []) as SaasAlert[];
  }

  async createAlert(alert: Omit<SaasAlert, 'id' | 'created_at' | 'updated_at'>): Promise<SaasAlert> {
    // التحقق من عدم وجود تنبيه مشابه نشط
    const existingAlert = await this.findSimilarActiveAlert(alert);
    if (existingAlert) {
      return existingAlert;
    }

    const { data, error } = await supabase
      .from('saas_alerts')
      .insert({
        ...alert,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw new Error(`فشل في إنشاء التنبيه: ${error.message}`);

    // إرسال إشعارات فورية للتنبيهات الحرجة
    if (alert.severity === 'critical') {
      await this.sendImmediateNotification(data as SaasAlert);
    }

    return data as SaasAlert;
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const { error } = await supabase
      .from('saas_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: acknowledgedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) throw new Error(`فشل في تأكيد التنبيه: ${error.message}`);
  }

  async resolveAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('saas_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) throw new Error(`فشل في حل التنبيه: ${error.message}`);
  }

  async dismissAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('saas_alerts')
      .update({
        status: 'dismissed',
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) throw new Error(`فشل في رفض التنبيه: ${error.message}`);
  }

  private async findSimilarActiveAlert(alert: Partial<SaasAlert>): Promise<SaasAlert | null> {
    const { data, error } = await supabase
      .from('saas_alerts')
      .select('*')
      .eq('type', alert.type)
      .eq('status', 'active')
      .eq('tenant_id', alert.tenant_id || null)
      .eq('subscription_id', alert.subscription_id || null)
      .eq('invoice_id', alert.invoice_id || null)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('خطأ في البحث عن التنبيهات المشابهة:', error);
    }

    return data as SaasAlert | null;
  }

  // =======================================================
  // مراقبة الفواتير المتأخرة
  // =======================================================

  async checkOverdueInvoices(): Promise<void> {
    const { data: overdueInvoices, error } = await supabase
      .from('saas_invoices')
      .select(`
        *,
        tenant:tenants(id, name, email),
        subscription:saas_subscriptions(id, plan:subscription_plans(plan_name))
      `)
      .eq('status', 'sent')
      .lt('due_date', new Date().toISOString().split('T')[0]);

    if (error) {
      console.error('خطأ في فحص الفواتير المتأخرة:', error);
      return;
    }

    for (const invoice of overdueInvoices || []) {
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      let severity: AlertSeverity = 'low';
      if (daysOverdue > 30) severity = 'critical';
      else if (daysOverdue > 14) severity = 'high';
      else if (daysOverdue > 7) severity = 'medium';

      await this.createAlert({
        type: 'billing_overdue',
        severity,
        title: `فاتورة متأخرة - ${invoice.invoice_number}`,
        description: `الفاتورة رقم ${invoice.invoice_number} متأخرة بـ ${daysOverdue} يوم`,
        tenant_id: invoice.tenant_id,
        invoice_id: invoice.id,
        status: 'active',
        metadata: {
          days_overdue: daysOverdue,
          amount: invoice.total_amount,
          currency: invoice.currency,
          tenant_name: invoice.tenant?.name
        }
      });

      // تحديث حالة الفاتورة إلى متأخرة
      if (invoice.status !== 'overdue') {
        await supabase
          .from('saas_invoices')
          .update({ status: 'overdue' })
          .eq('id', invoice.id);
      }
    }
  }

  // =======================================================
  // مراقبة الاشتراكات المنتهية الصلاحية
  // =======================================================

  async checkExpiringSubscriptions(): Promise<void> {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: expiringSubscriptions, error } = await supabase
      .from('saas_subscriptions')
      .select(`
        *,
        tenant:tenants(id, name, email),
        plan:subscription_plans(plan_name)
      `)
      .eq('status', 'active')
      .eq('auto_renew', false)
      .lte('current_period_end', nextWeek.toISOString().split('T')[0]);

    if (error) {
      console.error('خطأ في فحص الاشتراكات المنتهية:', error);
      return;
    }

    for (const subscription of expiringSubscriptions || []) {
      const daysUntilExpiry = Math.floor(
        (new Date(subscription.current_period_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      let severity: AlertSeverity = 'medium';
      if (daysUntilExpiry <= 1) severity = 'critical';
      else if (daysUntilExpiry <= 3) severity = 'high';

      await this.createAlert({
        type: 'subscription_expiring',
        severity,
        title: `اشتراك ينتهي قريباً - ${subscription.tenant?.name}`,
        description: `اشتراك ${subscription.plan?.plan_name} ينتهي خلال ${daysUntilExpiry} يوم`,
        tenant_id: subscription.tenant_id,
        subscription_id: subscription.id,
        status: 'active',
        metadata: {
          days_until_expiry: daysUntilExpiry,
          plan_name: subscription.plan?.plan_name,
          amount: subscription.amount,
          tenant_name: subscription.tenant?.name
        }
      });
    }
  }

  // =======================================================
  // مراقبة المدفوعات الفاشلة
  // =======================================================

  async checkFailedPayments(): Promise<void> {
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);

    const { data: failedPayments, error } = await supabase
      .from('saas_payments')
      .select(`
        *,
        tenant:tenants(id, name, email),
        invoice:saas_invoices(invoice_number, total_amount)
      `)
      .eq('status', 'failed')
      .gte('created_at', lastHour.toISOString());

    if (error) {
      console.error('خطأ في فحص المدفوعات الفاشلة:', error);
      return;
    }

    for (const payment of failedPayments || []) {
      await this.createAlert({
        type: 'payment_failed',
        severity: 'high',
        title: `فشل في الدفع - ${payment.tenant?.name}`,
        description: `فشل في دفع ${payment.amount} ${payment.currency} للفاتورة ${payment.invoice?.invoice_number}`,
        tenant_id: payment.tenant_id,
        invoice_id: payment.invoice_id,
        status: 'active',
        metadata: {
          amount: payment.amount,
          currency: payment.currency,
          payment_method: payment.payment_method,
          failure_reason: payment.failure_reason,
          tenant_name: payment.tenant?.name
        }
      });
    }
  }

  // =======================================================
  // مراقبة حدود الاستخدام
  // =======================================================

  async checkUsageLimits(): Promise<void> {
    const { data: subscriptionsWithUsage, error } = await supabase
      .from('saas_subscriptions')
      .select(`
        *,
        tenant:tenants(id, name, email),
        plan:subscription_plans(*),
        usage:tenant_usage!tenant_usage_tenant_id_fkey(*)
      `)
      .eq('status', 'active')
      .order('tenant_usage.usage_date', { ascending: false, referencedTable: 'tenant_usage' })
      .limit(1, { referencedTable: 'tenant_usage' });

    if (error) {
      console.error('خطأ في فحص حدود الاستخدام:', error);
      return;
    }

    for (const subscription of subscriptionsWithUsage || []) {
      const usage = subscription.usage?.[0];
      const plan = subscription.plan;

      if (!usage || !plan) continue;

      const violations: string[] = [];

      // فحص حدود المستخدمين
      if (usage.users_count > plan.max_users_per_tenant) {
        violations.push(`المستخدمين: ${usage.users_count}/${plan.max_users_per_tenant}`);
      }

      // فحص حدود المركبات
      if (usage.vehicles_count > plan.max_vehicles) {
        violations.push(`المركبات: ${usage.vehicles_count}/${plan.max_vehicles}`);
      }

      // فحص حدود العقود
      if (usage.contracts_count > plan.max_contracts) {
        violations.push(`العقود: ${usage.contracts_count}/${plan.max_contracts}`);
      }

      // فحص حدود التخزين
      if (usage.storage_used_gb > plan.storage_limit_gb) {
        violations.push(`التخزين: ${usage.storage_used_gb}GB/${plan.storage_limit_gb}GB`);
      }

      if (violations.length > 0) {
        await this.createAlert({
          type: 'usage_limit_exceeded',
          severity: violations.length > 2 ? 'high' : 'medium',
          title: `تجاوز حدود الاستخدام - ${subscription.tenant?.name}`,
          description: `تم تجاوز الحدود التالية: ${violations.join(', ')}`,
          tenant_id: subscription.tenant_id,
          subscription_id: subscription.id,
          status: 'active',
          metadata: {
            violations,
            current_usage: usage,
            plan_limits: {
              max_users_per_tenant: plan.max_users_per_tenant,
              max_vehicles: plan.max_vehicles,
              max_contracts: plan.max_contracts,
              storage_limit_gb: plan.storage_limit_gb
            },
            tenant_name: subscription.tenant?.name
          }
        });
      }
    }
  }

  // =======================================================
  // مراقبة أداء النظام
  // =======================================================

  async checkSystemPerformance(): Promise<void> {
    try {
      // فحص أداء قاعدة البيانات
      const { data: dbStats } = await supabase.rpc('get_saas_performance_metrics');
      
      // فحص الاستجابة
      const startTime = Date.now();
      await supabase.from('subscription_plans').select('count').limit(1);
      const responseTime = Date.now() - startTime;

      // إنشاء تنبيه إذا كان الأداء بطيئاً
      if (responseTime > 5000) { // أكثر من 5 ثوان
        await this.createAlert({
          type: 'system_performance',
          severity: responseTime > 10000 ? 'critical' : 'high',
          title: 'بطء في أداء النظام',
          description: `وقت الاستجابة: ${responseTime}ms`,
          status: 'active',
          metadata: {
            response_time: responseTime,
            db_stats: dbStats,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('خطأ في فحص أداء النظام:', error);
    }
  }

  // =======================================================
  // مراقبة انخفاض الإيرادات
  // =======================================================

  async checkRevenueDrops(): Promise<void> {
    try {
      // مقارنة إيرادات هذا الشهر مع الشهر الماضي
      const currentMonth = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const lastMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

      const [currentRevenue, lastRevenue] = await Promise.all([
        this.getMonthlyRevenue(currentMonthStart, new Date()),
        this.getMonthlyRevenue(lastMonthStart, lastMonthEnd)
      ]);

      if (lastRevenue > 0) {
        const dropPercentage = ((lastRevenue - currentRevenue) / lastRevenue) * 100;
        
        if (dropPercentage > 20) { // انخفاض أكثر من 20%
          await this.createAlert({
            type: 'revenue_drop',
            severity: dropPercentage > 50 ? 'critical' : 'high',
            title: 'انخفاض في الإيرادات',
            description: `انخفضت الإيرادات بنسبة ${dropPercentage.toFixed(1)}% مقارنة بالشهر الماضي`,
            status: 'active',
            metadata: {
              current_revenue: currentRevenue,
              last_revenue: lastRevenue,
              drop_percentage: dropPercentage,
              current_month: currentMonth.toISOString(),
              last_month: lastMonth.toISOString()
            }
          });
        }
      }
    } catch (error) {
      console.error('خطأ في فحص انخفاض الإيرادات:', error);
    }
  }

  private async getMonthlyRevenue(startDate: Date, endDate: Date): Promise<number> {
    const { data, error } = await supabase
      .from('saas_payments')
      .select('amount')
      .eq('status', 'succeeded')
      .gte('paid_at', startDate.toISOString())
      .lte('paid_at', endDate.toISOString());

    if (error) throw error;

    return (data || []).reduce((sum, payment) => sum + payment.amount, 0);
  }

  // =======================================================
  // مراقبة معدل الإلغاء (Churn Rate)
  // =======================================================

  async checkChurnRate(): Promise<void> {
    try {
      const { data: churnRate } = await supabase.rpc('calculate_churn_rate', { months_back: 3 });
      
      if (churnRate > 10) { // معدل إلغاء أكثر من 10%
        await this.createAlert({
          type: 'churn_rate_high',
          severity: churnRate > 20 ? 'critical' : 'high',
          title: 'ارتفاع معدل الإلغاء',
          description: `معدل إلغاء الاشتراكات: ${churnRate}% في آخر 3 أشهر`,
          status: 'active',
          metadata: {
            churn_rate: churnRate,
            period_months: 3,
            calculated_at: new Date().toISOString()
          }
        });
      }
    } catch (error) {
      console.error('خطأ في فحص معدل الإلغاء:', error);
    }
  }

  // =======================================================
  // إدارة المراقبة التلقائية
  // =======================================================

  startMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    this.monitoringTimer = setInterval(async () => {
      try {
        await Promise.all([
          this.checkOverdueInvoices(),
          this.checkExpiringSubscriptions(),
          this.checkFailedPayments(),
          this.checkUsageLimits(),
          this.checkSystemPerformance(),
          this.checkRevenueDrops(),
          this.checkChurnRate()
        ]);
      } catch (error) {
        console.error('خطأ في المراقبة التلقائية:', error);
      }
    }, this.CHECK_INTERVAL);

    console.log('تم بدء المراقبة التلقائية لنظام SaaS');
  }

  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
      console.log('تم إيقاف المراقبة التلقائية لنظام SaaS');
    }
  }

  // =======================================================
  // الحصول على مقاييس المراقبة
  // =======================================================

  async getMonitoringMetrics(): Promise<MonitoringMetrics> {
    try {
      const [billingStats, performanceStats] = await Promise.all([
        supabase.rpc('get_optimized_billing_stats'),
        supabase.rpc('get_saas_performance_metrics')
      ]);

      const stats = billingStats.data || {};
      const perfStats = performanceStats.data || {};

      return {
        system_health: {
          cpu_usage: 0, // يحتاج integration مع monitoring system
          memory_usage: 0,
          database_connections: 0,
          response_time: perfStats.avg_response_time || 0
        },
        business_metrics: {
          total_revenue: stats.total_revenue || 0,
          monthly_revenue: stats.monthly_revenue || 0,
          active_subscriptions: stats.active_subscriptions || 0,
          churn_rate: 0, // سيحسب من دالة منفصلة
          conversion_rate: 0
        },
        operational_metrics: {
          overdue_invoices: stats.overdue_invoices || 0,
          failed_payments: 0, // سيحسب من الاستعلامات
          expiring_subscriptions: 0,
          support_tickets: 0
        },
        calculated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('خطأ في الحصول على مقاييس المراقبة:', error);
      throw new Error(`فشل في الحصول على مقاييس المراقبة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    }
  }

  // =======================================================
  // إرسال الإشعارات
  // =======================================================

  private async sendImmediateNotification(alert: SaasAlert): Promise<void> {
    try {
      // إرسال إشعار فوري للتنبيهات الحرجة
      // يمكن تكامل مع خدمات الإشعارات مثل:
      // - البريد الإلكتروني
      // - Slack
      // - SMS
      // - Push notifications

      console.log('إرسال إشعار فوري:', {
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description
      });

      // مثال على إرسال webhook للتنبيهات الحرجة
      if (process.env.ALERT_WEBHOOK_URL) {
        await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alert_type: alert.type,
            severity: alert.severity,
            title: alert.title,
            description: alert.description,
            metadata: alert.metadata,
            timestamp: alert.created_at
          })
        });
      }
    } catch (error) {
      console.error('خطأ في إرسال الإشعار الفوري:', error);
    }
  }

  // =======================================================
  // إحصائيات التنبيهات
  // =======================================================

  async getAlertStats(days: number = 30): Promise<{
    total_alerts: number;
    alerts_by_type: Record<AlertType, number>;
    alerts_by_severity: Record<AlertSeverity, number>;
    resolution_time_avg: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: alerts, error } = await supabase
      .from('saas_alerts')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (error) throw new Error(`فشل في جلب إحصائيات التنبيهات: ${error.message}`);

    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const alert of alerts || []) {
      // تجميع حسب النوع
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      
      // تجميع حسب الشدة
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
      
      // حساب متوسط وقت الحل
      if (alert.resolved_at && alert.created_at) {
        const resolutionTime = new Date(alert.resolved_at).getTime() - new Date(alert.created_at).getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    }

    return {
      total_alerts: alerts?.length || 0,
      alerts_by_type: alertsByType as Record<AlertType, number>,
      alerts_by_severity: alertsBySeverity as Record<AlertSeverity, number>,
      resolution_time_avg: resolvedCount > 0 ? totalResolutionTime / resolvedCount / (1000 * 60 * 60) : 0 // بالساعات
    };
  }

  // =======================================================
  // تنظيف الموارد
  // =======================================================

  dispose(): void {
    this.stopMonitoring();
    this.alertRules.clear();
  }
}

// إنشاء instance وحيد للخدمة
export const saasMonitoringService = new SaasMonitoringService();

// بدء المراقبة التلقائية عند تحميل الوحدة
if (typeof window !== 'undefined') {
  // فقط في بيئة المتصفح
  saasMonitoringService.startMonitoring();
} 