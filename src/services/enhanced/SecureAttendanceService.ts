import { supabase } from '@/integrations/supabase/client';
import { Attendance } from '@/types/hr';
import { DataSecurityService } from './DataSecurityService';

export interface SecureAttendanceCheckIn {
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

export class SecureAttendanceService {
  private securityService: DataSecurityService;

  constructor() {
    this.securityService = new DataSecurityService('attendance');
  }

  // تسجيل الحضور مع فحص الأمان
  async checkIn(data: SecureAttendanceCheckIn): Promise<{ success: boolean; error: Error | null; data?: any }> {
    try {
      // فحص صحة البيانات والمؤسسة
      await this.securityService.validateTenantAccess();
      
      // التحقق من صحة معرف الموظف
      const isValidEmployee = await this.securityService.validateEmployeeAccess(data.employee_id);
      if (!isValidEmployee) {
        throw new Error('غير مصرح للوصول إلى بيانات هذا الموظف');
      }

      // إضافة معرف المؤسسة تلقائياً
      const tenantId = await this.securityService.getCurrentTenantId();
      const attendanceData = {
        ...data,
        tenant_id: tenantId,
        overtime_hours: 0,
        status: data.status || 'present'
      };

      // تسجيل العملية للمراقبة
      await this.securityService.logDataOperation('INSERT', 'attendance', {
        employee_id: data.employee_id,
        operation: 'check_in'
      });

      const { data: result, error } = await supabase
        .from('attendance')
        .insert([attendanceData])
        .select()
        .single();

      if (error) throw error;
      
      return { success: true, error: null, data: result };
    } catch (error) {
      console.error('خطأ في تسجيل الحضور الآمن:', error);
      await this.securityService.logSecurityEvent('check_in_failed', {
        employee_id: data.employee_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error as Error };
    }
  }

  // التحقق من تسجيل الحضور لليوم مع فحص الأمان
  async checkTodayAttendance(employeeId: string): Promise<{ data: Attendance | null; error: Error | null }> {
    try {
      await this.securityService.validateTenantAccess();
      
      const isValidEmployee = await this.securityService.validateEmployeeAccess(employeeId);
      if (!isValidEmployee) {
        throw new Error('غير مصرح للوصول إلى بيانات هذا الموظف');
      }

      const today = new Date().toISOString().split('T')[0];
      const tenantId = await this.securityService.getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .eq('tenant_id', tenantId) // ضمان عزل البيانات
        .maybeSingle();

      if (error) throw error;
      
      // تسجيل العملية للمراقبة
      await this.securityService.logDataOperation('SELECT', 'attendance', {
        employee_id: employeeId,
        operation: 'check_today_attendance'
      });

      return { data: data as Attendance | null, error: null };
    } catch (error) {
      console.error('خطأ في التحقق من الحضور الآمن:', error);
      await this.securityService.logSecurityEvent('attendance_check_failed', {
        employee_id: employeeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { data: null, error: error as Error };
    }
  }

  // جلب تقرير الحضور للموظف مع فحص الأمان
  async getEmployeeAttendance(employeeId: string, startDate?: string, endDate?: string): Promise<{ data: Attendance[] | null; error: Error | null }> {
    try {
      await this.securityService.validateTenantAccess();
      
      const isValidEmployee = await this.securityService.validateEmployeeAccess(employeeId);
      if (!isValidEmployee) {
        throw new Error('غير مصرح للوصول إلى بيانات هذا الموظف');
      }

      const tenantId = await this.securityService.getCurrentTenantId();
      
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
        .eq('tenant_id', tenantId) // ضمان عزل البيانات
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // تسجيل العملية للمراقبة
      await this.securityService.logDataOperation('SELECT', 'attendance', {
        employee_id: employeeId,
        operation: 'get_employee_attendance',
        records_count: data?.length || 0
      });

      return { data: data as Attendance[] || [], error: null };
    } catch (error) {
      console.error('خطأ في جلب تقرير الحضور الآمن:', error);
      await this.securityService.logSecurityEvent('attendance_report_failed', {
        employee_id: employeeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { data: null, error: error as Error };
    }
  }

  // تحديث الانصراف مع فحص الأمان
  async checkOut(attendanceId: string, checkOutTime: string): Promise<{ success: boolean; error: Error | null }> {
    try {
      await this.securityService.validateTenantAccess();
      
      // التحقق من أن سجل الحضور ينتمي للمؤسسة الحالية
      const tenantId = await this.securityService.getCurrentTenantId();
      const { data: attendanceRecord } = await supabase
        .from('attendance')
        .select('employee_id, tenant_id')
        .eq('id', attendanceId)
        .eq('tenant_id', tenantId)
        .single();

      if (!attendanceRecord) {
        throw new Error('سجل الحضور غير موجود أو غير مصرح بالوصول إليه');
      }

      const isValidEmployee = await this.securityService.validateEmployeeAccess(attendanceRecord.employee_id);
      if (!isValidEmployee) {
        throw new Error('غير مصرح للوصول إلى بيانات هذا الموظف');
      }

      const { error } = await supabase
        .from('attendance')
        .update({ 
          check_out_time: checkOutTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', attendanceId)
        .eq('tenant_id', tenantId); // ضمان عزل البيانات

      if (error) throw error;
      
      // تسجيل العملية للمراقبة
      await this.securityService.logDataOperation('UPDATE', 'attendance', {
        attendance_id: attendanceId,
        employee_id: attendanceRecord.employee_id,
        operation: 'check_out'
      });

      return { success: true, error: null };
    } catch (error) {
      console.error('خطأ في تسجيل الانصراف الآمن:', error);
      await this.securityService.logSecurityEvent('check_out_failed', {
        attendance_id: attendanceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error as Error };
    }
  }

  // طلب استثناء يدوي مع فحص الأمان
  async requestManualOverride(data: {
    employee_id: string;
    date: string;
    check_in_time: string;
    override_reason: string;
    location_latitude?: number;
    location_longitude?: number;
    distance_from_office?: number;
  }): Promise<{ success: boolean; error: Error | null }> {
    try {
      await this.securityService.validateTenantAccess();
      
      const isValidEmployee = await this.securityService.validateEmployeeAccess(data.employee_id);
      if (!isValidEmployee) {
        throw new Error('غير مصرح للوصول إلى بيانات هذا الموظف');
      }

      const tenantId = await this.securityService.getCurrentTenantId();
      const attendanceData: SecureAttendanceCheckIn = {
        ...data,
        manual_override: true,
        status: 'pending',
        notes: `طلب استثناء يدوي: ${data.override_reason}`
      };

      // تسجيل العملية للمراقبة
      await this.securityService.logDataOperation('INSERT', 'attendance', {
        employee_id: data.employee_id,
        operation: 'manual_override_request'
      });

      const { error } = await supabase
        .from('attendance')
        .insert([{
          ...attendanceData,
          tenant_id: tenantId,
          overtime_hours: 0
        }]);

      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('خطأ في طلب الاستثناء اليدوي الآمن:', error);
      await this.securityService.logSecurityEvent('manual_override_failed', {
        employee_id: data.employee_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, error: error as Error };
    }
  }

  // جلب إحصائيات الحضور للمؤسسة مع فحص الأمان
  async getAttendanceStatistics(dateRange: { startDate: string; endDate: string }): Promise<{ data: any | null; error: Error | null }> {
    try {
      await this.securityService.validateTenantAccess();
      
      const tenantId = await this.securityService.getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees!employee_id (
            first_name,
            last_name,
            department
          )
        `)
        .eq('tenant_id', tenantId)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      if (error) throw error;

      // حساب الإحصائيات
      const totalRecords = data?.length || 0;
      const presentCount = data?.filter(record => record.status === 'present').length || 0;
      const lateCount = data?.filter(record => record.status === 'late').length || 0;
      const absentCount = data?.filter(record => record.status === 'absent').length || 0;

      const statistics = {
        totalRecords,
        presentCount,
        lateCount,
        absentCount,
        presentPercentage: totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
        latePercentage: totalRecords > 0 ? Math.round((lateCount / totalRecords) * 100) : 0,
        absentPercentage: totalRecords > 0 ? Math.round((absentCount / totalRecords) * 100) : 0
      };

      await this.securityService.logDataOperation('SELECT', 'attendance', {
        operation: 'get_statistics',
        records_count: totalRecords,
        date_range: dateRange
      });

      return { data: statistics, error: null };
    } catch (error) {
      console.error('خطأ في جلب إحصائيات الحضور:', error);
      await this.securityService.logSecurityEvent('statistics_failed', {
        date_range: dateRange,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { data: null, error: error as Error };
    }
  }
}