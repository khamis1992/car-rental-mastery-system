import { supabase } from '@/integrations/supabase/client';

export interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  role: string;
  status: string;
  tenant_id: string;
  tenant_name?: string;
  invited_at?: string;
  joined_at: string;
}

export interface RoleStats {
  role: string;
  userCount: number;
  description: string;
}

export class UserManagementService {
  /**
   * جلب جميع المستخدمين مع أدوارهم
   */
  static async getAllUsersWithRoles(): Promise<UserWithRole[]> {
    try {
      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          *,
          tenants:tenant_id (
            name
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      // الحصول على معلومات المستخدمين من Auth
      const userIds = data?.map(item => item.user_id) || [];
      const authUsers = await this.getAuthUsers(userIds);

      const usersWithRoles: UserWithRole[] = data?.map(item => {
        const authUser = authUsers.find(user => user.id === item.user_id);
        return {
          id: item.user_id,
          email: authUser?.email || 'غير محدد',
          created_at: authUser?.created_at || item.created_at,
          last_sign_in_at: authUser?.last_sign_in_at,
          role: item.role,
          status: item.status,
          tenant_id: item.tenant_id,
          tenant_name: (item.tenants as any)?.name || 'غير محدد',
          invited_at: item.invited_at,
          joined_at: item.joined_at
        };
      }) || [];

      return usersWithRoles;
    } catch (error) {
      console.error('Error in getAllUsersWithRoles:', error);
      return [];
    }
  }

  /**
   * جلب معلومات المستخدمين من Auth
   */
  static async getAuthUsers(userIds: string[]) {
    try {
      // نحتاج لاستخدام edge function للوصول لبيانات Auth
      const { data, error } = await supabase.functions.invoke('get-auth-users', {
        body: { userIds }
      });

      if (error) {
        console.error('Error fetching auth users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAuthUsers:', error);
      return userIds.map(id => ({
        id,
        email: 'غير متاح',
        created_at: new Date().toISOString(),
        last_sign_in_at: null
      }));
    }
  }

  /**
   * جلب إحصائيات الأدوار
   */
  static async getRoleStats(): Promise<RoleStats[]> {
    try {
      const { data, error } = await supabase
        .from('tenant_users')
        .select('role')
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching role stats:', error);
        throw error;
      }

      // تجميع الأدوار وحساب العدد
      const roleCount = data?.reduce((acc, item) => {
        acc[item.role] = (acc[item.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // أوصاف الأدوار
      const roleDescriptions: Record<string, string> = {
        'super_admin': 'مدير النظام العام - صلاحيات كاملة',
        'tenant_admin': 'مدير المؤسسة - إدارة كاملة للمؤسسة',
        'manager': 'مدير - صلاحيات إدارية محدودة',
        'accountant': 'محاسب - إدارة المالية والتقارير',
        'receptionist': 'موظف استقبال - إدارة العقود والعملاء',
        'user': 'مستخدم عادي - صلاحيات محدودة'
      };

      const roleStats: RoleStats[] = Object.entries(roleCount).map(([role, count]) => ({
        role,
        userCount: count,
        description: roleDescriptions[role] || 'دور مخصص'
      }));

      return roleStats;
    } catch (error) {
      console.error('Error in getRoleStats:', error);
      return [];
    }
  }

  /**
   * تحديث دور المستخدم
   */
  static async updateUserRole(userId: string, newRole: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tenant_users')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      return false;
    }
  }

  /**
   * إزالة مستخدم
   */
  static async removeUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tenant_users')
        .update({ status: 'inactive' })
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing user:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in removeUser:', error);
      return false;
    }
  }

  /**
   * دعوة مستخدم جديد
   */
  static async inviteUser(email: string, role: string, tenantId: string): Promise<boolean> {
    try {
      // نحتاج لاستخدام edge function لإرسال دعوة
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, role, tenantId }
      });

      if (error) {
        console.error('Error inviting user:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in inviteUser:', error);
      return false;
    }
  }
}