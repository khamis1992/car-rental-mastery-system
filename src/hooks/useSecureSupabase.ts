import { useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tenantIsolationMiddleware } from '@/middleware/TenantIsolationMiddleware';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';

/**
 * Hook آمن لاستخدام Supabase مع ضمان عزل البيانات
 */
export function useSecureSupabase() {
  const { currentTenant } = useTenant();

  // تحديد المؤسسة الحالية في الـ middleware
  useEffect(() => {
    if (currentTenant?.id) {
      tenantIsolationMiddleware.setCurrentTenant(currentTenant.id);
    } else {
      tenantIsolationMiddleware.reset();
    }
  }, [currentTenant?.id]);

  // إنشاء wrapper آمن لعمليات Supabase
  const secureClient = useMemo(() => {
    return {
      /**
       * استعلام آمن مع فلتر المؤسسة التلقائي
       */
      from: (table: string) => {
        const originalQuery = supabase.from(table as any);
        
        return {
          select: async (query?: string) => {
            try {
              // التحقق من صحة العملية
              const validation = await tenantIsolationMiddleware.validateOperation(
                table, 
                'select'
              );

              if (!validation.valid) {
                throw new Error(validation.error);
              }

              // تطبيق فلتر المؤسسة
              let filteredQuery = tenantIsolationMiddleware.applyTenantFilter(
                originalQuery,
                table
              );

              if (query) {
                filteredQuery = filteredQuery.select(query);
              } else {
                filteredQuery = filteredQuery.select('*');
              }

              const { data, error } = await filteredQuery;

              if (error) {
                console.error(`خطأ في استعلام ${table}:`, error);
                throw error;
              }

              // التحقق من سلامة البيانات المسترجعة
              const validation_result = tenantIsolationMiddleware.validateResponseData(
                data || [],
                table
              );

              if (!validation_result.valid && validation_result.violations > 0) {
                toast.error(`تم اكتشاف ${validation_result.violations} انتهاك أمني في البيانات`);
                console.warn(`انتهاكات أمنية في جدول ${table}:`, validation_result.violations);
              }

              return { 
                data: validation_result.filteredData, 
                error: null 
              };

            } catch (error: any) {
              console.error(`خطأ في العملية الآمنة على ${table}:`, error);
              return { 
                data: null, 
                error: error 
              };
            }
          },

          insert: async (data: any) => {
            try {
              // التحقق من صحة العملية
              const validation = await tenantIsolationMiddleware.validateOperation(
                table, 
                'insert',
                data
              );

              if (!validation.valid) {
                throw new Error(validation.error);
              }

              // تطبيق بيانات المؤسسة
              const secureData = tenantIsolationMiddleware.applyTenantData(data, table);

              const result = await originalQuery.insert(secureData);

              if (result.error) {
                console.error(`خطأ في إدراج ${table}:`, result.error);
              }

              return result;

            } catch (error: any) {
              console.error(`خطأ في العملية الآمنة على ${table}:`, error);
              return { 
                data: null, 
                error: error 
              };
            }
          },

          update: async (data: any) => {
            try {
              // التحقق من صحة العملية
              const validation = await tenantIsolationMiddleware.validateOperation(
                table, 
                'update',
                data
              );

              if (!validation.valid) {
                throw new Error(validation.error);
              }

              // تطبيق فلتر المؤسسة
              const filteredQuery = tenantIsolationMiddleware.applyTenantFilter(
                originalQuery,
                table
              );

              const result = await filteredQuery.update(data);

              if (result.error) {
                console.error(`خطأ في تحديث ${table}:`, result.error);
              }

              return result;

            } catch (error: any) {
              console.error(`خطأ في العملية الآمنة على ${table}:`, error);
              return { 
                data: null, 
                error: error 
              };
            }
          },

          delete: async () => {
            try {
              // التحقق من صحة العملية
              const validation = await tenantIsolationMiddleware.validateOperation(
                table, 
                'delete'
              );

              if (!validation.valid) {
                throw new Error(validation.error);
              }

              // تطبيق فلتر المؤسسة
              const filteredQuery = tenantIsolationMiddleware.applyTenantFilter(
                originalQuery,
                table
              );

              const result = await filteredQuery.delete();

              if (result.error) {
                console.error(`خطأ في حذف ${table}:`, result.error);
              }

              return result;

            } catch (error: any) {
              console.error(`خطأ في العملية الآمنة على ${table}:`, error);
              return { 
                data: null, 
                error: error 
              };
            }
          },

          // تمرير العمليات الأخرى مع الفلتر
          eq: (column: string, value: any) => {
            const query = tenantIsolationMiddleware.applyTenantFilter(
              originalQuery,
              table
            ).eq(column, value);
            
            return {
              select: async (selectQuery?: string) => {
                const { data, error } = await (selectQuery ? 
                  query.select(selectQuery) : 
                  query.select('*')
                );
                
                if (error) return { data: null, error };
                
                const validation = tenantIsolationMiddleware.validateResponseData(
                  data || [],
                  table
                );
                
                return { 
                  data: validation.filteredData, 
                  error: null 
                };
              }
            };
          }
        };
      },

      /**
       * استدعاء دالة قاعدة البيانات بشكل آمن
       */
      rpc: async (functionName: string, params?: any) => {
        try {
          // تسجيل استدعاء الدالة للمراقبة
          console.log(`استدعاء دالة آمنة: ${functionName}`, params);
          
          const result = await supabase.rpc(functionName as any, params);
          
          if (result.error) {
            console.error(`خطأ في استدعاء الدالة ${functionName}:`, result.error);
          }
          
          return result;
        } catch (error: any) {
          console.error(`خطأ في استدعاء الدالة ${functionName}:`, error);
          return { 
            data: null, 
            error: error 
          };
        }
      },

      /**
       * المصادقة (تمرير مباشر)
       */
      auth: supabase.auth,

      /**
       * التخزين (تمرير مباشر)
       */
      storage: supabase.storage
    };
  }, [currentTenant?.id]);

  return secureClient;
}

/**
 * Hook للتحقق من حالة عزل المؤسسة
 */
export function useTenantIsolationStatus() {
  const { currentTenant } = useTenant();

  const status = useMemo(() => {
    const tenantId = tenantIsolationMiddleware.getCurrentTenant();
    
    return {
      isIsolated: !!tenantId,
      currentTenantId: tenantId,
      isReady: !!currentTenant?.id && tenantId === currentTenant.id
    };
  }, [currentTenant?.id]);

  return status;
}