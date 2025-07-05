import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AttendanceRecord, AttendanceFilters } from '@/services/attendanceManagementService';

interface ReportData {
  title: string;
  period: string;
  data: AttendanceRecord[];
  stats?: {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    totalHours: number;
    overtimeHours: number;
  };
}

export class AttendanceReportsPDFService {
  private static instance: AttendanceReportsPDFService;
  private doc: jsPDF;

  private constructor() {
    this.doc = new jsPDF();
  }

  public static getInstance(): AttendanceReportsPDFService {
    if (!AttendanceReportsPDFService.instance) {
      AttendanceReportsPDFService.instance = new AttendanceReportsPDFService();
    }
    return AttendanceReportsPDFService.instance;
  }

  private setupDocument() {
    this.doc = new jsPDF();
    
    // إعداد الخط العربي (نحاول استخدام خط يدعم العربية)
    try {
      this.doc.setFont('courier');
    } catch (e) {
      console.warn('Arabic font not available, using default');
    }
    
    // إعداد الصفحة من اليمين إلى اليسار
    this.doc.setR2L(true);
  }

  private addHeader(title: string, period: string) {
    const pageWidth = this.doc.internal.pageSize.width;
    
    // شعار أو اسم الشركة
    this.doc.setFontSize(20);
    this.doc.setFont('courier', 'bold');
    this.doc.text('نظام إدارة الحضور والانصراف', pageWidth - 20, 20, { align: 'right' });
    
    // عنوان التقرير
    this.doc.setFontSize(16);
    this.doc.text(title, pageWidth - 20, 35, { align: 'right' });
    
    // الفترة الزمنية
    this.doc.setFontSize(12);
    this.doc.setFont('courier', 'normal');
    this.doc.text(`الفترة: ${period}`, pageWidth - 20, 50, { align: 'right' });
    
    // التاريخ والوقت
    const now = new Date();
    const dateTime = format(now, 'dd/MM/yyyy HH:mm', { locale: ar });
    this.doc.text(`تاريخ التصدير: ${dateTime}`, pageWidth - 20, 60, { align: 'right' });
    
    // خط فاصل
    this.doc.line(20, 70, pageWidth - 20, 70);
  }

