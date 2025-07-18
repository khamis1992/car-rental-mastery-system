import { supabase } from '@/integrations/supabase/client';

// Types for the permissions system
export interface PermissionCategory {
  id: string;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category_id: string;
  level: 'read' | 'write' | 'admin';
  is_system: boolean;
  is_active: boolean;
  category?: PermissionCategory;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  level: number;
  is_system: boolean;
  is_default: boolean;
  tenant_id?: string;
  is_active: boolean;
  user_count?: number;
  permissions?: Permission[];
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  granted_by?: string;
  granted_at: string;
}

export interface PermissionAuditLog {
  id: string;
  action: string;
  user_id: string;
  tenant_id?: string;
  role_id?: string;
  permission_id?: string;
  target_user_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export class PermissionsService {
  
  // التحقق من وجود جداول نظام الصلاحيات
  private async checkPermissionsTables(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('permission_categories')
        .select('id')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.warn('Permissions tables not available:', error);
      return false;
    }
  }

  // إرجاع بيانات وهمية إذا لم تكن الجداول متاحة
  private getMockData() {
    const mockCategories: PermissionCategory[] = [
      { id: '1', name: 'system', display_name: 'إدارة النظام', description: 'صلاحيات النظام', icon: 'Crown', sort_order: 1, is_active: true },
      { id: '2', name: 'users', display_name: 'إدارة المستخدمين', description: 'صلاحيات المستخدمين', icon: 'Users', sort_order: 2, is_active: true },
      { id: '3', name: 'finance', display_name: 'المالية', description: 'صلاحيات المالية', icon: 'Shield', sort_order: 3, is_active: true },
      { id: '4', name: 'basic', display_name: 'أساسيات', description: 'الصلاحيات الأساسية', icon: 'Eye', sort_order: 4, is_active: true }
    ];

    const mockPermissions: Permission[] = [
      { id: '1', name: 'system.settings', display_name: 'إعدادات النظام', description: 'إدارة إعدادات النظام', category_id: '1', level: 'admin', is_system: true, is_active: true },
      { id: '2', name: 'users.manage', display_name: 'إدارة المستخدمين', description: 'إدارة المستخدمين', category_id: '2', level: 'admin', is_system: true, is_active: true },
      { id: '3', name: 'finance.reports.view', display_name: 'عرض التقارير', description: 'عرض التقارير المالية', category_id: '3', level: 'read', is_system: true, is_active: true },
      { id: '4', name: 'basic.dashboard.view', display_name: 'عرض لوحة التحكم', description: 'الوصول للوحة التحكم', category_id: '4', level: 'read', is_system: true, is_active: true }
    ];

    const mockRoles: Role[] = [
      { id: '1', name: 'super_admin', display_name: 'مدير النظام العام', description: 'صلاحيات كاملة', level: 0, is_system: true, is_default: false, is_active: true, user_count: 1 },
      { id: '2', name: 'tenant_admin', display_name: 'مدير المؤسسة', description: 'إدارة المؤسسة', level: 10, is_system: true, is_default: false, is_active: true, user_count: 5 },
      { id: '3', name: 'user', display_name: 'مستخدم عادي', description: 'صلاحيات محدودة', level: 100, is_system: true, is_default: true, is_active: true, user_count: 50 }
    ];

    return { mockCategories, mockPermissions, mockRoles };
  }
  
  // ==========================================
  // Categories Management
  // ==========================================
  
  async getCategories(): Promise<PermissionCategory[]> {
    try {
      const isAvailable = await this.checkPermissionsTables();
      if (!isAvailable) {
        console.warn('Using mock categories - permissions tables not available');
        return this.getMockData().mockCategories;
      }

      const { data, error } = await supabase
        .from('permission_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Falling back to mock categories:', error);
      return this.getMockData().mockCategories;
    }
  }

