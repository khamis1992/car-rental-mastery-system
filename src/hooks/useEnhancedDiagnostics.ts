import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

interface DiagnosticTest {
  name: string;
  nameAr: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  result?: any;
  error?: string;
  recommendation?: string;
}

interface ComprehensiveDiagnostics {
  authentication: DiagnosticTest;
  session: DiagnosticTest;
  tenant: DiagnosticTest;
  database: DiagnosticTest;
  permissions: DiagnosticTest;
  functions: DiagnosticTest;
}

export const useEnhancedDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<ComprehensiveDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, session, sessionValid, sessionTimeRemaining } = useAuth();
  const { currentTenant, currentUserRole } = useTenant();

  const initializeDiagnostics = (): ComprehensiveDiagnostics => ({
    authentication: {
      name: 'Authentication Check',
      nameAr: 'فحص المصادقة',
      status: 'pending'
    },
    session: {
      name: 'Session Validation',
      nameAr: 'فحص الجلسة',
      status: 'pending'
    },
    tenant: {
      name: 'Tenant Association',
      nameAr: 'فحص المؤسسة',
      status: 'pending'
    },
    database: {
      name: 'Database Connectivity',
      nameAr: 'فحص قاعدة البيانات',
      status: 'pending'
    },
    permissions: {
      name: 'User Permissions',
      nameAr: 'فحص الصلاحيات',
      status: 'pending'
    },
    functions: {
      name: 'Database Functions',
      nameAr: 'فحص دوال قاعدة البيانات',
      status: 'pending'
    }
  });

  const updateDiagnostic = (
    diagnostics: ComprehensiveDiagnostics,
    key: keyof ComprehensiveDiagnostics,
    update: Partial<DiagnosticTest>
  ) => {
    diagnostics[key] = { ...diagnostics[key], ...update };
    setDiagnostics({ ...diagnostics });
  };

  const testAuthentication = async (diag: ComprehensiveDiagnostics) => {
    updateDiagnostic(diag, 'authentication', { status: 'running' });
    
    try {
      if (!user) {
        updateDiagnostic(diag, 'authentication', {
          status: 'error',
          error: 'No authenticated user found',
          recommendation: 'يرجى تسجيل الدخول أولاً'
        });
        return;
      }

      updateDiagnostic(diag, 'authentication', {
        status: 'success',
        result: {
          userId: user.id,
          email: user.email,
          lastSignIn: user.last_sign_in_at,
          emailConfirmed: user.email_confirmed_at ? true : false
        }
      });
    } catch (error: any) {
      updateDiagnostic(diag, 'authentication', {
        status: 'error',
        error: error.message,
        recommendation: 'تحقق من حالة تسجيل الدخول'
      });
    }
  };

  const testSession = async (diag: ComprehensiveDiagnostics) => {
    updateDiagnostic(diag, 'session', { status: 'running' });
    
    try {
      if (!session) {
        updateDiagnostic(diag, 'session', {
          status: 'error',
          error: 'No active session found',
          recommendation: 'يرجى تسجيل الدخول مرة أخرى'
        });
        return;
      }

      const now = Date.now() / 1000;
      const expiresAt = session.expires_at || 0;
      const timeRemaining = Math.max(0, expiresAt - now);
      const minutesRemaining = Math.floor(timeRemaining / 60);

      let status: 'success' | 'warning' | 'error' = 'success';
      let recommendation: string | undefined;

      if (timeRemaining <= 0) {
        status = 'error';
        recommendation = 'انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى';
      } else if (timeRemaining < 300) { // أقل من 5 دقائق
        status = 'warning';
        recommendation = 'الجلسة ستنتهي قريباً - سيتم التحديث التلقائي';
      }

      updateDiagnostic(diag, 'session', {
        status,
        result: {
          valid: sessionValid,
          expiresAt: new Date(expiresAt * 1000).toLocaleString('ar-KW'),
          minutesRemaining,
          accessToken: session.access_token ? 'موجود' : 'مفقود',
          refreshToken: session.refresh_token ? 'موجود' : 'مفقود'
        },
        recommendation
      });
    } catch (error: any) {
      updateDiagnostic(diag, 'session', {
        status: 'error',
        error: error.message,
        recommendation: 'تحقق من صلاحية الجلسة'
      });
    }
  };

  const testTenant = async (diag: ComprehensiveDiagnostics) => {
    updateDiagnostic(diag, 'tenant', { status: 'running' });
    
    try {
      if (!currentTenant) {
        updateDiagnostic(diag, 'tenant', {
          status: 'error',
          error: 'No tenant associated with user',
          recommendation: 'تواصل مع مدير النظام لربط المستخدم بمؤسسة'
        });
        return;
      }

      let status: 'success' | 'warning' = 'success';
      let recommendation: string | undefined;

      if (currentTenant.status !== 'active') {
        status = 'warning';
        recommendation = `حالة المؤسسة: ${currentTenant.status} - قد تحتاج لتفعيل`;
      }

      updateDiagnostic(diag, 'tenant', {
        status,
        result: {
          tenantId: currentTenant.id,
          tenantName: currentTenant.name,
          tenantStatus: currentTenant.status,
          userRole: currentUserRole,
          subscriptionPlan: currentTenant.subscription_plan,
          subscriptionStatus: currentTenant.subscription_status
        },
        recommendation
      });
    } catch (error: any) {
      updateDiagnostic(diag, 'tenant', {
        status: 'error',
        error: error.message,
        recommendation: 'تحقق من ربط المؤسسة بالمستخدم'
      });
    }
  };

  const testDatabase = async (diag: ComprehensiveDiagnostics) => {
    updateDiagnostic(diag, 'database', { status: 'running' });
    
    try {
      // اختبار اتصال أساسي
      const { data, error } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);

      if (error) throw error;

      updateDiagnostic(diag, 'database', {
        status: 'success',
        result: {
          connected: true,
          responseTime: 'جيد',
          tablesAccessible: true
        }
      });
    } catch (error: any) {
      updateDiagnostic(diag, 'database', {
        status: 'error',
        error: error.message,
        recommendation: 'تحقق من اتصال الإنترنت أو حالة قاعدة البيانات'
      });
    }
  };

  const testPermissions = async (diag: ComprehensiveDiagnostics) => {
    updateDiagnostic(diag, 'permissions', { status: 'running' });
    
    try {
      const tests = {
        canReadCustomers: false,
        canReadTenants: false,
        canAccessUserContext: false
      };

      // اختبار قراءة العملاء
      try {
        const { error: customersError } = await supabase
          .from('customers')
          .select('id')
          .limit(1);
        tests.canReadCustomers = !customersError;
      } catch (e) {
        tests.canReadCustomers = false;
      }

      // اختبار قراءة المؤسسات
      try {
        const { error: tenantsError } = await supabase
          .from('tenants')
          .select('id')
          .limit(1);
        tests.canReadTenants = !tenantsError;
      } catch (e) {
        tests.canReadTenants = false;
      }

      // اختبار دالة السياق
      try {
        const { error: contextError } = await supabase
          .rpc('get_user_tenant_context');
        tests.canAccessUserContext = !contextError;
      } catch (e) {
        tests.canAccessUserContext = false;
      }

      const hasIssues = !tests.canReadCustomers;
      
      updateDiagnostic(diag, 'permissions', {
        status: hasIssues ? 'warning' : 'success',
        result: tests,
        recommendation: hasIssues ? 'بعض الصلاحيات مفقودة - تواصل مع المدير' : undefined
      });
    } catch (error: any) {
      updateDiagnostic(diag, 'permissions', {
        status: 'error',
        error: error.message,
        recommendation: 'فشل في فحص الصلاحيات'
      });
    }
  };

  const testFunctions = async (diag: ComprehensiveDiagnostics) => {
    updateDiagnostic(diag, 'functions', { status: 'running' });
    
    try {
      const tests = {
        userTenantContext: false,
        currentTenantId: false,
        diagnosticFunction: false
      };

      // اختبار get_user_tenant_context
      try {
        const { error: contextError } = await supabase
          .rpc('get_user_tenant_context');
        tests.userTenantContext = !contextError;
      } catch (e) {
        tests.userTenantContext = false;
      }

      // اختبار get_current_tenant_id
      try {
        const { error: tenantIdError } = await supabase
          .rpc('get_current_tenant_id');
        tests.currentTenantId = !tenantIdError;
      } catch (e) {
        tests.currentTenantId = false;
      }

      // اختبار diagnose_user_tenant_issues
      try {
        const { error: diagError } = await supabase
          .rpc('diagnose_user_tenant_issues');
        tests.diagnosticFunction = !diagError;
      } catch (e) {
        tests.diagnosticFunction = false;
      }

      const hasIssues = !tests.userTenantContext || !tests.currentTenantId;
      
      updateDiagnostic(diag, 'functions', {
        status: hasIssues ? 'error' : 'success',
        result: tests,
        recommendation: hasIssues ? 'بعض دوال قاعدة البيانات لا تعمل بشكل صحيح' : undefined
      });
    } catch (error: any) {
      updateDiagnostic(diag, 'functions', {
        status: 'error',
        error: error.message,
        recommendation: 'فشل في فحص دوال قاعدة البيانات'
      });
    }
  };

  const runComprehensiveDiagnostics = useCallback(async () => {
    setLoading(true);
    const diag = initializeDiagnostics();
    setDiagnostics(diag);

    try {
      // تشغيل الاختبارات بالتتابع مع تحديث الحالة
      await testAuthentication(diag);
      await testSession(diag);
      await testTenant(diag);
      await testDatabase(diag);
      await testPermissions(diag);
      await testFunctions(diag);

      console.log('🔍 تم إكمال التشخيص الشامل');
    } catch (error) {
      console.error('❌ خطأ في التشخيص الشامل:', error);
    } finally {
      setLoading(false);
    }
  }, [user, session, currentTenant, currentUserRole, sessionValid]);

  const getOverallStatus = (): 'success' | 'warning' | 'error' => {
    if (!diagnostics) return 'warning';
    
    const statuses = Object.values(diagnostics).map(d => d.status);
    
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('warning')) return 'warning';
    return 'success';
  };

  const getRecommendations = (): string[] => {
    if (!diagnostics) return [];
    
    return Object.values(diagnostics)
      .filter(d => d.recommendation)
      .map(d => d.recommendation!);
  };

  return {
    diagnostics,
    loading,
    runComprehensiveDiagnostics,
    getOverallStatus,
    getRecommendations
  };
};