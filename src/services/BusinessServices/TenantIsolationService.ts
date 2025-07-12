import { supabase } from '@/integrations/supabase/client';

export interface TenantAccessLog {
  id: string;
  user_id: string;
  tenant_id: string;
  attempted_tenant_id: string;
  table_name: string;
  action: string;
  success: boolean;
  created_at: string;
}

export interface TenantIsolationReport {
  total_access_attempts: number;
  successful_attempts: number;
  failed_attempts: number;
  suspicious_attempts: number;
  tables_accessed: string[];
  period: string;
}

export class TenantIsolationService {
  /**
   * تسجيل محاولة وصول للمراقبة
   */
  async logAccess(
    attemptedTenantId: string,
    tableName: string,
    action: string,
    success: boolean
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!tenantUser) return;

      await supabase.rpc('log_tenant_access', {
        p_tenant_id: tenantUser.tenant_id,
        p_attempted_tenant_id: attemptedTenantId,
        p_table_name: tableName,
        p_action: action,
        p_success: success
      });
    } catch (error) {
      console.error('خطأ في تسجيل محاولة الوصول:', error);
    }
  }

  /**
   * التحقق من صحة الوصول للمؤسسة
   */
  async validateTenantAccess(tenantId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('validate_tenant_access', {
        table_tenant_id: tenantId
      });

      if (error) {
        console.error('خطأ في التحقق من الوصول:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('خطأ في التحقق من الوصول للمؤسسة:', error);
      return false;
    }
  }

  /**
   * الحصول على سجل محاولات الوصول
   */
  async getAccessLogs(
    limit: number = 100,
    fromDate?: Date
  ): Promise<TenantAccessLog[]> {
    try {
      let query = supabase
        .from('tenant_access_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fromDate) {
        query = query.gte('created_at', fromDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('خطأ في جلب سجل الوصول:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('خطأ في جلب سجل الوصول:', error);
      return [];
    }
  }

  /**
   * إنشاء تقرير عزل البيانات
   */
  async generateIsolationReport(
    fromDate: Date,
    toDate: Date
  ): Promise<TenantIsolationReport> {
    try {
      const logs = await this.getAccessLogs(1000, fromDate);
      
      const filteredLogs = logs.filter(log => 
        new Date(log.created_at) >= fromDate && 
        new Date(log.created_at) <= toDate
      );

      const totalAttempts = filteredLogs.length;
      const successfulAttempts = filteredLogs.filter(log => log.success).length;
      const failedAttempts = totalAttempts - successfulAttempts;
      
      // المحاولات المشبوهة: المحاولات الفاشلة أو محاولات الوصول لمؤسسات مختلفة
      const suspiciousAttempts = filteredLogs.filter(log => 
        !log.success || log.tenant_id !== log.attempted_tenant_id
      ).length;

      const tablesAccessed = [...new Set(filteredLogs.map(log => log.table_name))];

      return {
        total_access_attempts: totalAttempts,
        successful_attempts: successfulAttempts,
        failed_attempts: failedAttempts,
        suspicious_attempts: suspiciousAttempts,
        tables_accessed: tablesAccessed,
        period: `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`
      };
    } catch (error) {
      console.error('خطأ في إنشاء تقرير عزل البيانات:', error);
      return {
        total_access_attempts: 0,
        successful_attempts: 0,
        failed_attempts: 0,
        suspicious_attempts: 0,
        tables_accessed: [],
        period: 'غير متاح'
      };
    }
  }

  /**
   * التحقق من سلامة عزل البيانات
   */
  async checkIsolationIntegrity(): Promise<{
    is_secure: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // التحقق من وجود محاولات وصول مشبوهة في آخر 24 ساعة
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const suspiciousLogs = await this.getAccessLogs(100, yesterday);
      const suspiciousCount = suspiciousLogs.filter(log => 
        !log.success || log.tenant_id !== log.attempted_tenant_id
      ).length;

      if (suspiciousCount > 10) {
        issues.push(`عدد كبير من محاولات الوصول المشبوهة: ${suspiciousCount}`);
        recommendations.push('مراجعة سجل الوصول وتعزيز الأمان');
      }

      // فحص أساسي للبيانات
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);

      if (!tenantData || tenantData.length === 0) {
        issues.push('لا توجد مؤسسات في النظام');
        recommendations.push('إنشاء مؤسسة واحدة على الأقل');
      }

      return {
        is_secure: issues.length === 0,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('خطأ في فحص سلامة العزل:', error);
      return {
        is_secure: false,
        issues: ['خطأ في فحص النظام'],
        recommendations: ['إعادة تشغيل الفحص']
      };
    }
  }

  /**
   * الحصول على إحصائيات المؤسسة الحالية
   */
  async getCurrentTenantStats(): Promise<{
    tenant_id: string;
    tenant_name: string;
    total_users: number;
    total_vehicles: number;
    total_contracts: number;
    last_activity: string;
  } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: tenantUser } = await supabase
        .from('tenant_users')
        .select(`
          tenant_id,
          tenants (
            name,
            status
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!tenantUser) return null;

      // جلب الإحصائيات
      const [usersCount, vehiclesCount, contractsCount, lastActivity] = await Promise.all([
        supabase.from('tenant_users').select('id', { count: 'exact' }).eq('tenant_id', tenantUser.tenant_id),
        supabase.from('vehicles').select('id', { count: 'exact' }).eq('tenant_id', tenantUser.tenant_id),
        supabase.from('contracts').select('id', { count: 'exact' }).eq('tenant_id', tenantUser.tenant_id),
        supabase.from('tenant_access_log').select('created_at').eq('tenant_id', tenantUser.tenant_id).order('created_at', { ascending: false }).limit(1).single()
      ]);

      return {
        tenant_id: tenantUser.tenant_id,
        tenant_name: (tenantUser.tenants as any)?.name || 'غير محدد',
        total_users: usersCount.count || 0,
        total_vehicles: vehiclesCount.count || 0,
        total_contracts: contractsCount.count || 0,
        last_activity: lastActivity?.data?.created_at || 'لا يوجد نشاط مسجل'
      };
    } catch (error) {
      console.error('خطأ في جلب إحصائيات المؤسسة:', error);
      return null;
    }
  }
}

// إنشاء instance مشترك
export const tenantIsolationService = new TenantIsolationService();