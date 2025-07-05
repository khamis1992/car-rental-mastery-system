import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AttendanceReportData {
  id: string;
  employee_name: string;
  employee_number: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  total_hours?: number;
  overtime_hours?: number;
  status: string;
  department?: string;
}

export const attendanceReportsPDFService = {
  generateHTMLContent(data: AttendanceReportData[], reportType: 'daily' | 'monthly' | 'summary', title: string): string {
    const totalPresent = data.filter(item => item.status === 'present').length;
    const totalAbsent = data.filter(item => item.status === 'absent').length;
    const totalHours = data.reduce((sum, item) => sum + (item.total_hours || 0), 0);

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Arial', sans-serif; font-size: 12px; direction: rtl; }
          .container { max-width: 210mm; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
          .report-title { font-size: 20px; font-weight: 600; color: #3b82f6; margin-bottom: 10px; }
          .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; }
          .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
          .data-table th, .data-table td { border: 1px solid #d1d5db; padding: 8px; text-align: right; }
          .data-table th { background-color: #f3f4f6; font-weight: 600; }
          .status-present { background-color: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 10px; }
          .status-absent { background-color: #fef2f2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="company-name">شركة ساپتكو الخليج لتأجير السيارات</h1>
            <h2 class="report-title">${title}</h2>
            <p>تاريخ التقرير: ${new Date().toLocaleDateString('ar-KW')}</p>
          </div>
          
          <div class="summary-cards">
            <div class="summary-card">
              <h3>إجمالي الحضور</h3>
              <div style="font-size: 24px; font-weight: bold; color: #059669;">${totalPresent}</div>
            </div>
            <div class="summary-card">
              <h3>إجمالي الغياب</h3>
              <div style="font-size: 24px; font-weight: bold; color: #dc2626;">${totalAbsent}</div>
            </div>
            <div class="summary-card">
              <h3>إجمالي الساعات</h3>
              <div style="font-size: 24px; font-weight: bold; color: #0ea5e9;">${totalHours.toFixed(1)}</div>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>الموظف</th>
                <th>التاريخ</th>
                <th>وقت الدخول</th>
                <th>وقت الخروج</th>
                <th>إجمالي الساعات</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${item.employee_name} (${item.employee_number})</td>
                  <td>${new Date(item.date).toLocaleDateString('ar-KW')}</td>
                  <td>${item.check_in_time || '-'}</td>
                  <td>${item.check_out_time || '-'}</td>
                  <td>${item.total_hours?.toFixed(1) || '0.0'}</td>
                  <td><span class="status-${item.status}">${item.status === 'present' ? 'حاضر' : 'غائب'}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  },

  async generatePDFFromHTML(htmlContent: string, filename: string): Promise<void> {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(filename);
    } finally {
      document.body.removeChild(tempDiv);
    }
  },

  previewReport(data: AttendanceReportData[], reportType: 'daily' | 'monthly' | 'summary', title: string): void {
    const htmlContent = this.generateHTMLContent(data, reportType, title);
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    }
  },

  async downloadReport(data: AttendanceReportData[], reportType: 'daily' | 'monthly' | 'summary', title: string): Promise<void> {
    const htmlContent = this.generateHTMLContent(data, reportType, title);
    const filename = `attendance_${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    await this.generatePDFFromHTML(htmlContent, filename);
  }
};