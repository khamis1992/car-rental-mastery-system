import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FinancialReportData {
  account_name: string;
  account_code: string;
  current_balance: number;
  account_type: string;
  account_category?: string;
}

export const financialReportsPDFService = {
  // إنشاء المحتوى HTML للتقرير
  generateHTMLContent(data: FinancialReportData[], reportType: 'balance_sheet' | 'income_statement' | 'trial_balance', title: string): string {
    const totalAssets = data.filter(item => item.account_type === 'asset').reduce((sum, item) => sum + item.current_balance, 0);
    const totalLiabilities = data.filter(item => item.account_type === 'liability').reduce((sum, item) => sum + item.current_balance, 0);
    const totalEquity = data.filter(item => item.account_type === 'equity').reduce((sum, item) => sum + item.current_balance, 0);
    const totalRevenue = data.filter(item => item.account_type === 'revenue').reduce((sum, item) => sum + item.current_balance, 0);
    const totalExpenses = data.filter(item => item.account_type === 'expense').reduce((sum, item) => sum + item.current_balance, 0);

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
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 15px;
            padding: 10px;
            background: #f1f5f9;
            border-radius: 6px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
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
          .total-row {
            background-color: #e0f2fe !important;
            font-weight: bold;
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
          }
          .positive { color: #059669; }
          .negative { color: #dc2626; }
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .summary-cards { page-break-inside: avoid; }
            .section { page-break-inside: avoid; }
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
              <h3>إجمالي الأصول</h3>
              <div class="value currency positive">د.ك ${totalAssets.toFixed(3)}</div>
            </div>
            <div class="summary-card">
              <h3>إجمالي الخصوم</h3>
              <div class="value currency">د.ك ${totalLiabilities.toFixed(3)}</div>
            </div>
            <div class="summary-card">
              <h3>صافي الدخل</h3>
              <div class="value currency ${totalRevenue - totalExpenses >= 0 ? 'positive' : 'negative'}">
                د.ك ${(totalRevenue - totalExpenses).toFixed(3)}
              </div>
            </div>
          </div>

          ${reportType === 'balance_sheet' ? this.generateBalanceSheetSections(data) : ''}
          ${reportType === 'income_statement' ? this.generateIncomeStatementSections(data) : ''}
          ${reportType === 'trial_balance' ? this.generateTrialBalanceSections(data) : ''}

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

  generateBalanceSheetSections(data: FinancialReportData[]): string {
    const assets = data.filter(item => item.account_type === 'asset');
    const liabilities = data.filter(item => item.account_type === 'liability');
    const equity = data.filter(item => item.account_type === 'equity');

    return `
      <!-- الأصول -->
      <div class="section">
        <h3 class="section-title">الأصول</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>رمز الحساب</th>
              <th>اسم الحساب</th>
              <th>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            ${assets.map(item => `
              <tr>
                <td>${item.account_code}</td>
                <td>${item.account_name}</td>
                <td class="currency positive">د.ك ${item.current_balance.toFixed(3)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">إجمالي الأصول</td>
              <td class="currency">د.ك ${assets.reduce((sum, item) => sum + item.current_balance, 0).toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- الخصوم -->
      <div class="section">
        <h3 class="section-title">الخصوم</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>رمز الحساب</th>
              <th>اسم الحساب</th>
              <th>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            ${liabilities.map(item => `
              <tr>
                <td>${item.account_code}</td>
                <td>${item.account_name}</td>
                <td class="currency">د.ك ${item.current_balance.toFixed(3)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">إجمالي الخصوم</td>
              <td class="currency">د.ك ${liabilities.reduce((sum, item) => sum + item.current_balance, 0).toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- حقوق الملكية -->
      <div class="section">
        <h3 class="section-title">حقوق الملكية</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>رمز الحساب</th>
              <th>اسم الحساب</th>
              <th>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            ${equity.map(item => `
              <tr>
                <td>${item.account_code}</td>
                <td>${item.account_name}</td>
                <td class="currency">د.ك ${item.current_balance.toFixed(3)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">إجمالي حقوق الملكية</td>
              <td class="currency">د.ك ${equity.reduce((sum, item) => sum + item.current_balance, 0).toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  generateIncomeStatementSections(data: FinancialReportData[]): string {
    const revenues = data.filter(item => item.account_type === 'revenue');
    const expenses = data.filter(item => item.account_type === 'expense');

    return `
      <!-- الإيرادات -->
      <div class="section">
        <h3 class="section-title">الإيرادات</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>رمز الحساب</th>
              <th>اسم الحساب</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${revenues.map(item => `
              <tr>
                <td>${item.account_code}</td>
                <td>${item.account_name}</td>
                <td class="currency positive">د.ك ${item.current_balance.toFixed(3)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">إجمالي الإيرادات</td>
              <td class="currency">د.ك ${revenues.reduce((sum, item) => sum + item.current_balance, 0).toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- المصروفات -->
      <div class="section">
        <h3 class="section-title">المصروفات</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>رمز الحساب</th>
              <th>اسم الحساب</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(item => `
              <tr>
                <td>${item.account_code}</td>
                <td>${item.account_name}</td>
                <td class="currency negative">د.ك ${item.current_balance.toFixed(3)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2">إجمالي المصروفات</td>
              <td class="currency">د.ك ${expenses.reduce((sum, item) => sum + item.current_balance, 0).toFixed(3)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  generateTrialBalanceSections(data: FinancialReportData[]): string {
    return `
      <!-- ميزان المراجعة -->
      <div class="section">
        <table class="data-table">
          <thead>
            <tr>
              <th>رمز الحساب</th>
              <th>اسم الحساب</th>
              <th>نوع الحساب</th>
              <th>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(item => `
              <tr>
                <td>${item.account_code}</td>
                <td>${item.account_name}</td>
                <td>${this.translateAccountType(item.account_type)}</td>
                <td class="currency ${item.current_balance >= 0 ? 'positive' : 'negative'}">
                  د.ك ${item.current_balance.toFixed(3)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  translateAccountType(type: string): string {
    const translations = {
      'asset': 'أصل',
      'liability': 'خصم',
      'equity': 'حقوق ملكية',
      'revenue': 'إيراد',
      'expense': 'مصروف'
    };
    return translations[type as keyof typeof translations] || type;
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
  previewReport(data: FinancialReportData[], reportType: 'balance_sheet' | 'income_statement' | 'trial_balance', title: string): void {
    const htmlContent = this.generateHTMLContent(data, reportType, title);
    const previewWindow = window.open('', '_blank');
    
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    }
  },

  // تحميل التقرير كـ PDF
  async downloadReport(data: FinancialReportData[], reportType: 'balance_sheet' | 'income_statement' | 'trial_balance', title: string): Promise<void> {
    const htmlContent = this.generateHTMLContent(data, reportType, title);
    const filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    await this.generatePDFFromHTML(htmlContent, filename);
  }
};