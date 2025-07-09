import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant, TenantUser } from '@/types/tenant';
import { TenantService } from '@/services/tenantService';
import { useAuth } from './AuthContext';

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

  const loadTenant = async () => {
    if (!user || !session) {
      setCurrentTenant(null);
      setCurrentUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get current tenant and user role
      const { data: tenantUser, error: tenantUserError } = await supabase
        .from('tenant_users')
        .select(`
          role,
          status,
          tenant:tenants(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (tenantUserError && tenantUserError.code !== 'PGRST116') {
        throw tenantUserError;
      }

      if (tenantUser && tenantUser.tenant) {
        setCurrentTenant(tenantUser.tenant as Tenant);
        setCurrentUserRole(tenantUser.role);
      } else {
        // User is not associated with any tenant
        setCurrentTenant(null);
        setCurrentUserRole(null);
      }
    } catch (err: any) {
      console.error('Error loading tenant:', err);
      setError(err.message || 'فشل في تحميل بيانات المؤسسة');
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

      if (error) throw error;

      if (tenantUser && tenantUser.tenant) {
        setCurrentTenant(tenantUser.tenant as Tenant);
        setCurrentUserRole(tenantUser.role);
        
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

// Import supabase here to avoid circular dependency
import { supabase } from '@/integrations/supabase/client';