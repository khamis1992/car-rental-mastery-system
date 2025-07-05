import { IAttendanceRepository } from '@/repositories/interfaces/IAttendanceRepository';
import { Attendance } from '@/types/hr';
import { AccountingIntegrationService } from './AccountingIntegrationService';

export class AttendanceBusinessService {
  private accountingService: AccountingIntegrationService;

  constructor(private attendanceRepository: IAttendanceRepository) {
    this.accountingService = new AccountingIntegrationService();
  }

  async getAllAttendance(): Promise<Attendance[]> {
    return this.attendanceRepository.getAll();
  }

  async getAttendanceById(id: string): Promise<Attendance | null> {
    return this.attendanceRepository.getById(id);
  }

  async createAttendance(attendanceData: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>): Promise<Attendance> {
    return this.attendanceRepository.create(attendanceData);
  }

  async updateAttendance(id: string, updates: Partial<Attendance>): Promise<Attendance> {
    return this.attendanceRepository.update(id, updates);
  }

  async deleteAttendance(id: string): Promise<void> {
    return this.attendanceRepository.delete(id);
  }

  async getEmployeeAttendance(employeeId: string, startDate?: string, endDate?: string): Promise<Attendance[]> {
    return this.attendanceRepository.getByEmployeeId(employeeId, startDate, endDate);
  }

  async getTodayAttendance(employeeId: string): Promise<Attendance | null> {
    return this.attendanceRepository.getTodayAttendance(employeeId);
  }

  async getAttendanceByDateRange(startDate: string, endDate: string): Promise<Attendance[]> {
    return this.attendanceRepository.getByDateRange(startDate, endDate);
  }

  async checkIn(data: {
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
  }): Promise<Attendance> {
    const attendanceData = {
      ...data,
      overtime_hours: 0,
      status: (data.status as any) || 'present'
    };
    return this.attendanceRepository.create(attendanceData);
  }

  async checkOut(attendanceId: string, checkOutTime: string): Promise<Attendance> {
    const attendance = await this.attendanceRepository.update(attendanceId, {
      check_out_time: checkOutTime,
      updated_at: new Date().toISOString()
    });

    // حساب تكلفة العمالة وإنشاء القيد المحاسبي
    if (attendance.check_in_time && attendance.check_out_time) {
      try {
        await this.createAttendanceAccountingEntry(attendance);
      } catch (error) {
        console.warn('Failed to create accounting entry for attendance:', error);
      }
    }

    return attendance;
  }

  private async createAttendanceAccountingEntry(attendance: Attendance): Promise<void> {
    if (!attendance.check_in_time || !attendance.check_out_time) return;

    // حساب ساعات العمل
    const checkInTime = new Date(`${attendance.date}T${attendance.check_in_time}`);
    const checkOutTime = new Date(`${attendance.date}T${attendance.check_out_time}`);
    const totalHours = Math.max(0, (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60));
    
    // افتراض ساعات العمل العادية 8 ساعات
    const regularHours = Math.min(totalHours, 8);
    const overtimeHours = Math.max(0, totalHours - 8);
    
    // معدلات افتراضية (يمكن جلبها من قاعدة البيانات)
    const hourlyRate = 3; // 3 دنانير كويتية للساعة
    const overtimeRate = hourlyRate * 1.5;

    await this.accountingService.createAttendanceAccountingEntry({
      employee_name: 'موظف', // يمكن تحسينه بجلب اسم الموظف
      date: attendance.date,
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      hourly_rate: hourlyRate,
      overtime_rate: overtimeRate
    });
  }
}