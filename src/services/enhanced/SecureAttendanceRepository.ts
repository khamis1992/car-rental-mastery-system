import { BaseRepository } from '../../repositories/base/BaseRepository';
import { IAttendanceRepository } from '../../repositories/interfaces/IAttendanceRepository';
import { Attendance } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';
import { DataSecurityService } from './DataSecurityService';

export class SecureAttendanceRepository extends BaseRepository<Attendance> implements IAttendanceRepository {
  protected tableName = 'attendance';
  private securityService: DataSecurityService;

  constructor() {
    super();
    this.securityService = new DataSecurityService('attendance');
  }

  // تحسين الحصول على بيانات الحضور للموظف مع عزل المؤسسة
  async getByEmployeeId(employeeId: string, startDate?: string, endDate?: string): Promise<Attendance[]> {
    try {
      // التحقق من الأمان
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

      // تسجيل العملية
      await this.securityService.logDataOperation('SELECT', 'attendance', {
        employee_id: employeeId,
        records_count: data?.length || 0,
        date_range: { startDate, endDate }
      });

      return (data || []) as Attendance[];
    } catch (error) {
      await this.securityService.logSecurityEvent('attendance_access_failed', {
        employee_id: employeeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // تحسين الحصول على حضور اليوم مع عزل المؤسسة
  async getTodayAttendance(employeeId: string): Promise<Attendance | null> {
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

      // تسجيل العملية
      await this.securityService.logDataOperation('SELECT', 'attendance', {
        employee_id: employeeId,
        operation: 'get_today_attendance'
      });

      return data as Attendance | null;
    } catch (error) {
      await this.securityService.logSecurityEvent('today_attendance_access_failed', {
        employee_id: employeeId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // تحسين الحصول على الحضور بنطاق تاريخي مع عزل المؤسسة
  async getByDateRange(startDate: string, endDate: string): Promise<Attendance[]> {
    try {
      await this.securityService.validateTenantAccess();
      const tenantId = await this.getCurrentTenantId();
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees!employee_id (
            employee_number,
            first_name,
            last_name,
            position,
            department,
            tenant_id
          ),
          office_locations (
            name,
            address
          )
        `)
        .eq('tenant_id', tenantId || '')
        .eq('employees.tenant_id', tenantId || '') // عزل إضافي على مستوى الموظفين
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;

      // تسجيل العملية
      await this.securityService.logDataOperation('SELECT', 'attendance', {
        operation: 'get_by_date_range',
        date_range: { startDate, endDate },
        records_count: data?.length || 0
      });

      return (data || []) as Attendance[];
    } catch (error) {
      await this.securityService.logSecurityEvent('date_range_access_failed', {
        date_range: { startDate, endDate },
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // تحسين إنشاء سجل حضور مع الأمان
  async create(entity: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>): Promise<Attendance> {
    try {
      await this.securityService.validateTenantAccess();
      const isValidEmployee = await this.securityService.validateEmployeeAccess(entity.employee_id);
      if (!isValidEmployee) {
        throw new Error('غير مصرح للوصول إلى بيانات هذا الموظف');
      }

      const tenantId = await this.securityService.getCurrentTenantId();
      
      // إضافة معرف المؤسسة تلقائياً
      const entityWithTenant = {
        ...entity,
        tenant_id: tenantId
      };

      const { data, error } = await supabase
        .from('attendance')
        .insert([entityWithTenant])
        .select()
        .single();

      if (error) throw error;

      // تسجيل العملية
      await this.securityService.logDataOperation('INSERT', 'attendance', {
        employee_id: entity.employee_id,
        attendance_id: data.id,
        operation: 'create_attendance'
      });

      return data as Attendance;
    } catch (error) {
      await this.securityService.logSecurityEvent('attendance_creation_failed', {
        employee_id: entity.employee_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // تحسين تحديث سجل الحضور مع فحص الأمان
  async update(id: string, updates: Partial<Attendance>): Promise<Attendance> {
    try {
      await this.securityService.validateTenantAccess();
      const tenantId = await this.securityService.getCurrentTenantId();

      // التحقق من أن السجل ينتمي للمؤسسة الحالية
      const { data: existingRecord } = await supabase
        .from('attendance')
        .select('employee_id, tenant_id')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (!existingRecord) {
        throw new Error('سجل الحضور غير موجود أو غير مصرح بالوصول إليه');
      }

      const isValidEmployee = await this.securityService.validateEmployeeAccess(existingRecord.employee_id);
      if (!isValidEmployee) {
        throw new Error('غير مصرح للوصول إلى بيانات هذا الموظف');
      }

      const { data, error } = await supabase
        .from('attendance')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId) // ضمان عزل البيانات
        .select()
        .single();

      if (error) throw error;

      // تسجيل العملية
      await this.securityService.logDataOperation('UPDATE', 'attendance', {
        attendance_id: id,
        employee_id: existingRecord.employee_id,
        updated_fields: Object.keys(updates)
      });

      return data as Attendance;
    } catch (error) {
      await this.securityService.logSecurityEvent('attendance_update_failed', {
        attendance_id: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // تحسين حذف سجل الحضور مع فحص الأمان
  async delete(id: string): Promise<void> {
    try {
      await this.securityService.validateTenantAccess();
      const tenantId = await this.securityService.getCurrentTenantId();

      // التحقق من أن السجل ينتمي للمؤسسة الحالية
      const { data: existingRecord } = await supabase
        .from('attendance')
        .select('employee_id, tenant_id')
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (!existingRecord) {
        throw new Error('سجل الحضور غير موجود أو غير مصرح بالوصول إليه');
      }

      const isValidEmployee = await this.securityService.validateEmployeeAccess(existingRecord.employee_id);
      if (!isValidEmployee) {
        throw new Error('غير مصرح للوصول إلى بيانات هذا الموظف');
      }

      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId); // ضمان عزل البيانات

      if (error) throw error;

      // تسجيل العملية
      await this.securityService.logDataOperation('DELETE', 'attendance', {
        attendance_id: id,
        employee_id: existingRecord.employee_id
      });
    } catch (error) {
      await this.securityService.logSecurityEvent('attendance_deletion_failed', {
        attendance_id: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // تحسين الحصول على جميع السجلات مع عزل المؤسسة
  async getAll(): Promise<Attendance[]> {
    try {
      await this.securityService.validateTenantAccess();
      const tenantId = await this.securityService.getCurrentTenantId();

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees!employee_id (
            employee_number,
            first_name,
            last_name,
            tenant_id
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // تسجيل العملية
      await this.securityService.logDataOperation('SELECT', 'attendance', {
        operation: 'get_all',
        records_count: data?.length || 0
      });

      return (data || []) as Attendance[];
    } catch (error) {
      await this.securityService.logSecurityEvent('get_all_attendance_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // تحسين الحصول على سجل واحد مع فحص الأمان
  async getById(id: string): Promise<Attendance | null> {
    try {
      await this.securityService.validateTenantAccess();
      const tenantId = await this.securityService.getCurrentTenantId();

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees!employee_id (
            employee_number,
            first_name,
            last_name,
            tenant_id
          )
        `)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw error;
      }

      // التحقق من صحة الموظف
      if ((data as any)?.employees?.tenant_id !== tenantId) {
        throw new Error('غير مصرح بالوصول إلى هذا السجل');
      }

      // تسجيل العملية
      await this.securityService.logDataOperation('SELECT', 'attendance', {
        attendance_id: id,
        operation: 'get_by_id'
      });

      return data as Attendance;
    } catch (error) {
      await this.securityService.logSecurityEvent('get_attendance_by_id_failed', {
        attendance_id: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}