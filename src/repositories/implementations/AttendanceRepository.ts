import { BaseRepository } from '../base/BaseRepository';
import { IAttendanceRepository } from '../interfaces/IAttendanceRepository';
import { Attendance } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';

export class AttendanceRepository extends BaseRepository<Attendance> implements IAttendanceRepository {
  protected tableName = 'attendance';

  async getByEmployeeId(employeeId: string, startDate?: string, endDate?: string): Promise<Attendance[]> {
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
    return (data || []) as Attendance[];
  }

  async getTodayAttendance(employeeId: string): Promise<Attendance | null> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle();

    if (error) throw error;
    return data as Attendance | null;
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        employees (
          employee_number,
          first_name,
          last_name,
          position,
          department
        ),
        office_locations (
          name,
          address
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []) as Attendance[];
  }
}