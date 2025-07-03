import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  total_hours: number | null;
  overtime_hours: number | null;
  status: string;
  manual_override: boolean | null;
  override_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employees?: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    position: string;
    department: string;
    departments?: {
      id: string;
      department_name: string;
      department_code: string;
    };
  };
  office_locations?: {
    name: string;
    address: string;
  };
}

export interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  totalHoursThisMonth: number;
  overtimeHoursThisMonth: number;
}

export interface AttendanceFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  department?: string;
  status?: string;
  searchTerm?: string;
}

export const attendanceManagementService = {
  // جلب جميع سجلات الحضور مع الفلترة
  async getAllAttendanceRecords(filters?: AttendanceFilters): Promise<AttendanceRecord[]> {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        employees!employee_id(
          id,
          employee_number,
          first_name,
          last_name,
          position,
          department,
          departments!department_id(
            id,
            department_name,
            department_code
          )
        ),
        office_locations(
          name,
          address
        )
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }
    
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }
    
    if (filters?.employeeId) {
      query = query.eq('employee_id', filters.employeeId);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    let records = (data || []) as any[];
    
    // تطبيق فلتر القسم والبحث النصي
    if (filters?.department && records) {
      records = records.filter(record => 
        record.employees?.departments?.department_name === filters.department
      );
    }
    
    if (filters?.searchTerm && records) {
      const searchLower = filters.searchTerm.toLowerCase();
      records = records.filter(record => 
        record.employees?.first_name?.toLowerCase().includes(searchLower) ||
        record.employees?.last_name?.toLowerCase().includes(searchLower) ||
        record.employees?.employee_number?.toLowerCase().includes(searchLower)
      );
    }
    
    return records || [];
  },

  // جلب إحصائيات الحضور
  async getAttendanceStats(): Promise<AttendanceStats> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const currentMonth = format(new Date(), 'yyyy-MM');
    
    // عدد الموظفين الإجمالي
    const { data: employees } = await supabase
      .from('employees')
      .select('id')
      .eq('status', 'active');
    
    const totalEmployees = employees?.length || 0;
    
    // حضور اليوم
    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', today);
    
    const presentToday = todayAttendance?.filter(a => a.status === 'present').length || 0;
    const lateToday = todayAttendance?.filter(a => a.status === 'late').length || 0;
    const absentToday = totalEmployees - (todayAttendance?.length || 0);
    
    // ساعات العمل هذا الشهر
    const { data: monthlyAttendance } = await supabase
      .from('attendance')
      .select('total_hours, overtime_hours')
      .gte('date', currentMonth + '-01')
      .lte('date', currentMonth + '-31');
    
    const totalHoursThisMonth = monthlyAttendance?.reduce((sum, record) => 
      sum + (record.total_hours || 0), 0) || 0;
    
    const overtimeHoursThisMonth = monthlyAttendance?.reduce((sum, record) => 
      sum + (record.overtime_hours || 0), 0) || 0;
    
    return {
      totalEmployees,
      presentToday,
      absentToday,
      lateToday,
      totalHoursThisMonth,
      overtimeHoursThisMonth
    };
  },

  // جلب قائمة الموظفين للفلترة
  async getEmployeesForFilter() {
    const { data, error } = await supabase
      .from('employees')
      .select('id, employee_number, first_name, last_name, department')
      .eq('status', 'active')
      .order('first_name');
    
    if (error) throw error;
    return data || [];
  },

  // جلب قائمة الأقسام للفلترة
  async getDepartmentsForFilter() {
    const { data, error } = await supabase
      .from('departments')
      .select('department_name')
      .eq('is_active', true)
      .order('department_name');
    
    if (error) throw error;
    
    return data?.map(dept => dept.department_name) || [];
  },

  // تحديث سجل حضور
  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>) {
    const { data, error } = await supabase
      .from('attendance')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // حذف سجل حضور
  async deleteAttendanceRecord(id: string) {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // تصدير البيانات (CSV)
  async exportAttendanceData(filters?: AttendanceFilters): Promise<string> {
    const records = await this.getAllAttendanceRecords(filters);
    
    const csvHeaders = [
      'رقم الموظف',
      'اسم الموظف',
      'القسم',
      'التاريخ',
      'وقت الحضور',
      'وقت الانصراف',
      'ساعات العمل',
      'ساعات إضافية',
      'الحالة',
      'ملاحظات'
    ];
    
    const csvRows = records.map(record => [
      record.employees?.employee_number || '',
      `${record.employees?.first_name || ''} ${record.employees?.last_name || ''}`.trim(),
      record.employees?.departments?.department_name || 'غير محدد',
      record.date,
      record.check_in_time || '',
      record.check_out_time || '',
      record.total_hours?.toString() || '0',
      record.overtime_hours?.toString() || '0',
      record.status,
      record.notes || ''
    ]);
    
    const csv = [csvHeaders, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    return csv;
  },

  // جلب حضور موظف محدد
  async getEmployeeAttendance(employeeId: string, startDate?: string, endDate?: string) {
    return this.getAllAttendanceRecords({
      employeeId,
      startDate,
      endDate
    });
  }
};