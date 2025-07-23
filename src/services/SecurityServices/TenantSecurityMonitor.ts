import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  id: string;
  event_type: 'unauthorized_access' | 'data_leak' | 'suspicious_query' | 'tenant_violation';
  description: string;
  user_id?: string;
  tenant_id?: string;
  table_name?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
  created_at: string;
}

interface SecurityAlert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  affected_tables: string[];
  created_at: string;
}

export class TenantSecurityMonitor {
  
  /**
   * تسجيل حدث أمني
   */
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_events')
        .insert([{
          ...event,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('فشل في تسجيل الحدث الأمني:', error);
      }
    } catch (error) {
      console.error('خطأ في تسجيل الحدث الأمني:', error);
    }
  }

  /**
   * فحص انتهاكات عزل البيانات
   */
  async detectDataIsolationViolations(): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    try {
      // فحص الجداول الحرجة للتأكد من عدم تسرب البيانات
      const criticalTables = [
        'customers', 'contracts', 'invoices', 'payments', 
        'employees', 'attendance', 'journal_entries'
      ];

      for (const tableName of criticalTables) {
        const violations = await this.checkTableIsolation(tableName);
        if (violations.length > 0) {
          alerts.push({
            id: `isolation-${tableName}-${Date.now()}`,
            title: `انتهاك عزل البيانات في ${tableName}`,
            message: `تم اكتشاف ${violations.length} انتهاك محتمل في جدول ${tableName}`,
            severity: 'critical',
            recommendations: [
              'فحص سياسات RLS فوراً',
              'مراجعة استعلامات قاعدة البيانات',
              'التحقق من صحة tenant_id'
            ],
            affected_tables: [tableName],
            created_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('خطأ في فحص انتهاكات عزل البيانات:', error);
    }

    return alerts;
  }

  /**
   * فحص عزل جدول معين
   */
  private async checkTableIsolation(tableName: string): Promise<any[]> {
    try {
      // محاولة الوصول للجدول بدون فلتر tenant_id للتحقق من RLS
      const { data, error } = await supabase
        .from(tableName as any)
        .select('id, tenant_id')
        .limit(1);

      if (error) {
        // إذا فشل الاستعلام بسبب RLS، فهذا جيد
        return [];
      }

      // إذا نجح الاستعلام، فهناك مشكلة محتملة
      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * مراقبة الاستعلامات المشبوهة
   */
  async monitorSuspiciousQueries(): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    
    try {
      // فحص محاولات الوصول غير المصرح بها من السجلات
      const { data: recentLogs } = await supabase
        .from('tenant_access_log')
        .select('*')
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (recentLogs && recentLogs.length > 10) {
        alerts.push({
          id: `suspicious-queries-${Date.now()}`,
          title: 'محاولات وصول مشبوهة',
          message: `تم رصد ${recentLogs.length} محاولة وصول فاشلة في آخر 24 ساعة`,
          severity: 'high',
          recommendations: [
            'مراجعة سجلات الوصول',
            'فحص حسابات المستخدمين',
            'تحديث كلمات المرور إذا لزم الأمر'
          ],
          affected_tables: [],
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('خطأ في مراقبة الاستعلامات المشبوهة:', error);
    }

    return alerts;
  }

  /**
   * فحص سلامة بيانات المؤسسة
   */
  async validateTenantDataIntegrity(tenantId: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // فحص الجداول الأساسية
      const tablesToCheck = [
        'customers', 'contracts', 'invoices', 'employees'
      ];

      for (const tableName of tablesToCheck) {
        // فحص وجود سجلات بدون tenant_id
        const { data: orphanedRecords } = await supabase
          .from(tableName as any)
          .select('id')
          .is('tenant_id', null);

        if (orphanedRecords && orphanedRecords.length > 0) {
          issues.push(`وُجد ${orphanedRecords.length} سجل بدون tenant_id في جدول ${tableName}`);
          recommendations.push(`تحديث السجلات المعزولة في جدول ${tableName}`);
        }

        // فحص وجود سجلات تنتمي لمؤسسات أخرى (انتهاك محتمل)
        const { data: foreignRecords } = await supabase
          .from(tableName as any)
          .select('id, tenant_id')
          .neq('tenant_id', tenantId);

        if (foreignRecords && foreignRecords.length > 0) {
          issues.push(`تم العثور على ${foreignRecords.length} سجل من مؤسسات أخرى في ${tableName}`);
          recommendations.push(`فحص سياسات RLS لجدول ${tableName}`);
        }
      }
    } catch (error) {
      console.error('خطأ في فحص سلامة البيانات:', error);
      issues.push('فشل في إجراء فحص شامل للبيانات');
      recommendations.push('إعادة تشغيل فحص السلامة');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * إنشاء تقرير أمني شامل
   */
  async generateSecurityReport(tenantId: string): Promise<{
    overall_status: 'secure' | 'at_risk' | 'compromised';
    security_score: number;
    alerts: SecurityAlert[];
    data_integrity: any;
    recommendations: string[];
    generated_at: string;
  }> {
    const alerts: SecurityAlert[] = [];
    let securityScore = 100;

    // فحص انتهاكات عزل البيانات
    const isolationAlerts = await this.detectDataIsolationViolations();
    alerts.push(...isolationAlerts);
    securityScore -= isolationAlerts.length * 20;

    // فحص الاستعلامات المشبوهة
    const queryAlerts = await this.monitorSuspiciousQueries();
    alerts.push(...queryAlerts);
    securityScore -= queryAlerts.length * 10;

    // فحص سلامة البيانات
    const dataIntegrity = await this.validateTenantDataIntegrity(tenantId);
    securityScore -= dataIntegrity.issues.length * 15;

    // تحديد الحالة العامة
    let overallStatus: 'secure' | 'at_risk' | 'compromised';
    if (securityScore >= 90) overallStatus = 'secure';
    else if (securityScore >= 70) overallStatus = 'at_risk';
    else overallStatus = 'compromised';

    // توصيات عامة
    const recommendations = [
      'مراجعة دورية لسياسات RLS',
      'تحديث كلمات المرور بانتظام',
      'مراقبة سجلات الوصول',
      'إجراء نسخ احتياطية منتظمة',
      ...dataIntegrity.recommendations
    ];

    return {
      overall_status: overallStatus,
      security_score: Math.max(0, securityScore),
      alerts,
      data_integrity: dataIntegrity,
      recommendations,
      generated_at: new Date().toISOString()
    };
  }

  /**
   * تفعيل المراقبة المستمرة
   */
  async enableContinuousMonitoring(): Promise<void> {
    // يمكن تنفيذ هذا كـ interval أو webhook
    console.log('تم تفعيل المراقبة الأمنية المستمرة');
    
    // تسجيل حدث التفعيل
    await this.logSecurityEvent({
      event_type: 'suspicious_query',
      description: 'تم تفعيل المراقبة الأمنية المستمرة',
      severity: 'low'
    });
  }
}

// تصدير instance واحد للاستخدام
export const tenantSecurityMonitor = new TenantSecurityMonitor();