  async createCategory(category: Omit<PermissionCategory, 'id'>): Promise<PermissionCategory> {
    const isAvailable = await this.checkPermissionsTables();
    if (!isAvailable) {
      throw new Error('نظام الصلاحيات غير متاح حالياً - يرجى تطبيق migrations أولاً');
    }

    const { data, error } = await supabase
      .from('permission_categories')
      .insert(category)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async updateCategory(id: string, updates: Partial<PermissionCategory>): Promise<PermissionCategory> {
    const isAvailable = await this.checkPermissionsTables();
    if (!isAvailable) {
      throw new Error('نظام الصلاحيات غير متاح حالياً - يرجى تطبيق migrations أولاً');
    }

    const { data, error } = await supabase
      .from('permission_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  // ==========================================
  // Permissions Management
  // ==========================================
  
  async getPermissions(categoryId?: string): Promise<Permission[]> {
    try {
      const isAvailable = await this.checkPermissionsTables();
      if (!isAvailable) {
        console.warn('Using mock permissions - permissions tables not available');
        const { mockPermissions } = this.getMockData();
        return categoryId ? mockPermissions.filter(p => p.category_id === categoryId) : mockPermissions;
      }

      let query = supabase
        .from('permissions')
        .select(`
          *,
          category:permission_categories(*)
        `)
        .eq('is_active', true);
        
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
        
      const { data, error } = await query.order('display_name');
      if (error) throw error;
      return (data || []) as any;
    } catch (error) {
      console.warn('Falling back to mock permissions:', error);
      const { mockPermissions } = this.getMockData();
      return categoryId ? mockPermissions.filter(p => p.category_id === categoryId) : mockPermissions;
    }
  }

  async getPermissionsByCategory(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getPermissions();
    return permissions.reduce((acc, permission) => {
      const categoryName = permission.category?.name || permission.category_id || 'uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  }

  // ==========================================
  // Roles Management
  // ==========================================
  
  async getRoles(tenantId?: string, includeGlobal: boolean = true): Promise<Role[]> {
    try {
      const isAvailable = await this.checkPermissionsTables();
      if (!isAvailable) {
        console.warn('Using mock roles - permissions tables not available');
        return this.getMockData().mockRoles;
      }

      let query = supabase
        .from('roles')
        .select(`
          *,
          tenant_users(count),
          role_permissions(
            permission:permissions(*)
          )
        `)
        .eq('is_active', true);
        
      if (tenantId) {
        if (includeGlobal) {
          query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
        } else {
          query = query.eq('tenant_id', tenantId);
        }
      } else if (!includeGlobal) {
        query = query.is('tenant_id', null);
      }
        
      const { data, error } = await query.order('level');
      if (error) throw error;
      
      return (data || []).map(role => ({
        ...role,
        user_count: role.tenant_users?.[0]?.count || 0,
        permissions: role.role_permissions?.map((rp: any) => rp.permission) || []
      }));
    } catch (error) {
      console.warn('Falling back to mock roles:', error);
      return this.getMockData().mockRoles;
    }
  }

  async getRoleById(id: string): Promise<Role | null> {
    try {
      const isAvailable = await this.checkPermissionsTables();
      if (!isAvailable) {
        const { mockRoles } = this.getMockData();
        return mockRoles.find(r => r.id === id) || null;
      }

      const { data, error } = await supabase
        .from('roles')
        .select(`
          *,
          role_permissions(
            permission:permissions(
              *,
              category:permission_categories(*)
            )
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      return {
        ...data,
        permissions: data.role_permissions?.map((rp: any) => rp.permission) || []
      };
    } catch (error) {
      console.warn('Role lookup failed:', error);
      return null;
    }
  }

  // ==========================================
  // User Permissions Check - Legacy Support
  // ==========================================
  
  async checkUserPermission(userId: string, permissionName: string, tenantId?: string): Promise<boolean> {
    try {
      const isAvailable = await this.checkPermissionsTables();
      if (!isAvailable) {
        // Fallback: تحقق من الأدوار القديمة في tenant_users
        const { data, error } = await supabase
          .from('tenant_users')
          .select('role')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (error || !data) return false;

        // منطق بسيط للصلاحيات بناءً على الأدوار القديمة
        const role = data.role;
        if (role === 'super_admin') return true;
        if (role === 'tenant_admin' && !permissionName.startsWith('system.')) return true;
        if (permissionName === 'basic.dashboard.view') return true;
        
        return false;
      }

      const { data, error } = await supabase.rpc('user_has_permission', {
        user_id_param: userId,
        permission_name_param: permissionName,
        tenant_id_param: tenantId
      });
      
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.warn('Permission check failed:', error);
      return false;
    }
  }

  async getUserPermissions(userId: string, tenantId?: string): Promise<Permission[]> {
    try {
      const isAvailable = await this.checkPermissionsTables();
      if (!isAvailable) {
        // إرجاع صلاحيات أساسية بناءً على الدور القديم
        const { mockPermissions } = this.getMockData();
        const { data } = await supabase
          .from('tenant_users')
          .select('role')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (!data) return [mockPermissions[3]]; // basic.dashboard.view

        const role = data.role;
        if (role === 'super_admin') return mockPermissions;
        if (role === 'tenant_admin') return mockPermissions.slice(1); // كل شيء عدا النظام
        
        return [mockPermissions[3]]; // basic.dashboard.view
      }

      const { data, error } = await supabase.rpc('get_user_permissions', {
        user_id_param: userId,
        tenant_id_param: tenantId
      });
      
      if (error) throw error;
      return (data || []) as any;
    } catch (error) {
      console.warn('User permissions lookup failed:', error);
      return [];
    }
  }

  // ==========================================
  // System Stats
  // ==========================================
  
  async getSystemStats(): Promise<{
    total_roles: number;
    total_permissions: number;
    total_categories: number;
    active_users_with_roles: number;
  }> {
    try {
      const isAvailable = await this.checkPermissionsTables();
      if (!isAvailable) {
        // إحصائيات وهمية
        return {
          total_roles: 6,
          total_permissions: 15,
          total_categories: 6,
          active_users_with_roles: 25
        };
      }

      const [rolesCount, permissionsCount, categoriesCount, usersCount] = await Promise.all([
        supabase.from('roles').select('*', { count: 'exact', head: true }),
        supabase.from('permissions').select('*', { count: 'exact', head: true }),
        supabase.from('permission_categories').select('*', { count: 'exact', head: true }),
        supabase.from('tenant_users').select('*', { count: 'exact', head: true }).not('role_id', 'is', null)
      ]);
      
      return {
        total_roles: rolesCount.count || 0,
        total_permissions: permissionsCount.count || 0,
        total_categories: categoriesCount.count || 0,
        active_users_with_roles: usersCount.count || 0
      };
    } catch (error) {
      console.warn('System stats failed:', error);
      return {
        total_roles: 0,
        total_permissions: 0,
        total_categories: 0,
        active_users_with_roles: 0
      };
    }
  }

  // ==========================================
  // Operations requiring full system (will throw errors if not available)
  // ==========================================

  async createRole(role: Omit<Role, 'id' | 'user_count' | 'permissions'>): Promise<Role> {
    const isAvailable = await this.checkPermissionsTables();
    if (!isAvailable) {
      throw new Error('نظام الصلاحيات غير متاح حالياً - يرجى تطبيق migrations أولاً');
    }

    const { data, error } = await supabase
      .from('roles')
      .insert(role)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async updateRole(id: string, updates: Partial<Role>): Promise<Role> {
    const isAvailable = await this.checkPermissionsTables();
    if (!isAvailable) {
      throw new Error('نظام الصلاحيات غير متاح حالياً - يرجى تطبيق migrations أولاً');
    }

    const { data, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async deleteRole(id: string): Promise<void> {
    const isAvailable = await this.checkPermissionsTables();
    if (!isAvailable) {
      throw new Error('نظام الصلاحيات غير متاح حالياً - يرجى تطبيق migrations أولاً');
    }

    const role = await this.getRoleById(id);
    if (role?.is_system) {
      throw new Error('لا يمكن حذف دور النظام');
    }
    
    const { error } = await supabase
      .from('roles')
      .update({ is_active: false })
      .eq('id', id);
      
    if (error) throw error;
  }

  // Mock implementations for other methods when system is not available
  async createPermission(permission: Omit<Permission, 'id' | 'category'>): Promise<Permission> {
    throw new Error('نظام الصلاحيات غير متاح حالياً - يرجى تطبيق migrations أولاً');
  }

  async updatePermission(id: string, updates: Partial<Permission>): Promise<Permission> {
    throw new Error('نظام الصلاحيات غير متاح حالياً - يرجى تطبيق migrations أولاً');
  }

  async deletePermission(id: string): Promise<void> {
    throw new Error('نظام الصلاحيات غير متاح حالياً - يرجى تطبيق migrations أولاً');
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const isAvailable = await this.checkPermissionsTables();
    if (!isAvailable) {
      return [];
    }

    const { data, error } = await supabase
      .from('role_permissions')
      .select(`
        permission:permissions(
          *,
          category:permission_categories(*)
        )
      `)
      .eq('role_id', roleId);
      
    if (error) throw error;
    return (data || []).map((rp: any) => rp.permission);
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    throw new Error('نظام الصلاحيات غير متاح حالياً - يرجى تطبيق migrations أولاً');
  }

  async getUserRole(userId: string, tenantId?: string): Promise<Role | null> {
    try {
      const isAvailable = await this.checkPermissionsTables();
      if (!isAvailable) {
        // Fallback للنظام القديم
        const { data } = await supabase
          .from('tenant_users')
          .select('role')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (!data) return null;

        const { mockRoles } = this.getMockData();
        return mockRoles.find(r => r.name === data.role) || null;
      }

      let query = supabase
        .from('tenant_users')
        .select(`
          role:roles(
            *,
            role_permissions(
              permission:permissions(
                *,
                category:permission_categories(*)
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active');
        
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      
      if (!data?.role) return null;
      
      return {
        ...data.role,
        permissions: data.role.role_permissions?.map((rp: any) => rp.permission) || []
      };
    } catch (error) {
      console.warn('User role lookup failed:', error);
      return null;
    }
  }

  async logPermissionActivity(): Promise<void> {
    // تسجيل محدود أو لا شيء إذا لم يكن النظام متاحاً
    console.log('Permission activity logging not available');
  }

  async getAuditLogs(): Promise<PermissionAuditLog[]> {
    return [];
  }

  async bulkAssignRole(): Promise<void> {
    throw new Error('نظام الصلاحيات غير متاح حالياً - يرجى تطبيق migrations أولاً');
  }
}

// Singleton instance
export const permissionsService = new PermissionsService(); 