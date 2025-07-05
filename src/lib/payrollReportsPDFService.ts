import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PayrollData {
  id: string;
  employee_name: string;
  employee_number: string;
  basic_salary: number;
  allowances: number;
  overtime_amount: number;
  bonuses: number;
  deductions: number;
  tax_deduction: number;
  social_insurance: number;
  gross_salary: number;
  net_salary: number;
  status: string;
}

class PayrollReportsPDFService {
  private formatCurrency(amount: number): string {
    return `د.ك ${amount.toFixed(3)}`;
  }

  private createReportHTML(
    data: PayrollData[], 
    reportType: 'monthly' | 'deductions',
    reportDate: string
  ): string {
    const companyInfo = {
      name: 'شركة ساپتكو الخليج لتأجير السيارات',
      address: 'دولة الكويت',
      phone: '+965 XXXX XXXX'
    };

    const getTotalGross = () => data.reduce((sum, item) => sum + item.gross_salary, 0);
    const getTotalNet = () => data.reduce((sum, item) => sum + item.net_salary, 0);
    const getTotalDeductions = () => data.reduce((sum, item) => sum + item.deductions + item.tax_deduction + item.social_insurance, 0);

    const getReportTitle = () => {
      return reportType === 'monthly' ? 'تقرير الرواتب الشهري' : 'تقرير الخصومات';
    };

    const summaryRows = data.map((row, index) => `
      <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'};">
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">
          <div>
            <div style="font-weight: 500;">${row.employee_name}</div>
            <div style="font-size: 14px; color: #6b7280;">${row.employee_number}</div>
          </div>
        </td>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${this.formatCurrency(row.basic_salary)}</td>
        ${reportType === 'monthly' ? `
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${this.formatCurrency(row.allowances)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${this.formatCurrency(row.overtime_amount)}</td>
          <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${this.formatCurrency(row.bonuses)}</td>
        ` : ''}
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${this.formatCurrency(row.deductions)}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${this.formatCurrency(row.tax_deduction)}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${this.formatCurrency(row.social_insurance)}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 600;">${this.formatCurrency(row.gross_salary)}</td>
        <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 600; color: #059669;">${this.formatCurrency(row.net_salary)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${getReportTitle()}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 32px;
            background-color: white;
            color: #1f2937;
            direction: rtl;
          }
          .header {
            text-align: center;
            margin-bottom: 32px;
            border-bottom: 2px solid #d1d5db;
            padding-bottom: 24px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 8px;
          }
          .company-info {
            color: #6b7280;
            margin-bottom: 4px;
          }
          .report-title {
            font-size: 20px;
            font-weight: 600;
            color: #2563eb;
            margin-top: 16px;
          }
          .report-date {
            color: #6b7280;
            margin-top: 8px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 32px;
          }
          .summary-card {
            padding: 16px;
            border-radius: 8px;
            text-align: center;
          }
          .summary-card.blue {
            background-color: #eff6ff;
          }
          .summary-card.green {
            background-color: #f0fdf4;
          }
          .summary-card.red {
            background-color: #fef2f2;
          }
          .summary-title {
            font-size: 14px;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .summary-value {
            font-size: 18px;
            font-weight: bold;
          }
          .summary-value.blue {
            color: #2563eb;
          }
          .summary-value.green {
            color: #059669;
          }
          .summary-value.red {
            color: #dc2626;
          }
          .table-container {
            overflow-x: auto;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #d1d5db;
            font-size: 14px;
          }
          th {
            background-color: #f3f4f6;
            border: 1px solid #d1d5db;
            padding: 12px 8px;
            text-align: right;
            font-weight: 600;
          }
          .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #d1d5db;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
          }
          .footer p {
            margin: 8px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="company-name">${companyInfo.name}</h1>
          <p class="company-info">${companyInfo.address}</p>
          <p class="company-info">${companyInfo.phone}</p>
          <h2 class="report-title">${getReportTitle()}</h2>
          <p class="report-date">تاريخ التقرير: ${format(new Date(reportDate), 'dd MMMM yyyy', { locale: ar })}</p>
        </div>

        <div class="summary">
          <div class="summary-card blue">
            <h3 class="summary-title">إجمالي الرواتب</h3>
            <p class="summary-value blue">${this.formatCurrency(getTotalGross())}</p>
          </div>
          <div class="summary-card green">
            <h3 class="summary-title">صافي الرواتب</h3>
            <p class="summary-value green">${this.formatCurrency(getTotalNet())}</p>
          </div>
          <div class="summary-card red">
            <h3 class="summary-title">إجمالي الخصومات</h3>
            <p class="summary-value red">${this.formatCurrency(getTotalDeductions())}</p>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>الموظف</th>
                <th>الراتب الأساسي</th>
                ${reportType === 'monthly' ? `
                  <th>البدلات</th>
                  <th>الإضافي</th>
                  <th>المكافآت</th>
                ` : ''}
                <th>الخصومات</th>
                <th>الضريبة</th>
                <th>التأمين</th>
                <th>الإجمالي</th>
                <th>الصافي</th>
              </tr>
            </thead>
            <tbody>
              ${summaryRows}
            </tbody>
            <tfoot>
              <tr style="background-color: #e5e7eb; font-weight: bold;">
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">المجموع</td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">
                  ${this.formatCurrency(data.reduce((sum, row) => sum + row.basic_salary, 0))}
                </td>
                ${reportType === 'monthly' ? `
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">
                    ${this.formatCurrency(data.reduce((sum, row) => sum + row.allowances, 0))}
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">
                    ${this.formatCurrency(data.reduce((sum, row) => sum + row.overtime_amount, 0))}
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">
                    ${this.formatCurrency(data.reduce((sum, row) => sum + row.bonuses, 0))}
                  </td>
                ` : ''}
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">
                  ${this.formatCurrency(data.reduce((sum, row) => sum + row.deductions, 0))}
                </td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">
                  ${this.formatCurrency(data.reduce((sum, row) => sum + row.tax_deduction, 0))}
                </td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">
                  ${this.formatCurrency(data.reduce((sum, row) => sum + row.social_insurance, 0))}
                </td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #2563eb;">
                  ${this.formatCurrency(getTotalGross())}
                </td>
                <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; color: #059669;">
                  ${this.formatCurrency(getTotalNet())}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="footer">
          <p>تم إنشاء هذا التقرير في: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
          <p>هذا التقرير سري ومخصص للاستخدام الداخلي فقط</p>
        </div>
      </body>
      </html>
    `;
  }

  async generatePDFFromHTML(htmlContent: string, filename: string): Promise<void> {
    // إنشاء عنصر مؤقت لعرض HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm'; // A4 width
    document.body.appendChild(tempDiv);

    try {
      // تحويل HTML إلى canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
      });

      // إنشاء PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // إضافة الصفحة الأولى
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm

      // إضافة صفحات إضافية إذا لزم الأمر
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      // حفظ الملف
      pdf.save(filename);
    } finally {
      // إزالة العنصر المؤقت
      document.body.removeChild(tempDiv);
    }
  }

