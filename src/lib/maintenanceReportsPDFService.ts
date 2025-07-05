import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface MaintenanceReportData {
  id: string;
  vehicle_number: string;
  vehicle_make: string;
  vehicle_model: string;
  license_plate: string;
  maintenance_type: string;
  description: string;
  cost: number;
  maintenance_date: string;
  next_maintenance_date?: string;
  status: string;
  provider_name?: string;
}

export const maintenanceReportsPDFService = {
  // إنشاء المحتوى HTML للتقرير
  generateHTMLContent(data: MaintenanceReportData[], reportType: 'maintenance_history' | 'cost_analysis' | 'schedule', title: string, dateRange?: { start: string; end: string }): string {
    const totalCost = data.reduce((sum, item) => sum + item.cost, 0);
    const completedCount = data.filter(item => item.status === 'completed').length;
    const pendingCount = data.filter(item => item.status === 'pending').length;
    const averageCost = data.length > 0 ? totalCost / data.length : 0;

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
          .date-range {
            background: #eff6ff;
            padding: 10px;
            border-radius: 6px;
            margin: 15px 0;
            text-align: center;
            color: #1d4ed8;
            font-weight: 500;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          .summary-card h3 {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 6px;
          }
          .summary-card .value {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 10px;
          }
          .data-table th,
          .data-table td {
            border: 1px solid #d1d5db;
            padding: 6px;
            text-align: right;
          }
          .data-table th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #374151;
            font-size: 11px;
          }
          .data-table tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .status-badge {
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 500;
          }
          .status-completed {
            background-color: #dcfce7;
            color: #166534;
          }
          .status-pending {
            background-color: #fef3c7;
            color: #92400e;
          }
          .status-scheduled {
            background-color: #dbeafe;
            color: #1e40af;
          }
          .status-overdue {
            background-color: #fef2f2;
            color: #991b1b;
          }
          .maintenance-type {
            font-weight: 500;
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 9px;
          }
          .type-routine {
            background-color: #e0f2fe;
            color: #0369a1;
          }
          .type-repair {
            background-color: #fef2f2;
            color: #991b1b;
          }
          .type-preventive {
            background-color: #f0fdf4;
            color: #166534;
          }
          .cost-analysis {
            margin: 30px 0;
          }
          .cost-breakdown {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 20px 0;
          }
          .cost-item {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
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
            color: #dc2626;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .summary-cards { page-break-inside: avoid; }
            .cost-breakdown { page-break-inside: avoid; }
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
            ${dateRange ? `
              <div class="date-range">
                الفترة: من ${new Date(dateRange.start).toLocaleDateString('ar-KW')} 
                إلى ${new Date(dateRange.end).toLocaleDateString('ar-KW')}
              </div>
            ` : ''}
          </div>

          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <h3>إجمالي العمليات</h3>
              <div class="value">${data.length}</div>
            </div>
            <div class="summary-card">
              <h3>إجمالي التكلفة</h3>
              <div class="value currency">د.ك ${totalCost.toFixed(3)}</div>
            </div>
            <div class="summary-card">
              <h3>متوسط التكلفة</h3>
              <div class="value currency">د.ك ${averageCost.toFixed(3)}</div>
            </div>
            <div class="summary-card">
              <h3>مكتمل / معلق</h3>
              <div class="value">${completedCount} / ${pendingCount}</div>
            </div>
          </div>

          ${reportType === 'cost_analysis' ? this.generateCostAnalysisSection(data) : ''}

          <!-- Data Table -->
          <table class="data-table">
            <thead>
              <tr>
                <th>رقم المركبة</th>
                <th>المركبة</th>
                <th>رقم اللوحة</th>
                <th>نوع الصيانة</th>
                <th>الوصف</th>
                <th>التكلفة</th>
                <th>تاريخ الصيانة</th>
                <th>الصيانة القادمة</th>
                <th>الحالة</th>
                <th>مقدم الخدمة</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${item.vehicle_number}</td>
                  <td>${item.vehicle_make} ${item.vehicle_model}</td>
                  <td>${item.license_plate}</td>
                  <td>
                    <span class="maintenance-type ${this.getMaintenanceTypeClass(item.maintenance_type)}">
                      ${this.translateMaintenanceType(item.maintenance_type)}
                    </span>
                  </td>
                  <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${item.description}</td>
                  <td class="currency">د.ك ${item.cost.toFixed(3)}</td>
                  <td>${new Date(item.maintenance_date).toLocaleDateString('ar-KW')}</td>
                  <td>${item.next_maintenance_date ? new Date(item.next_maintenance_date).toLocaleDateString('ar-KW') : '-'}</td>
                  <td>
                    <span class="status-badge status-${item.status}">
                      ${this.translateStatus(item.status)}
                    </span>
                  </td>
                  <td>${item.provider_name || '-'}</td>
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

  translateMaintenanceType(type: string): string {
    const translations = {
      'routine': 'دورية',
      'repair': 'إصلاح',
      'preventive': 'وقائية',
      'emergency': 'طارئة',
      'inspection': 'فحص'
    };
    return translations[type as keyof typeof translations] || type;
  },

  getMaintenanceTypeClass(type: string): string {
    const classes = {
      'routine': 'type-routine',
      'repair': 'type-repair',
      'preventive': 'type-preventive',
      'emergency': 'type-repair',
      'inspection': 'type-routine'
    };
    return classes[type as keyof typeof classes] || 'type-routine';
  },

  translateStatus(status: string): string {
    const translations = {
      'completed': 'مكتمل',
      'pending': 'معلق',
      'scheduled': 'مجدول',
      'overdue': 'متأخر',
      'cancelled': 'ملغي'
    };
    return translations[status as keyof typeof translations] || status;
  },

  generateCostAnalysisSection(data: MaintenanceReportData[]): string {
    // تحليل التكلفة حسب نوع الصيانة
    const costByType = data.reduce((acc, item) => {
      if (!acc[item.maintenance_type]) {
        acc[item.maintenance_type] = { count: 0, total: 0 };
      }
      acc[item.maintenance_type].count++;
      acc[item.maintenance_type].total += item.cost;
      return acc;
    }, {} as any);

    return `
      <div class="cost-analysis">
        <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 15px; padding: 10px; background: #f1f5f9; border-radius: 6px;">
          تحليل التكلفة حسب نوع الصيانة
        </h3>
        <div class="cost-breakdown">
          ${Object.entries(costByType).map(([type, data]: [string, any]) => `
            <div class="cost-item">
              <h4 style="font-size: 14px; color: #374151; margin-bottom: 8px;">
                ${this.translateMaintenanceType(type)}
              </h4>
              <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                عدد العمليات: ${data.count}
              </p>
              <p style="font-size: 16px; font-weight: bold; color: #dc2626;">
                د.ك ${data.total.toFixed(3)}
              </p>
              <p style="font-size: 10px; color: #9ca3af;">
                متوسط: د.ك ${(data.total / data.count).toFixed(3)}
              </p>
            </div>
          `).join('')}
        </div>
      </div>
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
        width: 794,
        height: 1123,
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
  previewReport(data: MaintenanceReportData[], reportType: 'maintenance_history' | 'cost_analysis' | 'schedule', title: string, dateRange?: { start: string; end: string }): void {
    const htmlContent = this.generateHTMLContent(data, reportType, title, dateRange);
    const previewWindow = window.open('', '_blank');
    
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    }
  },

  // تحميل التقرير كـ PDF
  async downloadReport(data: MaintenanceReportData[], reportType: 'maintenance_history' | 'cost_analysis' | 'schedule', title: string, dateRange?: { start: string; end: string }): Promise<void> {
    const htmlContent = this.generateHTMLContent(data, reportType, title, dateRange);
    const filename = `maintenance_${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    await this.generatePDFFromHTML(htmlContent, filename);
  }
};