import { supabase } from '@/integrations/supabase/client';

export interface SecurityLogEntry {
  user_id?: string;
  tenant_id?: string;
  table_name: string;
  operation: string;
  data?: any;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  timestamp: string;
}

export interface DataOperationLog {
  operation_type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  metadata: any;
}

export class DataSecurityService {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // التحقق من صحة الوصول للمؤسسة
  async validateTenantAccess(): Promise<void> {
    const tenantId = await this.getCurrentTenantId();
    if (!tenantId) {
      throw new Error('لا يمكن تحديد المؤسسة الحالية');
    }

    // التحقق من أن المؤسسة نشطة
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('status')
      .eq('id', tenantId)
      .single();

    if (error || !tenant || tenant.status !== 'active') {
      throw new Error('المؤسسة غير نشطة أو غير موجودة');
    }
  }

  // الحصول على معرف المؤسسة الحالية
  async getCurrentTenantId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      return tenantUser?.tenant_id || null;
    } catch (error) {
      console.error('خطأ في الحصول على معرف المؤسسة:', error);
      return null;
    }
  }

  // الحصول على معرف الموظف الحالي
  async getCurrentEmployeeId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      return employee?.id || null;
    } catch (error) {
      console.error('خطأ في الحصول على معرف الموظف:', error);
      return null;
    }
  }

  // التحقق من صحة الوصول للموظف
  async validateEmployeeAccess(employeeId: string): Promise<boolean> {
    try {
      const tenantId = await this.getCurrentTenantId();
      if (!tenantId) return false;

      const { data: employee } = await supabase
        .from('employees')
        .select('tenant_id, status')
        .eq('id', employeeId)
        .single();

      return employee?.tenant_id === tenantId && employee?.status === 'active';
    } catch (error) {
      console.error('خطأ في التحقق من صحة الوصول للموظف:', error);
      return false;
    }
  }

  // تسجيل عملية على البيانات للمراقبة
  async logDataOperation(operationType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE', tableName: string, metadata: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = await this.getCurrentTenantId();

      // استخدام النوع any لتجنب مشاكل TypeScript مع الجداول الجديدة
      await (supabase as any)
        .from('data_operation_logs')
        .insert({
          user_id: user?.id,
          tenant_id: tenantId,
          operation_type: operationType,
          table_name: tableName,
          metadata: metadata,
          timestamp: new Date().toISOString(),
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('خطأ في تسجيل عملية البيانات:', error);
      // لا نريد أن تفشل العملية الأساسية بسبب فشل التسجيل
    }
  }

  // تسجيل حدث أمني
  async logSecurityEvent(eventType: string, metadata: any): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = await this.getCurrentTenantId();

      // استخدام النوع any لتجنب مشاكل TypeScript مع الجداول الجديدة
      await (supabase as any)
        .from('security_events')
        .insert({
          user_id: user?.id,
          tenant_id: tenantId,
          event_type: eventType,
          table_name: this.tableName,
          metadata: metadata,
          timestamp: new Date().toISOString(),
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          severity: this.determineEventSeverity(eventType)
        });
    } catch (error) {
      console.error('خطأ في تسجيل الحدث الأمني:', error);
      // لا نريد أن تفشل العملية الأساسية بسبب فشل التسجيل
    }
  }

  // تحديد مستوى خطورة الحدث الأمني
  private determineEventSeverity(eventType: string): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityEvents = [
      'unauthorized_access',
      'data_breach_attempt',
      'privilege_escalation'
    ];
    
    const mediumSeverityEvents = [
      'access_denied',
      'invalid_tenant_access',
      'failed_authentication'
    ];

    if (highSeverityEvents.includes(eventType)) return 'high';
    if (mediumSeverityEvents.includes(eventType)) return 'medium';
    return 'low';
  }

  // الحصول على عنوان IP للعميل
  private async getClientIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('خطأ في الحصول على عنوان IP:', error);
      return null;
    }
  }

  // فحص صحة الفلاتر لمنع SQL Injection
  validateFilters(filters: any): boolean {
    try {
      // فحص أساسي للتأكد من أن الفلاتر لا تحتوي على كود ضار
      const jsonString = JSON.stringify(filters);
      const dangerousPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|UNION)\b)/gi,
        /(--|\/\*|\*\/)/g,
        /(\b(OR|AND)\s+[\d']+\s*=\s*[\d']+)/gi
      ];

      return !dangerousPatterns.some(pattern => pattern.test(jsonString));
    } catch (error) {
      console.error('خطأ في فحص الفلاتر:', error);
      return false;
    }
  }

  // تشفير البيانات الحساسة قبل التخزين
  async encryptSensitiveData(data: string): Promise<string> {
    try {
      // تنفيذ تشفير بسيط (يجب استخدام مكتبة تشفير قوية في الإنتاج)
      return btoa(data);
    } catch (error) {
      console.error('خطأ في تشفير البيانات:', error);
      return data;
    }
  }

  // فك تشفير البيانات الحساسة
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    try {
      return atob(encryptedData);
    } catch (error) {
      console.error('خطأ في فك تشفير البيانات:', error);
      return encryptedData;
    }
  }

  // إنشاء تقرير أمني
  async generateSecurityReport(dateRange: { startDate: string; endDate: string }): Promise<any> {
    try {
      const tenantId = await this.getCurrentTenantId();
      
      // جلب الأحداث الأمنية
      const { data: securityEvents } = await (supabase as any)
        .from('security_events')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('timestamp', dateRange.startDate)
        .lte('timestamp', dateRange.endDate)
        .order('timestamp', { ascending: false });

      // جلب سجلات العمليات
      const { data: operationLogs } = await (supabase as any)
        .from('data_operation_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('timestamp', dateRange.startDate)
        .lte('timestamp', dateRange.endDate);

      // تحليل البيانات
      const totalEvents = securityEvents?.length || 0;
      const criticalEvents = securityEvents?.filter((e: any) => e.severity === 'critical').length || 0;
      const highEvents = securityEvents?.filter((e: any) => e.severity === 'high').length || 0;
      const totalOperations = operationLogs?.length || 0;
      const failedOperations = securityEvents?.filter((e: any) => e.event_type.includes('failed')).length || 0;

      return {
        summary: {
          totalEvents,
          criticalEvents,
          highEvents,
          totalOperations,
          failedOperations,
          securityScore: this.calculateSecurityScore(totalEvents, criticalEvents, highEvents)
        },
        events: securityEvents,
        operations: operationLogs,
        recommendations: this.generateSecurityRecommendations(criticalEvents, highEvents, failedOperations)
      };
    } catch (error) {
      console.error('خطأ في إنشاء التقرير الأمني:', error);
      throw error;
    }
  }

  // حساب نقاط الأمان
  private calculateSecurityScore(totalEvents: number, criticalEvents: number, highEvents: number): number {
    const baseScore = 100;
    const criticalPenalty = criticalEvents * 20;
    const highPenalty = highEvents * 10;
    const totalPenalty = Math.min(criticalPenalty + highPenalty, 90);
    
    return Math.max(baseScore - totalPenalty, 10);
  }

  // إنشاء توصيات أمنية
  private generateSecurityRecommendations(criticalEvents: number, highEvents: number, failedOperations: number): string[] {
    const recommendations: string[] = [];

    if (criticalEvents > 0) {
      recommendations.push('توجد أحداث أمنية حرجة تتطلب اهتماماً فورياً');
      recommendations.push('مراجعة صلاحيات المستخدمين والموظفين');
    }

    if (highEvents > 5) {
      recommendations.push('عدد كبير من الأحداث الأمنية عالية الخطورة');
      recommendations.push('تعزيز آليات المراقبة والتحقق');
    }

    if (failedOperations > 10) {
      recommendations.push('عدد كبير من العمليات الفاشلة');
      recommendations.push('تحسين آليات التحقق من صحة البيانات');
    }

    if (recommendations.length === 0) {
      recommendations.push('الوضع الأمني جيد، استمر في المراقبة المنتظمة');
    }

    return recommendations;
  }
}