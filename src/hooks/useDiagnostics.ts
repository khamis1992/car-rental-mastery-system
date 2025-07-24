import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DiagnosticResult {
  isAuthenticated: boolean;
  userId: string | null;
  tenantId: string | null;
  sessionValid: boolean;
  sessionInfo: {
    expiresAt: string | null;
    timeRemaining: number;
    canRefresh: boolean;
    lastRefresh: string | null;
  };
  permissions: string[];
  timestamp: Date;
  errors: string[];
  warnings: string[];
}

export const useDiagnostics = () => {
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, session, sessionValid, sessionTimeRemaining } = useAuth();

  const runDiagnostics = useCallback(async (): Promise<DiagnosticResult> => {
    setLoading(true);
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      console.log('🔍 بدء التشخيص الشامل...');
      
      // فحص المصادقة الأساسي
      const isAuthenticated = !!user && !!session;
      const userId = user?.id || null;
      const currentSessionValid = !!session && new Date((session.expires_at || 0) * 1000) > new Date();
      
      // معلومات الجلسة المحسنة
      const sessionInfo = {
        expiresAt: session?.expires_at ? new Date((session.expires_at || 0) * 1000).toISOString() : null,
        timeRemaining: sessionTimeRemaining || 0,
        canRefresh: currentSessionValid && sessionTimeRemaining < 3600, // يمكن التحديث إذا تبقى أقل من ساعة
        lastRefresh: session?.refresh_token ? new Date().toISOString() : null
      };
      
      // إضافة تحذيرات الجلسة
      if (sessionInfo.timeRemaining < 300 && sessionInfo.timeRemaining > 0) {
        warnings.push('الجلسة ستنتهي خلال 5 دقائق');
      } else if (sessionInfo.timeRemaining <= 0) {
        errors.push('انتهت صلاحية الجلسة');
      } else if (sessionInfo.timeRemaining < 1800) {
        warnings.push('الجلسة ستنتهي قريباً');
      }
      
      let tenantId: string | null = null;
      let permissions: string[] = [];
      
      if (isAuthenticated) {
        try {
          // استخدام الدالة المحسنة للحصول على معلومات المستخدم
          const { data: userInfo, error } = await supabase.rpc('get_current_user_info');
          
          if (error) {
            errors.push(`خطأ في جلب معلومات المستخدم: ${error.message}`);
            console.error('❌ User info error:', error);
          } else {
            console.log('✅ User info retrieved:', userInfo);
            const info = userInfo as any;
            tenantId = info?.tenant_id || null;
            
            if (!info?.is_authenticated) {
              errors.push('المستخدم غير مصادق عليه رغم وجود الجلسة');
            }
            
            if (!tenantId) {
              errors.push('لا يمكن تحديد معرف المؤسسة - ستقوم بإنشاء مستخدم اختبار');
              
              // محاولة إنشاء مستخدم اختبار للتطوير
              try {
                const { data: testResult } = await supabase.rpc('create_default_test_user');
                console.log('🧪 Test user creation result:', testResult);
                
                const testResultData = testResult as any;
                if (testResultData?.success) {
                  tenantId = testResultData.tenant_id;
                  errors.push('تم إنشاء مستخدم اختبار - يرجى تحديث الصفحة');
                }
              } catch (testError) {
                console.error('❌ Failed to create test user:', testError);
                errors.push('فشل في إنشاء مستخدم اختبار');
              }
            }
          }
          
          // فحص الصلاحيات من جدول tenant_users
          try {
            const { data: userRoles, error: rolesError } = await supabase
              .from('tenant_users')
              .select('role, status, tenant_id')
              .eq('user_id', userId);
              
            if (rolesError) {
              errors.push(`خطأ في جلب الصلاحيات: ${rolesError.message}`);
              console.error('❌ Roles error:', rolesError);
            } else {
              console.log('✅ User roles:', userRoles);
              permissions = userRoles
                ?.filter(r => r.status === 'active')
                ?.map(r => r.role) || [];
              
              if (permissions.length === 0) {
                errors.push('المستخدم لا يملك أي صلاحيات مُعينة');
              }
            }
          } catch (permError) {
            console.error('❌ Permission check error:', permError);
            errors.push('خطأ في فحص الصلاحيات');
          }
          
          // فحص الوصول لجدول الحسابات
          try {
            const { data: accountsTest, error: accountsError } = await supabase
              .from('chart_of_accounts')
              .select('id, account_name')
              .limit(3);
              
            if (accountsError) {
              errors.push(`خطأ في الوصول لجدول الحسابات: ${accountsError.message}`);
              console.error('❌ Chart of accounts error:', accountsError);
              
              if (accountsError.message.includes('row-level security')) {
                errors.push('سياسات الأمان تمنع الوصول للحسابات');
              }
            } else {
              console.log('✅ Chart of accounts accessible:', accountsTest?.length || 0, 'accounts found');
            }
          } catch (accessError) {
            console.error('❌ Chart access error:', accessError);
            errors.push('فشل في اختبار الوصول لجدول الحسابات');
          }
          
        } catch (generalError) {
          console.error('❌ General auth error:', generalError);
          errors.push(`خطأ عام في فحص المصادقة: ${generalError instanceof Error ? generalError.message : 'خطأ غير معروف'}`);
        }
      } else {
        errors.push('المستخدم غير مصادق عليه - يرجى تسجيل الدخول');
        console.warn('⚠️ User not authenticated');
      }
      
      const result: DiagnosticResult = {
        isAuthenticated,
        userId,
        tenantId,
        sessionValid: currentSessionValid,
        sessionInfo,
        permissions,
        timestamp: new Date(),
        errors,
        warnings
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
        sessionInfo: {
          expiresAt: null,
          timeRemaining: 0,
          canRefresh: false,
          lastRefresh: null
        },
        permissions: [],
        timestamp: new Date(),
        errors: [`خطأ عام في التشخيص: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`],
        warnings: []
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