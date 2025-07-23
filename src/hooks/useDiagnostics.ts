import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DiagnosticResult {
  isAuthenticated: boolean;
  userId: string | null;
  tenantId: string | null;
  sessionValid: boolean;
  permissions: string[];
  timestamp: Date;
  errors: string[];
}

export const useDiagnostics = () => {
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, session } = useAuth();

  const runDiagnostics = useCallback(async (): Promise<DiagnosticResult> => {
    setLoading(true);
    const errors: string[] = [];
    
    try {
      console.log('🔍 بدء التشخيص الشامل...');
      
      // فحص المصادقة الأساسي
      const isAuthenticated = !!user && !!session;
      const userId = user?.id || null;
      const sessionValid = !!session && new Date(session.expires_at || 0) > new Date();
      
      let tenantId: string | null = null;
      let permissions: string[] = [];
      
      if (isAuthenticated) {
        try {
          // استخدام الدالة الجديدة للحصول على معلومات المستخدم
          const { data: userInfo, error } = await supabase.rpc('get_current_user_info');
          
          if (error) {
            errors.push(`خطأ في جلب معلومات المستخدم: ${error.message}`);
          } else {
            const info = userInfo as any;
            tenantId = info?.tenant_id || null;
            
            if (!info?.is_authenticated) {
              errors.push('المستخدم غير مصادق عليه رغم وجود الجلسة');
            }
            
            if (!tenantId) {
              errors.push('لا يمكن تحديد معرف المؤسسة');
            }
          }
          
          // فحص الصلاحيات
          try {
            const { data: rolesData, error: rolesError } = await supabase
              .from('tenant_user_roles')
              .select('role')
              .eq('user_id', userId)
              .eq('is_active', true);
              
            if (rolesError) {
              errors.push(`خطأ في جلب الصلاحيات: ${rolesError.message}`);
            } else {
              permissions = rolesData?.map(r => r.role) || [];
              
              if (permissions.length === 0) {
                errors.push('المستخدم لا يملك أي صلاحيات مُعينة');
              }
            }
          } catch (permError) {
            errors.push('خطأ في فحص الصلاحيات');
          }
          
          // فحص الوصول لجدول الحسابات
          try {
            const { data: accountsTest, error: accountsError } = await supabase
              .from('chart_of_accounts')
              .select('id')
              .limit(1);
              
            if (accountsError) {
              errors.push(`خطأ في الوصول لجدول الحسابات: ${accountsError.message}`);
              
              if (accountsError.message.includes('row-level security')) {
                errors.push('سياسات الأمان تمنع الوصول للحسابات');
              }
            }
          } catch (accessError) {
            errors.push('فشل في اختبار الوصول لجدول الحسابات');
          }
          
        } catch (generalError) {
          errors.push('خطأ عام في فحص المصادقة');
        }
      } else {
        errors.push('المستخدم غير مصادق عليه');
      }
      
      const result: DiagnosticResult = {
        isAuthenticated,
        userId,
        tenantId,
        sessionValid,
        permissions,
        timestamp: new Date(),
        errors
      };
      
      setDiagnosticResult(result);
      console.log('✅ انتهى التشخيص:', result);
      
      return result;
      
    } catch (error) {
      console.error('💥 خطأ في التشخيص:', error);
      const result: DiagnosticResult = {
        isAuthenticated: false,
        userId: null,
        tenantId: null,
        sessionValid: false,
        permissions: [],
        timestamp: new Date(),
        errors: [`خطأ عام في التشخيص: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`]
      };
      
      setDiagnosticResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  const clearDiagnostics = useCallback(() => {
    setDiagnosticResult(null);
  }, []);

  return {
    diagnosticResult,
    loading,
    runDiagnostics,
    clearDiagnostics
  };
};