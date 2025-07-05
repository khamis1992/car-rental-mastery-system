import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ViolationReportData {
  id: string;
  violation_number: string;
  customer_name: string;
  vehicle_license: string;
  violation_type: string;
  fine_amount: number;
  payment_status: string;
  violation_date: string;
  created_at: string;
}

export const violationReportsPDFService = {
  // إنشاء المحتوى HTML للتقرير
  generateHTMLContent(data: ViolationReportData[], reportType: 'violations' | 'payments', title: string): string {
    const totalFines = data.reduce((sum, item) => sum + item.fine_amount, 0);
    const paidCount = data.filter(item => item.payment_status === 'paid').length;
    const unpaidCount = data.filter(item => item.payment_status === 'unpaid').length;

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            direction: rtl;
          }
          .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 20px;
            font-weight: 600;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .report-date {
            color: #6b7280;
            font-size: 14px;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }
          .summary-card h3 {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 8px;
          }
          .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 11px;
          }
          .data-table th,
          .data-table td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: right;
          }
          .data-table th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          .data-table tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
          }
          .status-paid {
            background-color: #dcfce7;
            color: #166534;
          }
          .status-unpaid {
            background-color: #fef2f2;
            color: #991b1b;
          }
          .status-partial {
            background-color: #fef3c7;
            color: #92400e;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 10px;
          }
          .currency {
            font-weight: 600;
            color: #059669;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .summary-cards { page-break-inside: avoid; }
            .data-table { page-break-inside: auto; }
            .data-table tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1 class="company-name">شركة ساپتكو الخليج لتأجير السيارات</h1>
            <p style="color: #6b7280; margin-bottom: 15px;">دولة الكويت</p>
            <h2 class="report-title">${title}</h2>
            <p class="report-date">تاريخ التقرير: ${new Date().toLocaleDateString('ar-KW')}</p>
          </div>

          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <h3>إجمالي المخالفات</h3>
              <div class="value">${data.length}</div>
            </div>
            <div class="summary-card">
              <h3>إجمالي الغرامات</h3>
              <div class="value currency">د.ك ${totalFines.toFixed(3)}</div>
            </div>
            <div class="summary-card">
              <h3>المدفوع / غير المدفوع</h3>
              <div class="value">${paidCount} / ${unpaidCount}</div>
            </div>
          </div>

          <!-- Data Table -->
          <table class="data-table">
            <thead>
              <tr>
                <th>رقم المخالفة</th>
                <th>العميل</th>
                <th>رقم اللوحة</th>
                <th>نوع المخالفة</th>
                <th>مبلغ الغرامة</th>
                <th>حالة السداد</th>
                <th>تاريخ المخالفة</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${item.violation_number}</td>
                  <td>${item.customer_name}</td>
                  <td>${item.vehicle_license}</td>
                  <td>${item.violation_type}</td>
                  <td class="currency">د.ك ${item.fine_amount.toFixed(3)}</td>
                  <td>
                    <span class="status-badge status-${item.payment_status}">
                      ${item.payment_status === 'paid' ? 'مدفوع' : 
                        item.payment_status === 'partial' ? 'جزئي' : 'غير مدفوع'}
                    </span>
                  </td>
                  <td>${new Date(item.violation_date).toLocaleDateString('ar-KW')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- Footer -->
          <div class="footer">
            <p>تم إنشاء هذا التقرير تلقائياً بواسطة نظام إدارة تأجير السيارات</p>
            <p>© ${new Date().getFullYear()} شركة ساپتكو الخليج لتأجير السيارات - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  // تحويل HTML إلى PDF
  async generatePDFFromHTML(htmlContent: string, filename: string): Promise<void> {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '210mm';
    document.body.appendChild(tempDiv);

    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123, // A4 height in pixels at 96 DPI
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(filename);
    } finally {
      document.body.removeChild(tempDiv);
    }
  },

  // معاينة التقرير في نافذة جديدة
  previewReport(data: ViolationReportData[], reportType: 'violations' | 'payments', title: string): void {
    const htmlContent = this.generateHTMLContent(data, reportType, title);
    const previewWindow = window.open('', '_blank');
    
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    }
  },

  // تحميل التقرير كـ PDF
  async downloadReport(data: ViolationReportData[], reportType: 'violations' | 'payments', title: string): Promise<void> {
    const htmlContent = this.generateHTMLContent(data, reportType, title);
    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    await this.generatePDFFromHTML(htmlContent, filename);
  }
};