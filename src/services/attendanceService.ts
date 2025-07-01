import { supabase } from '@/integrations/supabase/client';

export interface AttendanceCheckIn {
  employee_id: string;
  date: string;
  check_in_time: string;
  location_latitude?: number;
  location_longitude?: number;
  distance_from_office?: number;
  office_location_id?: string;
  manual_override?: boolean;
  override_reason?: string;
  notes?: string;
  status?: string;
}

export const attendanceService = {
  // تسجيل الحضور
  async checkIn(data: AttendanceCheckIn) {
    try {
      const { error } = await supabase
        .from('attendance')
        .insert([data]);

      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('خطأ في تسجيل الحضور:', error);
      return { success: false, error: error as Error };
    }
  },

  // التحقق من تسجيل الحضور لليوم
  async checkTodayAttendance(employeeId: string) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('خطأ في التحقق من الحضور:', error);
      return { data: null, error: error as Error };
    }
  },

  // جلب تقرير الحضور للموظف
  async getEmployeeAttendance(employeeId: string, startDate?: string, endDate?: string) {
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          office_locations (
            name,
            address
          )
        `)
        .eq('employee_id', employeeId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('خطأ في جلب تقرير الحضور:', error);
      return { data: null, error: error as Error };
    }
  },

  // تحديث الانصراف
  async checkOut(attendanceId: string, checkOutTime: string) {
    try {
      const { error } = await supabase
        .from('attendance')
        .update({ 
          check_out_time: checkOutTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', attendanceId);

      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('خطأ في تسجيل الانصراف:', error);
      return { success: false, error: error as Error };
    }
  },

  // طلب استثناء يدوي
  async requestManualOverride(data: {
    employee_id: string;
    date: string;
    check_in_time: string;
    override_reason: string;
    location_latitude?: number;
    location_longitude?: number;
    distance_from_office?: number;
  }) {
    try {
      const attendanceData: AttendanceCheckIn = {
        ...data,
        manual_override: true,
        status: 'pending',
        notes: `طلب استثناء يدوي: ${data.override_reason}`
      };

      const { error } = await supabase
        .from('attendance')
        .insert([attendanceData]);

      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('خطأ في طلب الاستثناء اليدوي:', error);
      return { success: false, error: error as Error };
    }
  }
};