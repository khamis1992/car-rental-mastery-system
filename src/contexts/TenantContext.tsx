
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant, TenantUser } from '@/types/tenant';
import { TenantService } from '@/services/tenantService';
import { tenantIsolationService } from '@/services/BusinessServices/TenantIsolationService';
import { tenantIsolationMiddleware } from '@/middleware/TenantIsolationMiddleware';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TenantContextType {
  currentTenant: Tenant | null;
  currentUserRole: TenantUser['role'] | null;
  tenantService: TenantService;
  loading: boolean;
  error: string | null;
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenant: () => Promise<void>;
  isWithinLimits: (resource: 'users' | 'vehicles' | 'contracts') => boolean;
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
  const { user, session, isSaasAdmin } = useAuth();
  const tenantService = new TenantService();

  // دالة للتحقق من صلاحية المؤسسة
  const isOrganizationValid = (tenant: Tenant): { valid: boolean; reason?: string } => {
    if (tenant.status === 'active') {
      return { valid: true };
    }
    
    if (tenant.status === 'trial') {
      // التحقق من انتهاء الفترة التجريبية
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
  };

  const loadTenant = async () => {
    if (!user || !session) {
      setCurrentTenant(null);
      setCurrentUserRole(null);
      setLoading(false);
      setError(null);
      return;
    }

    // معالجة خاصة لمدير النظام العام (admin@admin.com أو isSaasAdmin)
    if (isSaasAdmin || user.email === 'admin@admin.com') {
      console.log('🔧 SaaS Admin detected - setting super_admin role without tenant');
      setCurrentTenant(null);
      setCurrentUserRole('super_admin');
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 بدء تحميل بيانات المؤسسة للمستخدم:', user.email);

      // Get current tenant and user role with timeout protection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('انتهت مهلة الاتصال')), 10000);
      });

      const queryPromise = supabase
        .from('tenant_users')
        .select(`
          tenant_id,
          role,
          status,
          tenant:tenants(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      const { data: tenantUser, error: tenantUserError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as any;

      if (tenantUserError) {
        if (tenantUserError.code === 'PGRST116') {
          console.warn('⚠️ لم يتم العثور على مؤسسة للمستخدم:', user.email);
          // بدلاً من إظهار خطأ، نعطي المستخدم دور مستخدم عادي بدون مؤسسة
          setCurrentTenant(null);
          setCurrentUserRole('user');
          setError(null);
          setLoading(false);
          tenantIsolationMiddleware.reset();
          return;
        } else {
          console.error('❌ خطأ في البحث عن المؤسسة:', tenantUserError);
          throw tenantUserError;
        }
      }

      if (tenantUser && tenantUser.tenant) {
        const tenant = tenantUser.tenant as Tenant;
        console.log('✅ تم العثور على المؤسسة:', tenant.name);
        
        // التحقق من صلاحية المؤسسة (نشطة أو تجريبية صالحة)
        const isValidTenant = isOrganizationValid(tenant);
        if (!isValidTenant.valid) {
          console.warn('⚠️ المؤسسة غير صالحة:', isValidTenant.reason);
          setError(isValidTenant.reason);
          setCurrentTenant(null);
          setCurrentUserRole(null);
          tenantIsolationMiddleware.reset();
          return;
        }
        
        setCurrentTenant(tenant);
        setCurrentUserRole(tenantUser.role as TenantUser['role']);
        
        // تفعيل middleware العزل للمؤسسة
        await tenantIsolationMiddleware.setCurrentTenant(tenant.id);
        console.log('✅ تم تحميل بيانات المؤسسة بنجاح');
      } else {
        // User is not associated with any tenant but not an error for regular users
        console.warn('⚠️ المستخدم غير مرتبط بأي مؤسسة:', user.email);
        setCurrentTenant(null);
        setCurrentUserRole('user');
        setError(null);
        tenantIsolationMiddleware.reset();
      }
    } catch (err: any) {
      console.error('Error loading tenant:', err);
      // معالجة محسنة للأخطاء
      let errorMessage = 'فشل في تحميل بيانات المؤسسة';
      
      if (err.message === 'انتهت مهلة الاتصال') {
        errorMessage = 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'مشكلة في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.';
      }
      
      setError(errorMessage);
      setCurrentTenant(null);
      setCurrentUserRole(null);
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
          tenant:tenants(*)
        `)
        .eq('user_id', user?.id)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .single();

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
        console.warn('فشل في تسجيل محاولة تبديل المؤسسة:', logError);
      }

      if (error) throw error;

      if (tenantUser && tenantUser.tenant) {
        const tenant = tenantUser.tenant as Tenant;
        setCurrentTenant(tenant);
        setCurrentUserRole(tenantUser.role as TenantUser['role']);
        
        // تفعيل middleware العزل للمؤسسة الجديدة
        await tenantIsolationMiddleware.setCurrentTenant(tenant.id);
        
        // Store selected tenant in localStorage for persistence
        localStorage.setItem('selectedTenantId', tenantId);
      }
    } catch (err: any) {
      console.error('Error switching tenant:', err);
      setError(err.message || 'فشل في تبديل المؤسسة');
    } finally {
      setLoading(false);
    }
  };

  const refreshTenant = async () => {
    await loadTenant();
  };

  const isWithinLimits = (resource: 'users' | 'vehicles' | 'contracts'): boolean => {
    if (!currentTenant) return false;
    
    // For now, we'll do a simple check. In a real app, you'd want to
    // cache the current counts and check against limits
    return true; // TODO: Implement proper limit checking
  };

  useEffect(() => {
    loadTenant();
  }, [user, session, isSaasAdmin]);

  const value: TenantContextType = {
    currentTenant,
    currentUserRole,
    tenantService,
    loading,
    error,
    switchTenant,
    refreshTenant,
    isWithinLimits,
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
