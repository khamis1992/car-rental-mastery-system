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
// خدمة المراقبة والتنبيهات المتقدمة (مبسطة)
// =======================================================

export class SaasMonitoringService {
  private alertRules: Map<string, AlertRule> = new Map();
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 دقائق
  private monitoringTimer?: NodeJS.Timeout;
  private alerts: SaasAlert[] = []; // تخزين مؤقت للتنبيهات

  // =======================================================
  // إدارة التنبيهات (مبسطة للعمل بدون جدول قاعدة بيانات)
  // =======================================================

  async getActiveAlerts(tenantId?: string): Promise<SaasAlert[]> {
    // العودة للتنبيهات المخزنة محلياً
    return this.alerts.filter(alert => 
      alert.status === 'active' && 
      (!tenantId || alert.tenant_id === tenantId)
    );
  }

  async createAlert(alert: Omit<SaasAlert, 'id' | 'created_at' | 'updated_at'>): Promise<SaasAlert> {
    // التحقق من عدم وجود تنبيه مشابه نشط
    const existingAlert = this.findSimilarActiveAlert(alert);
    if (existingAlert) {
      return existingAlert;
    }

    const newAlert: SaasAlert = {
      ...alert,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active'
    };

    this.alerts.push(newAlert);

    // إرسال إشعارات فورية للتنبيهات الحرجة
    if (alert.severity === 'critical') {
      await this.sendImmediateNotification(newAlert);
    }

    return newAlert;
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledged_at = new Date().toISOString();
      alert.acknowledged_by = acknowledgedBy;
      alert.updated_at = new Date().toISOString();
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolved_at = new Date().toISOString();
      alert.updated_at = new Date().toISOString();
    }
  }

  async dismissAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'dismissed';
      alert.updated_at = new Date().toISOString();
    }
  }

  private findSimilarActiveAlert(alert: Partial<SaasAlert>): SaasAlert | null {
    return this.alerts.find(a => 
      a.type === alert.type &&
      a.status === 'active' &&
      a.tenant_id === alert.tenant_id &&
      a.subscription_id === alert.subscription_id &&
      a.invoice_id === alert.invoice_id
    ) || null;
  }

  // =======================================================
  // مراقبة الفواتير المتأخرة
  // =======================================================

  async checkOverdueInvoices(): Promise<void> {
    try {
      const { data: overdueInvoices, error } = await supabase
        .from('saas_invoices')
        .select('*')
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
            amount: invoice.amount_due || 0,
            currency: invoice.currency,
            tenant_name: 'Tenant'
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
    } catch (error) {
      console.error('خطأ في فحص الفواتير المتأخرة:', error);
    }
  }

  // =======================================================
  // مراقبة الاشتراكات المنتهية الصلاحية
  // =======================================================

  async checkExpiringSubscriptions(): Promise<void> {
    try {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { data: expiringSubscriptions, error } = await supabase
        .from('saas_subscriptions')
        .select('*')
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
          title: `اشتراك ينتهي قريباً - Tenant`,
          description: `اشتراك ينتهي خلال ${daysUntilExpiry} يوم`,
          tenant_id: subscription.tenant_id,
          subscription_id: subscription.id,
          status: 'active',
          metadata: {
            days_until_expiry: daysUntilExpiry,
            plan_name: 'Plan',
            amount: subscription.amount,
            tenant_name: 'Tenant'
          }
        });
      }
    } catch (error) {
      console.error('خطأ في فحص الاشتراكات المنتهية:', error);
    }
  }

  // =======================================================
  // مراقبة المدفوعات الفاشلة
  // =======================================================

  async checkFailedPayments(): Promise<void> {
    try {
      const lastHour = new Date();
      lastHour.setHours(lastHour.getHours() - 1);

      const { data: failedPayments, error } = await supabase
        .from('saas_payments')
        .select('*')
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
          title: `فشل في الدفع - Tenant`,
          description: `فشل في دفع ${payment.amount} ${payment.currency} للفاتورة`,
          tenant_id: payment.tenant_id,
          invoice_id: payment.invoice_id,
          status: 'active',
          metadata: {
            amount: payment.amount,
            currency: payment.currency,
            payment_method: payment.payment_method,
            failure_reason: payment.failure_reason,
            tenant_name: 'Tenant'
          }
        });
      }
    } catch (error) {
      console.error('خطأ في فحص المدفوعات الفاشلة:', error);
    }
  }

  // =======================================================
  // الحصول على مقاييس المراقبة
  // =======================================================

  async getMonitoringMetrics(): Promise<MonitoringMetrics> {
    try {
      // الحصول على إحصائيات مبسطة من الجداول الموجودة
      const [invoicesData, paymentsData, subscriptionsData] = await Promise.all([
        supabase.from('saas_invoices').select('status, total_amount').eq('status', 'overdue'),
        supabase.from('saas_payments').select('amount, status').eq('status', 'succeeded'),
        supabase.from('saas_subscriptions').select('status').eq('status', 'active')
      ]);

      const overdueInvoices = invoicesData.data?.length || 0;
      const totalRevenue = paymentsData.data?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const activeSubscriptions = subscriptionsData.data?.length || 0;

      return {
        system_health: {
          cpu_usage: 0,
          memory_usage: 0,
          database_connections: 0,
          response_time: 0
        },
        business_metrics: {
          total_revenue: totalRevenue,
          monthly_revenue: 0,
          active_subscriptions: activeSubscriptions,
          churn_rate: 0,
          conversion_rate: 0
        },
        operational_metrics: {
          overdue_invoices: overdueInvoices,
          failed_payments: 0,
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
          this.checkFailedPayments()
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
  // إرسال الإشعارات
  // =======================================================

  private async sendImmediateNotification(alert: SaasAlert): Promise<void> {
    try {
      console.log('إرسال إشعار فوري:', {
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description
      });
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
    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};
    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const alert of this.alerts) {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
      
      if (alert.resolved_at && alert.created_at) {
        const resolutionTime = new Date(alert.resolved_at).getTime() - new Date(alert.created_at).getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    }

    return {
      total_alerts: this.alerts.length,
      alerts_by_type: alertsByType as Record<AlertType, number>,
      alerts_by_severity: alertsBySeverity as Record<AlertSeverity, number>,
      resolution_time_avg: resolvedCount > 0 ? totalResolutionTime / resolvedCount / (1000 * 60 * 60) : 0
    };
  }

  // =======================================================
  // تنظيف الموارد
  // =======================================================

  dispose(): void {
    this.stopMonitoring();
    this.alertRules.clear();
    this.alerts = [];
  }
}

// إنشاء instance وحيد للخدمة
export const saasMonitoringService = new SaasMonitoringService();

// بدء المراقبة التلقائية عند تحميل الوحدة
if (typeof window !== 'undefined') {
  // فقط في بيئة المتصفح
  saasMonitoringService.startMonitoring();
}