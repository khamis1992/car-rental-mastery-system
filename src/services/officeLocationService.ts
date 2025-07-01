import { supabase } from '@/integrations/supabase/client';

export interface OfficeLocation {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOfficeLocationData {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active?: boolean;
}

export interface UpdateOfficeLocationData {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  is_active?: boolean;
}

export const officeLocationService = {
  // جلب جميع مواقع المكاتب
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('office_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('خطأ في جلب مواقع المكاتب:', error);
      return { data: null, error: error as Error };
    }
  },

  // جلب المواقع النشطة فقط
  async getActive() {
    try {
      const { data, error } = await supabase
        .from('office_locations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('خطأ في جلب المواقع النشطة:', error);
      return { data: null, error: error as Error };
    }
  },

  // إضافة موقع مكتب جديد
  async create(data: CreateOfficeLocationData) {
    try {
      const { data: result, error } = await supabase
        .from('office_locations')
        .insert([{
          ...data,
          is_active: data.is_active ?? true
        }])
        .select()
        .single();

      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      console.error('خطأ في إضافة موقع المكتب:', error);
      return { data: null, error: error as Error };
    }
  },

  // تحديث موقع مكتب
  async update(id: string, data: UpdateOfficeLocationData) {
    try {
      const { data: result, error } = await supabase
        .from('office_locations')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      console.error('خطأ في تحديث موقع المكتب:', error);
      return { data: null, error: error as Error };
    }
  },

  // حذف موقع مكتب
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('office_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error('خطأ في حذف موقع المكتب:', error);
      return { success: false, error: error as Error };
    }
  },

  // تفعيل/إلغاء تفعيل موقع مكتب
  async toggleActive(id: string, isActive: boolean) {
    try {
      const { data: result, error } = await supabase
        .from('office_locations')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data: result, error: null };
    } catch (error) {
      console.error('خطأ في تغيير حالة موقع المكتب:', error);
      return { data: null, error: error as Error };
    }
  }
};