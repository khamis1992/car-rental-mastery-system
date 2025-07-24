
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant, TenantUser } from '@/types/tenant';
import { TenantService } from '@/services/tenantService';
import { tenantIsolationService } from '@/services/BusinessServices/TenantIsolationService';
import { tenantIsolationMiddleware } from '@/middleware/TenantIsolationMiddleware';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { handleError } from '@/utils/errorHandling';

interface TenantContextType {
  currentTenant: Tenant | null;
  currentUserRole: TenantUser['role'] | null;
  tenantService: TenantService;
  loading: boolean;
  error: string | null;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
  isWithinLimits: (resource: 'users' | 'vehicles' | 'contracts') => boolean;
  debugInfo: any;
  clearError: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<TenantUser['role'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { user, session } = useAuth();
  const tenantService = new TenantService();

  // دالة لتنظيف الأخطاء
  const clearError = () => {
    setError(null);
  };

  // دالة محسنة للتحقق من صلاحية المؤسسة
  const isOrganizationValid = (tenant: Tenant): { valid: boolean; reason?: string } => {
    try {
      if (!tenant) {
        return { valid: false, reason: 'بيانات المؤسسة غير موجودة' };
      }

      if (tenant.status === 'active') {
        return { valid: true };
      }
      
      if (tenant.status === 'trial') {
        if (tenant.trial_ends_at) {
          const trialEndDate = new Date(tenant.trial_ends_at);
          const now = new Date();
          
          if (now > trialEndDate) {
            return { 
              valid: false, 
              reason: 'انتهت الفترة التجريبية لهذه المؤسسة. يرجى تجديد الاشتراك.' 
            };
          }
        }
        return { valid: true };
      }
      
      if (tenant.status === 'suspended') {
        return { 
          valid: false, 
          reason: 'تم تعليق هذه المؤسسة. يرجى التواصل مع الدعم الفني.' 
        };
      }
      
      if (tenant.status === 'cancelled') {
        return { 
          valid: false, 
          reason: 'تم إلغاء هذه المؤسسة. يرجى التواصل مع مدير النظام.' 
        };
      }
      
      return { 
        valid: false, 
        reason: `حالة المؤسسة غير صحيحة: ${tenant.status}` 
      };
    } catch (err) {
      console.error('❌ خطأ في فحص صلاحية المؤسسة:', err);
      return { valid: false, reason: 'خطأ في فحص صلاحية المؤسسة' };
    }
  };

  // دالة محسنة للحصول على معلومات التشخيص
  const getDebugInfo = async () => {
    try {
      const { data: debugData, error: debugError } = await supabase.rpc('debug_user_tenant_status');
      
      if (debugError) {
        console.warn('⚠️ تعذر الحصول على معلومات التشخيص:', debugError);
        return null;
      }

      return debugData;
    } catch (error) {
      console.warn('⚠️ خطأ في الحصول على معلومات التشخيص:', error);
      return null;
    }
  };

  const loadTenant = async () => {
    if (!user || !session) {
      console.log('🔍 لا يوجد مستخدم مسجل - إعادة تعيين البيانات');
      setCurrentTenant(null);
      setCurrentUserRole(null);
      setLoading(false);
      setError(null);
      setDebugInfo(null);
      tenantIsolationMiddleware.reset();
      return;
    }

    // منع admin@admin.com من تحميل بيانات المؤسسات
    if (user.email === 'admin@admin.com') {
      console.log('🔧 SaaS Admin detected - tenant data loading skipped');
      setCurrentTenant(null);
      setCurrentUserRole('super_admin');
      setLoading(false);
      setError(null);
      setDebugInfo({ userType: 'super_admin', skipTenantLoad: true });
      tenantIsolationMiddleware.reset();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 بدء تحميل بيانات المؤسسة للمستخدم:', user.email);

      // الحصول على معلومات التشخيص
      const debug = await getDebugInfo();
      setDebugInfo(debug);

      // التحقق من اتصال قاعدة البيانات
      const { error: connectionError } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);

      if (connectionError) {
        throw new Error(`خطأ في الاتصال بقاعدة البيانات: ${connectionError.message}`);
      }

      // الحصول على بيانات المؤسسة والدور مع validation محسن
      const { data: tenantUser, error: tenantUserError } = await supabase
        .from('tenant_users')
        .select(`
          tenant_id,
          role,
          status,
          tenant:tenants!inner(
            id,
            name,
            slug,
            status,
            subscription_plan,
            subscription_status,
            trial_ends_at,
            max_users,
            max_vehicles,
            max_contracts,
            contact_email,
            contact_phone,
            city,
            country,
            timezone,
            currency,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (tenantUserError) {
        console.error('❌ خطأ في البحث عن المؤسسة:', tenantUserError);
        const errorResult = handleError(tenantUserError, 'loadTenant');
        if (errorResult.shouldLog) {
          throw new Error(`فشل في البحث عن المؤسسة: ${tenantUserError.message}`);
        }
        return;
      }

      if (!tenantUser || !tenantUser.tenant) {
        console.warn('⚠️ لم يتم العثور على مؤسسة للمستخدم');
        setError('لم يتم العثور على مؤسسة مرتبطة بهذا المستخدم. يرجى التواصل مع مدير النظام.');
        setCurrentTenant(null);
        setCurrentUserRole(null);
        tenantIsolationMiddleware.reset();
        return;
      }

      const tenant = tenantUser.tenant as Tenant;
      console.log('✅ تم العثور على المؤسسة:', tenant.name, '- ID:', tenant.id);
      
      // التحقق من صلاحية المؤسسة
      const isValidTenant = isOrganizationValid(tenant);
      if (!isValidTenant.valid) {
        console.warn('⚠️ المؤسسة غير صالحة:', isValidTenant.reason);
        setError(isValidTenant.reason || 'المؤسسة غير صالحة');
        setCurrentTenant(null);
        setCurrentUserRole(null);
        tenantIsolationMiddleware.reset();
        return;
      }
      
      // تحديث حالة المؤسسة
      setCurrentTenant(tenant);
      setCurrentUserRole(tenantUser.role as TenantUser['role']);
      
      // تفعيل middleware العزل للمؤسسة
      try {
        await tenantIsolationMiddleware.setCurrentTenant(tenant.id);
        console.log('✅ تم تحميل بيانات المؤسسة بنجاح - المؤسسة الحالية:', tenant.name);
      } catch (middlewareError) {
        console.warn('⚠️ تحذير: خطأ في تفعيل middleware العزل:', middlewareError);
        // نتجاهل خطأ middleware ونكمل
      }
      
      // تنظيف أي أخطاء سابقة
      setError(null);
      
    } catch (err: any) {
      console.error('❌ خطأ في تحميل بيانات المؤسسة:', err);
      const errorResult = handleError(err, 'loadTenant');
      
      if (errorResult.shouldLog) {
        setError(errorResult.message || err.message || 'فشل في تحميل بيانات المؤسسة');
      }
      
      setCurrentTenant(null);
      setCurrentUserRole(null);
      tenantIsolationMiddleware.reset();
    } finally {
      setLoading(false);
    }
  };

  const switchTenant = async (tenantId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Check if user has access to this tenant
      const { data: tenantUser, error } = await supabase
        .from('tenant_users')
        .select(`
          role,
          tenant:tenants!inner(
            id,
            name,
            slug,
            status,
            subscription_plan,
            subscription_status,
            trial_ends_at,
            max_users,
            max_vehicles,
            max_contracts,
            contact_email,
            contact_phone,
            city,
            country,
            timezone,
            currency,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user?.id)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .maybeSingle();

      const success = !error && !!tenantUser && !!tenantUser.tenant;

      // تسجيل محاولة تبديل المؤسسة للمراقبة
      try {
        await tenantIsolationService.logAccess(
          tenantId,
          'tenant_switch',
          'switch_tenant',
          success
        );
      } catch (logError) {
        console.warn('⚠️ تعذر تسجيل محاولة تبديل المؤسسة:', logError);
      }

      if (error) throw error;

      if (tenantUser && tenantUser.tenant) {
        const tenant = tenantUser.tenant as Tenant;
        
        // التحقق من صلاحية المؤسسة الجديدة
        const isValidTenant = isOrganizationValid(tenant);
        if (!isValidTenant.valid) {
          setError(isValidTenant.reason || 'المؤسسة غير صالحة');
          return;
        }
        
        setCurrentTenant(tenant);
        setCurrentUserRole(tenantUser.role as TenantUser['role']);
        
        // تفعيل middleware العزل للمؤسسة الجديدة
        try {
          await tenantIsolationMiddleware.setCurrentTenant(tenant.id);
        } catch (middlewareError) {
          console.warn('⚠️ تحذير: خطأ في تفعيل middleware العزل:', middlewareError);
        }
        
        // Store selected tenant in localStorage for persistence
        localStorage.setItem('selectedTenantId', tenantId);
        
        console.log('✅ تم تبديل المؤسسة بنجاح إلى:', tenant.name);
      }
    } catch (err: any) {
      console.error('❌ خطأ في تبديل المؤسسة:', err);
      const errorResult = handleError(err, 'switchTenant');
      setError(errorResult.message || err.message || 'فشل في تبديل المؤسسة');
    } finally {
      setLoading(false);
    }
  };

  const refreshTenant = async () => {
    console.log('🔄 إعادة تحميل بيانات المؤسسة...');
    await loadTenant();
  };

  const isWithinLimits = (resource: 'users' | 'vehicles' | 'contracts'): boolean => {
    if (!currentTenant) return false;
    
    try {
      // Simple implementation - in production, check against tenant subscription limits
      const limits = {
        users: currentTenant.max_users || 50,
        vehicles: currentTenant.max_vehicles || 100,
        contracts: currentTenant.max_contracts || 200
      };
      
      // For now, return true as we don't have current counts
      // In production, you would check actual counts against limits
      return true;
    } catch (error) {
      console.warn('⚠️ خطأ في فحص الحدود:', error);
      return false;
    }
  };

  useEffect(() => {
    console.log('🔄 تغيير في حالة المصادقة - إعادة تحميل بيانات المؤسسة');
    loadTenant();
  }, [user, session]);

  const value: TenantContextType = {
    currentTenant,
    currentUserRole,
    tenantService,
    loading,
    error,
    switchTenant,
    refreshTenant,
    isWithinLimits,
    debugInfo,
    clearError,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
