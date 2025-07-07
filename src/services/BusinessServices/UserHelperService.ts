import { supabase } from '@/integrations/supabase/client';

export class UserHelperService {
  /**
   * Convert user_id to employee_id
   * @param userId - The auth user ID
   * @returns The corresponding employee ID or null if not found
   */
  static async getEmployeeIdFromUserId(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.warn('Could not find employee for user_id:', userId, error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error getting employee ID from user ID:', error);
      return null;
    }
  }

  /**
   * Get current user's employee ID
   * @returns The current user's employee ID or null if not found
   */
  static async getCurrentUserEmployeeId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      return await this.getEmployeeIdFromUserId(user.id);
    } catch (error) {
      console.error('Error getting current user employee ID:', error);
      return null;
    }
  }
}