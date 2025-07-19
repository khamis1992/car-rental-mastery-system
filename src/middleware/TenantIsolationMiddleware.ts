
import { supabase } from '@/integrations/supabase/client';

/**
 * Middleware لضمان عزل البيانات على مستوى الواجهة الأمامية
 */
export class TenantIsolationMiddleware {
  private static instance: TenantIsolationMiddleware;
  private currentTenantId: string | null = null;
  private allowedTables: Set<string> = new Set();
  
  private constructor() {
    this.initializeAllowedTables();
  }

  static getInstance(): TenantIsolationMiddleware {
    if (!TenantIsolationMiddleware.instance) {
      TenantIsolationMiddleware.instance = new TenantIsolationMiddleware();
    }
    return TenantIsolationMiddleware.instance;
  }

  private initializeAllowedTables() {
    // الجداول التي يُسمح بالوصول إليها مع عزل tenant
    this.allowedTables = new Set([
      'contracts',
      'customers', 
      'vehicles',
      'employees',
      'invoices',
      'payments',
      'quotations',
      'additional_charges',
      'contract_extensions',
      'contract_incidents',
      'customer_evaluations',
      'departments',
      'cost_centers'
    ]);
  }

  /**
   * تحديد المؤسسة الحالية مع التحقق المحسن
   */
  async setCurrentTenant(tenantId: string): Promise<void> {
    console.log('🔧 تحديد المؤسسة الحالية:', tenantId);
    
    try {
      // التحقق من صحة معرف المؤسسة
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name, status')
        .eq('id', tenantId)
        .single();

      if (error) {
        console.error('❌ خطأ في التحقق من المؤسسة:', error);
        throw new Error('معرف المؤسسة غير صحيح أو غير موجود');
      }

      if (!tenant) {
        throw new Error('المؤسسة غير موجودة');
      }

      // التحقق من حالة المؤسسة
      if (tenant.status !== 'active' && tenant.status !== 'trial') {
        throw new Error(`المؤسسة غير نشطة - الحالة: ${tenant.status}`);
      }

      this.currentTenantId = tenantId;
      console.log('✅ تم تحديد المؤسسة بنجاح:', tenant.name);
      
    } catch (error: any) {
      console.error('❌ فشل في تحديد المؤسسة:', error);
      this.currentTenantId = null;
      throw error;
    }
  }

  /**
   * الحصول على المؤسسة الحالية
   */
  getCurrentTenant(): string | null {
    return this.currentTenantId;
  }

  /**
   * التحقق من صحة العملية قبل تنفيذها
   */
  async validateOperation(
    table: string, 
    operation: 'select' | 'insert' | 'update' | 'delete',
    data?: any
  ): Promise<{ valid: boolean; error?: string }> {
    
    // التحقق من وجود مؤسسة حالية
    if (!this.currentTenantId) {
      return { 
        valid: false, 
        error: 'لم يتم تحديد المؤسسة الحالية. يرجى تسجيل الدخول أولاً.' 
      };
    }

    // التحقق من أن الجدول مسموح
    if (!this.allowedTables.has(table)) {
      await this.logSuspiciousActivity(table, operation, 'جدول غير مسموح');
      return { 
        valid: false, 
        error: `غير مصرح بالوصول إلى الجدول: ${table}` 
      };
    }

    // التحقق من عمليات الإدراج/التحديث
    if ((operation === 'insert' || operation === 'update') && data) {
      if (data.tenant_id && data.tenant_id !== this.currentTenantId) {
        await this.logSuspiciousActivity(table, operation, 'محاولة وصول لمؤسسة أخرى');
        return { 
          valid: false, 
          error: 'غير مصرح بالوصول إلى بيانات مؤسسة أخرى' 
        };
      }
    }

    return { valid: true };
  }

  /**
   * تسجيل النشاط المشبوه
   */
  private async logSuspiciousActivity(
    table: string, 
    operation: string, 
    reason: string
  ): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      console.warn(`🚨 نشاط مشبوه: ${reason}`, {
        table,
        operation,
        user: user.user?.id,
        tenant: this.currentTenantId,
        timestamp: new Date().toISOString()
      });

      // يمكن إضافة تسجيل في قاعدة البيانات هنا إذا لزم الأمر
      
    } catch (error) {
      console.error('خطأ في تسجيل النشاط المشبوه:', error);
    }
  }

  /**
   * تطبيق فلتر المؤسسة على الاستعلام
   */
  applyTenantFilter<T = any>(query: any, table: string): any {
    if (!this.currentTenantId) {
      throw new Error('لا يمكن تطبيق فلتر المؤسسة بدون تحديد المؤسسة الحالية');
    }

    if (this.allowedTables.has(table)) {
      console.log(`🔍 تطبيق فلتر المؤسسة على جدول: ${table}`);
      return query.eq('tenant_id', this.currentTenantId);
    }
    
    return query;
  }

  /**
   * تطبيق بيانات المؤسسة على عملية الإدراج
   */
  applyTenantData<T extends Record<string, any>>(data: T, table: string): T {
    if (!this.currentTenantId) {
      throw new Error('لا يمكن تطبيق بيانات المؤسسة بدون تحديد المؤسسة الحالية');
    }

    if (this.allowedTables.has(table)) {
      console.log(`📝 إضافة معرف المؤسسة للبيانات في جدول: ${table}`);
      return {
        ...data,
        tenant_id: this.currentTenantId
      };
    }

    return data;
  }

  /**
   * التحقق من سلامة البيانات المسترجعة
   */
  validateResponseData<T extends Record<string, any>[]>(
    data: T,
    table: string
  ): { valid: boolean; filteredData: T; violations: number } {
    if (!this.allowedTables.has(table)) {
      return { valid: true, filteredData: data, violations: 0 };
    }

    let violations = 0;
    const filteredData = data.filter(item => {
      if (item.tenant_id !== this.currentTenantId) {
        violations++;
        console.warn(`⚠️ انتهاك أمني: بيانات من مؤسسة أخرى في جدول ${table}:`, item.tenant_id);
        this.logSuspiciousActivity(table, 'select', 'بيانات مؤسسة أخرى في الاستجابة');
        return false;
      }
      return true;
    }) as T;

    return {
      valid: violations === 0,
      filteredData,
      violations
    };
  }

  /**
   * إعادة تعيين الحالة
   */
  reset(): void {
    console.log('🔄 إعادة تعيين middleware العزل');
    this.currentTenantId = null;
  }
}

// إنشاء instance مشترك
export const tenantIsolationMiddleware = TenantIsolationMiddleware.getInstance();
