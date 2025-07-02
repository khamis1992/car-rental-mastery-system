import { IRepository } from './IRepository';
import { Attendance } from '@/types/hr';

export interface IAttendanceRepository extends IRepository<Attendance> {
  getByEmployeeId(employeeId: string, startDate?: string, endDate?: string): Promise<Attendance[]>;
  getTodayAttendance(employeeId: string): Promise<Attendance | null>;
  getByDateRange(startDate: string, endDate: string): Promise<Attendance[]>;
}