import { supabase } from '@/integrations/supabase/client';
import { attendanceService } from './attendanceService';

export interface AttendanceDeductionSettings {
  enableLateDeduction: boolean;
  enableAbsenceDeduction: boolean;
  workingHoursPerMonth: number;
  gracePeriodMinutes: number;
  lateDeductionMultiplier: number;
  officialWorkStartTime: string; // HH:mm format
  officialWorkEndTime: string;   // HH:mm format
}

export interface DeductionCalculation {
  lateMinutes: number;
  lateDeduction: number;
  absentDays: number;
  absenceDeduction: number;
  totalDeduction: number;
  details: {
    lateRecords: Array<{
      date: string;
      minutesLate: number;
      deduction: number;
    }>;
    absentDates: string[];
  };
}

const defaultSettings: AttendanceDeductionSettings = {
  enableLateDeduction: true,
  enableAbsenceDeduction: true,
  workingHoursPerMonth: 240, // 30 days × 8 hours
  gracePeriodMinutes: 15,
  lateDeductionMultiplier: 1,
  officialWorkStartTime: '08:00',
  officialWorkEndTime: '17:00'
};

export const attendanceDeductionsService = {
  // حساب خصومات التأخير والغياب للموظف
  async calculateEmployeeDeductions(
    employeeId: string, 
    basicSalary: number, 
    periodStart: string, 
    periodEnd: string
  ): Promise<DeductionCalculation> {
    const settings = await this.getDeductionSettings();
    
    // جلب سجلات الحضور للفترة المحددة
    const { data: attendanceRecords } = await attendanceService.getEmployeeAttendance(
      employeeId, 
      periodStart, 
      periodEnd
    );

    // حساب عدد أيام العمل في الفترة (باستثناء الجمعة والسبت)
    const workingDays = this.calculateWorkingDays(periodStart, periodEnd);
    
    // حساب قيمة الساعة الواحدة
    const hourlyRate = basicSalary / settings.workingHoursPerMonth;
    
    let lateMinutes = 0;
    let lateDeduction = 0;
    let absentDays = 0;
    let absenceDeduction = 0;
    
    const lateRecords: Array<{ date: string; minutesLate: number; deduction: number }> = [];
    const absentDates: string[] = [];
    const presentDates = new Set();

    // معالجة سجلات الحضور الموجودة
    if (attendanceRecords) {
      for (const record of attendanceRecords) {
        presentDates.add(record.date);
        
        // حساب التأخير
        if (settings.enableLateDeduction && record.check_in_time) {
          const minutesLate = this.calculateLateMinutes(
            record.check_in_time, 
            settings.officialWorkStartTime
          );
          
          if (minutesLate > settings.gracePeriodMinutes) {
            const netLateMinutes = minutesLate - settings.gracePeriodMinutes;
            const lateDeductionAmount = this.calculateLateDeduction(
              netLateMinutes, 
              hourlyRate, 
              settings.lateDeductionMultiplier
            );
            
            lateMinutes += netLateMinutes;
            lateDeduction += lateDeductionAmount;
            
            lateRecords.push({
              date: record.date,
              minutesLate: netLateMinutes,
              deduction: lateDeductionAmount
            });
          }
        }
      }
    }

    // حساب أيام الغياب
    if (settings.enableAbsenceDeduction) {
      const allWorkingDates = this.getWorkingDatesInPeriod(periodStart, periodEnd);
      
      for (const date of allWorkingDates) {
        if (!presentDates.has(date)) {
          absentDates.push(date);
          absentDays++;
        }
      }
      
      // حساب خصم الغياب (قيمة يوم عمل كامل)
      const dailyRate = hourlyRate * 8; // 8 ساعات عمل يومياً
      absenceDeduction = absentDays * dailyRate;
    }

    return {
      lateMinutes,
      lateDeduction: Math.round(lateDeduction * 1000) / 1000,
      absentDays,
      absenceDeduction: Math.round(absenceDeduction * 1000) / 1000,
      totalDeduction: Math.round((lateDeduction + absenceDeduction) * 1000) / 1000,
      details: {
        lateRecords,
        absentDates
      }
    };
  },

  // حساب دقائق التأخير
  calculateLateMinutes(checkInTime: string, officialStartTime: string): number {
    const checkIn = new Date(`1970-01-01T${checkInTime}`);
    const officialStart = new Date(`1970-01-01T${officialStartTime}:00`);
    
    if (checkIn <= officialStart) return 0;
    
    const diffMs = checkIn.getTime() - officialStart.getTime();
    return Math.floor(diffMs / (1000 * 60)); // تحويل إلى دقائق
  },

  // حساب خصم التأخير
  calculateLateDeduction(lateMinutes: number, hourlyRate: number, multiplier: number): number {
    const lateHours = lateMinutes / 60;
    return lateHours * hourlyRate * multiplier;
  },

  // حساب أيام العمل في الفترة
  calculateWorkingDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      // استثناء الجمعة (5) والسبت (6)
      if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        workingDays++;
      }
    }
    
    return workingDays;
  },

  // الحصول على جميع تواريخ العمل في الفترة
  getWorkingDatesInPeriod(startDate: string, endDate: string): string[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const workingDates: string[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      // استثناء الجمعة (5) والسبت (6)
      if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        workingDates.push(d.toISOString().split('T')[0]);
      }
    }
    
    return workingDates;
  },

  // جلب إعدادات خصومات الحضور
  async getDeductionSettings(): Promise<AttendanceDeductionSettings> {
    // يمكن حفظ هذه الإعدادات في قاعدة البيانات لاحقاً
    return defaultSettings;
  },

  // تحديث إعدادات خصومات الحضور
  async updateDeductionSettings(settings: Partial<AttendanceDeductionSettings>): Promise<AttendanceDeductionSettings> {
    Object.assign(defaultSettings, settings);
    return defaultSettings;
  },

  // تقرير مفصل لخصومات الموظف
  async generateDeductionReport(employeeId: string, periodStart: string, periodEnd: string) {
    // جلب بيانات الموظف
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (!employee) {
      throw new Error('لم يتم العثور على بيانات الموظف');
    }

    // حساب الخصومات
    const deductions = await this.calculateEmployeeDeductions(
      employeeId, 
      employee.salary, 
      periodStart, 
      periodEnd
    );

    return {
      employee: {
        name: `${employee.first_name} ${employee.last_name}`,
        employee_number: employee.employee_number,
        salary: employee.salary
      },
      period: {
        start: periodStart,
        end: periodEnd
      },
      deductions,
      summary: {
        totalLateMinutes: deductions.lateMinutes,
        totalAbsentDays: deductions.absentDays,
        totalDeduction: deductions.totalDeduction,
        netSalaryAfterDeductions: employee.salary - deductions.totalDeduction
      }
    };
  }
};