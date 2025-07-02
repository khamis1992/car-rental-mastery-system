import { IAttendanceRepository } from '@/repositories/interfaces/IAttendanceRepository';
import { Attendance } from '@/types/hr';

export class AttendanceBusinessService {
  constructor(private attendanceRepository: IAttendanceRepository) {}

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
    return this.attendanceRepository.update(attendanceId, {
      check_out_time: checkOutTime,
      updated_at: new Date().toISOString()
    });
  }
}