  async generateMonthlyPayrollReport(data: PayrollData[]): Promise<void> {
    const reportDate = format(new Date(), 'yyyy-MM-dd');
    const htmlContent = this.createReportHTML(data, 'monthly', reportDate);
    const filename = `تقرير_الرواتب_الشهري_${format(new Date(), 'yyyy-MM', { locale: ar })}.pdf`;
    
    await this.generatePDFFromHTML(htmlContent, filename);
  }

  async generateDeductionsReport(data: PayrollData[]): Promise<void> {
    const reportDate = format(new Date(), 'yyyy-MM-dd');
    const htmlContent = this.createReportHTML(data, 'deductions', reportDate);
    const filename = `تقرير_الخصومات_${format(new Date(), 'yyyy-MM', { locale: ar })}.pdf`;
    
    await this.generatePDFFromHTML(htmlContent, filename);
  }

  // دالة لعرض معاينة HTML قبل تحويلها إلى PDF
  previewReport(data: PayrollData[], reportType: 'monthly' | 'deductions'): void {
    const reportDate = format(new Date(), 'yyyy-MM-dd');
    const htmlContent = this.createReportHTML(data, reportType, reportDate);
    
    // فتح نافذة جديدة لعرض المعاينة
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    }
  }
}

export const payrollReportsPDFService = new PayrollReportsPDFService();