  private addSummaryStats(stats: ReportData['stats']) {
    if (!stats) return;

    const pageWidth = this.doc.internal.pageSize.width;
    let yPosition = 85;

    this.doc.setFontSize(14);
    this.doc.setFont('courier', 'bold');
    this.doc.text('ملخص الإحصائيات', pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 15;
    this.doc.setFontSize(10);
    this.doc.setFont('courier', 'normal');

    const statsData = [
      `إجمالي الموظفين: ${stats.totalEmployees}`,
      `الحاضرون اليوم: ${stats.presentToday}`,
      `الغائبون اليوم: ${stats.absentToday}`,
      `المتأخرون اليوم: ${stats.lateToday}`,
      `إجمالي الساعات: ${stats.totalHours.toFixed(1)}`,
      `الساعات الإضافية: ${stats.overtimeHours.toFixed(1)}`
    ];

    statsData.forEach(stat => {
      this.doc.text(stat, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 12;
    });

    // خط فاصل
    this.doc.line(20, yPosition + 5, pageWidth - 20, yPosition + 5);
    return yPosition + 15;
  }

  private addTableHeaders(startY: number) {
    const pageWidth = this.doc.internal.pageSize.width;
    const headers = [
      'رقم الموظف',
      'اسم الموظف', 
      'القسم',
      'التاريخ',
      'وقت الحضور',
      'وقت الانصراف',
      'ساعات العمل',
      'الحالة'
    ];

    this.doc.setFontSize(10);
    this.doc.setFont('courier', 'bold');
    
    const columnWidth = (pageWidth - 40) / headers.length;
    
    headers.forEach((header, index) => {
      const xPosition = pageWidth - 20 - (columnWidth * (index + 1));
      this.doc.text(header, xPosition + columnWidth/2, startY, { align: 'center' });
    });

    // خط تحت العناوين
    this.doc.line(20, startY + 5, pageWidth - 20, startY + 5);
    
    return startY + 15;
  }

  private addTableData(data: AttendanceRecord[], startY: number) {
    const pageWidth = this.doc.internal.pageSize.width;
    const pageHeight = this.doc.internal.pageSize.height;
    const columnWidth = (pageWidth - 40) / 8;
    
    this.doc.setFontSize(9);
    this.doc.setFont('courier', 'normal');
    
    let yPosition = startY;
    const rowHeight = 12;
    
    data.forEach((record, index) => {
      // التحقق من الحاجة لصفحة جديدة
      if (yPosition > pageHeight - 30) {
        this.doc.addPage();
        yPosition = 20;
        // إعادة إضافة عناوين الأعمدة في الصفحة الجديدة
        yPosition = this.addTableHeaders(yPosition);
      }

      const rowData = [
        record.employees?.employee_number || '',
        `${record.employees?.first_name || ''} ${record.employees?.last_name || ''}`.trim(),
        record.employees?.departments?.department_name || '',
        record.date,
        record.check_in_time || '',
        record.check_out_time || '',
        record.total_hours?.toString() || '0',
        this.getStatusLabel(record.status)
      ];

      rowData.forEach((data, colIndex) => {
        const xPosition = pageWidth - 20 - (columnWidth * (colIndex + 1));
        // قص النص الطويل
        const text = data.length > 15 ? data.substring(0, 12) + '...' : data;
        this.doc.text(text, xPosition + columnWidth/2, yPosition, { align: 'center' });
      });

      yPosition += rowHeight;
      
      // خط فاصل بين الصفوف
      if (index % 2 === 0) {
        this.doc.setDrawColor(240, 240, 240);
        this.doc.line(20, yPosition - rowHeight/2, pageWidth - 20, yPosition - rowHeight/2);
        this.doc.setDrawColor(0, 0, 0);
      }
    });
  }

  private getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'present': 'حاضر',
      'absent': 'غائب',
      'late': 'متأخر',
      'early_leave': 'انصراف مبكر',
      'sick': 'إجازة مرضية',
      'vacation': 'إجازة'
    };
    return statusMap[status] || status;
  }

  private addFooter() {
    const pageWidth = this.doc.internal.pageSize.width;
    const pageHeight = this.doc.internal.pageSize.height;
    
    this.doc.setFontSize(8);
    this.doc.setFont('courier', 'normal');
    this.doc.text('تم إنشاء هذا التقرير بواسطة نظام إدارة الحضور والانصراف', 
                   pageWidth/2, pageHeight - 10, { align: 'center' });
  }

  public generateAttendanceReport(reportData: ReportData): Promise<void> {
    return new Promise((resolve) => {
      this.setupDocument();
      
      // إضافة الهيدر
      this.addHeader(reportData.title, reportData.period);
      
      // إضافة الإحصائيات
      let currentY = this.addSummaryStats(reportData.stats) || 85;
      
      // إضافة البيانات إذا كانت متوفرة
      if (reportData.data.length > 0) {
        currentY = this.addTableHeaders(currentY);
        this.addTableData(reportData.data, currentY);
      } else {
        this.doc.setFontSize(12);
        this.doc.text('لا توجد بيانات للفترة المحددة', 
                      this.doc.internal.pageSize.width - 20, currentY + 20, { align: 'right' });
      }
      
      // إضافة الفوتر
      this.addFooter();
      
      resolve();
    });
  }

  public async downloadReport(filename: string) {
    this.doc.save(filename);
  }

  public getPDFBlob(): Blob {
    return this.doc.output('blob');
  }
}

export const attendanceReportsPDFService = AttendanceReportsPDFService.getInstance();