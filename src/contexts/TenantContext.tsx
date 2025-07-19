
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
  const { user, session } = useAuth();
  const tenantService = new TenantService();

  // دالة للتحقق من صلاحية المؤسسة
  const isOrganizationValid = (tenant: Tenant): { valid: boolean; reason?: string } => {
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
  };

  const loadTenant = async () => {
    if (!user || !session) {
      console.log('🔍 لا يوجد مستخدم مسجل - إعادة تعيين البيانات');
      setCurrentTenant(null);
      setCurrentUserRole(null);
      setLoading(false);
      tenantIsolationMiddleware.reset();
      return;
    }

    // منع admin@admin.com من تحميل بيانات المؤسسات
    if (user.email === 'admin@admin.com') {
      console.log('🔧 SaaS Admin detected - tenant data loading skipped');
      setCurrentTenant(null);
      setCurrentUserRole('super_admin');
      setLoading(false);
      tenantIsolationMiddleware.reset();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 بدء تحميل بيانات المؤسسة للمستخدم:', user.email);

      // الحصول على بيانات المؤسسة والدور
      const { data: tenantUser, error: tenantUserError } = await supabase
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

      if (tenantUserError) {
        if (tenantUserError.code === 'PGRST116') {
          console.warn('⚠️ لم يتم العثور على مؤسسة للمستخدم');
          setError('لم يتم العثور على مؤسسة مرتبطة بهذا المستخدم');
          setCurrentTenant(null);
          setCurrentUserRole(null);
          tenantIsolationMiddleware.reset();
          return;
        } else {
          console.error('❌ خطأ في البحث عن المؤسسة:', tenantUserError);
          throw tenantUserError;
        }
      }

      if (tenantUser && tenantUser.tenant) {
        const tenant = tenantUser.tenant as Tenant;
        console.log('✅ تم العثور على المؤسسة:', tenant.name, '- ID:', tenant.id);
        
        // التحقق من صلاحية المؤسسة
        const isValidTenant = isOrganizationValid(tenant);
        if (!isValidTenant.valid) {
          console.warn('⚠️ المؤسسة غير صالحة:', isValidTenant.reason);
          setError(isValidTenant.reason);
          setCurrentTenant(null);
          setCurrentUserRole(null);
          tenantIsolationMiddleware.reset();
          return;
        }
        
        // تحديث حالة المؤسسة
        setCurrentTenant(tenant);
        setCurrentUserRole(tenantUser.role as TenantUser['role']);
        
        // تفعيل middleware العزل للمؤسسة
        await tenantIsolationMiddleware.setCurrentTenant(tenant.id);
        console.log('✅ تم تحميل بيانات المؤسسة بنجاح - المؤسسة الحالية:', tenant.name);
        
        // تنظيف أي أخطاء سابقة
        setError(null);
      } else {
        console.warn('⚠️ المستخدم غير مرتبط بأي مؤسسة');
        setCurrentTenant(null);
        setCurrentUserRole(null);
        setError('المستخدم غير مرتبط بأي مؤسسة نشطة');
        tenantIsolationMiddleware.reset();
      }
    } catch (err: any) {
      console.error('❌ خطأ في تحميل بيانات المؤسسة:', err);
      setError(err.message || 'فشل في تحميل بيانات المؤسسة');
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
          tenant:tenants(*)
        `)
        .eq('user_id', user?.id)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .single();

      const success = !error && !!tenantUser && !!tenantUser.tenant;

      // تسجيل محاولة تبديل المؤسسة للمراقبة
      await tenantIsolationService.logAccess(
        tenantId,
        'tenant_switch',
        'switch_tenant',
        success
      );

      if (error) throw error;

      if (tenantUser && tenantUser.tenant) {
        const tenant = tenantUser.tenant as Tenant;
        setCurrentTenant(tenant);
        setCurrentUserRole(tenantUser.role as TenantUser['role']);
        
        // تفعيل middleware العزل للمؤسسة الجديدة
        await tenantIsolationMiddleware.setCurrentTenant(tenant.id);
        
        // Store selected tenant in localStorage for persistence
        localStorage.setItem('selectedTenantId', tenantId);
        
        console.log('✅ تم تبديل المؤسسة بنجاح إلى:', tenant.name);
      }
    } catch (err: any) {
      console.error('❌ خطأ في تبديل المؤسسة:', err);
      setError(err.message || 'فشل في تبديل المؤسسة');
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
    return true; // TODO: Implement proper limit checking
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
