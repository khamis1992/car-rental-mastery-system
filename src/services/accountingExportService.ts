import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CustomerTransaction, CustomerAnalytics, CustomerOverview, FixedAsset } from './accountingReportsService';

interface CompanyInfo {
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  accountantName: string;
  managerName: string;
}

class AccountingExportService {
  private companyInfo: CompanyInfo = {
    name: 'نظام إدارة تأجير السيارات',
    address: 'الرياض، المملكة العربية السعودية',
    phone: '+966 11 234 5678',
    email: 'info@car-rental.com',
    accountantName: 'أحمد محمد المحاسب',
    managerName: 'محمد أحمد المدير المالي'
  };

  // 1. Export Customer Statement to PDF
  async exportCustomerStatementPDF(
    customerName: string,
    transactions: CustomerTransaction[],
    summary: {
      totalInvoices: number;
      totalPayments: number;
      totalPenalties: number;
      currentBalance: number;
    }
  ): Promise<void> {
    const doc = new jsPDF();
    
    // Set Arabic font support
    doc.setFont('helvetica', 'normal');
    
    // Header
    this.addHeader(doc, 'كشف حساب العميل');
    
    // Customer info
    doc.setFontSize(14);
    doc.text(`العميل: ${customerName}`, 20, 60);
    doc.text(`تاريخ الطباعة: ${format(new Date(), 'yyyy/MM/dd', { locale: ar })}`, 20, 70);
    
    // Summary section
    doc.setFontSize(12);
    doc.text('ملخص الحساب:', 20, 90);
    
    const summaryData = [
      ['إجمالي الفواتير', `${summary.totalInvoices.toLocaleString()} د.ك`],
      ['إجمالي المدفوعات', `${summary.totalPayments.toLocaleString()} د.ك`],
      ['إجمالي الغرامات', `${summary.totalPenalties.toLocaleString()} د.ك`],
      ['الرصيد الحالي', `${summary.currentBalance.toLocaleString()} د.ك`]
    ];
    
    let yPos = 100;
    summaryData.forEach(([label, value]) => {
      doc.text(label + ':', 20, yPos);
      doc.text(value, 120, yPos);
      yPos += 10;
    });
    
    // Transactions table
    yPos += 20;
    doc.text('تفاصيل العمليات:', 20, yPos);
    
    // Table headers
    const headers = ['التاريخ', 'رقم العقد', 'نوع العملية', 'المبلغ', 'الرصيد'];
    yPos += 15;
    
    headers.forEach((header, index) => {
      doc.text(header, 20 + (index * 35), yPos);
    });
    
    // Draw line under headers
    doc.line(20, yPos + 3, 190, yPos + 3);
    
    // Transaction rows
    yPos += 10;
    transactions.slice(0, 15).forEach(transaction => { // Limit to 15 rows per page
      if (yPos > 250) {
        doc.addPage();
        yPos = 30;
      }
      
      const transactionData = [
        format(new Date(transaction.transaction_date), 'yyyy/MM/dd'),
        transaction.contract_number,
        this.getTransactionTypeName(transaction.transaction_type),
        `${transaction.amount.toLocaleString()} د.ك`,
        `${transaction.balance.toLocaleString()} د.ك`
      ];
      
      transactionData.forEach((data, index) => {
        doc.text(data, 20 + (index * 35), yPos);
      });
      yPos += 8;
    });
    
    // Footer with signatures
    this.addFooter(doc);
    
    // Save PDF
    doc.save(`كشف_حساب_${customerName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  // 2. Export Customer Analytics to PDF
  async exportCustomerAnalyticsPDF(analytics: CustomerAnalytics): Promise<void> {
    const doc = new jsPDF();
    
    // Header
    this.addHeader(doc, 'التقرير التحليلي للعميل');
    
    // Customer info
    doc.setFontSize(14);
    doc.text(`العميل: ${analytics.customer_name}`, 20, 60);
    doc.text(`تاريخ التقرير: ${format(new Date(), 'yyyy/MM/dd', { locale: ar })}`, 20, 70);
    
    // Analytics data
    const analyticsData = [
      ['إجمالي الإيرادات', `${analytics.total_revenue.toLocaleString()} د.ك`],
      ['عدد العقود', analytics.contracts_count.toString()],
      ['متوسط مدة التأجير', `${analytics.average_rental_days} يوم`],
      ['نسبة التحصيل', `${analytics.collection_rate.toFixed(1)}%`],
      ['إجمالي الغرامات', `${analytics.total_penalties.toLocaleString()} د.ك`],
      ['الغرامات المدفوعة', `${analytics.paid_penalties.toLocaleString()} د.ك`],
      ['الرصيد الحالي', `${analytics.current_balance.toLocaleString()} د.ك`],
      ['المركبة الأكثر استئجاراً', analytics.most_rented_vehicle],
      ['الفرع الأكثر تعاملاً', analytics.most_used_branch]
    ];
    
    let yPos = 90;
    analyticsData.forEach(([label, value]) => {
      doc.text(label + ':', 20, yPos);
      doc.text(value, 120, yPos);
      yPos += 10;
    });
    
    // Add footer
    this.addFooter(doc);
    
    // Save PDF
    doc.save(`التقرير_التحليلي_${analytics.customer_name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  // 3. Export Customers Overview to Excel
  async exportCustomersOverviewExcel(customers: CustomerOverview[]): Promise<void> {
    const worksheetData = [
      [
        'كود العميل',
        'اسم العميل',
        'الهاتف',
        'البريد الإلكتروني',
        'عدد العقود',
        'الرصيد الحالي',
        'إجمالي الفواتير',
        'إجمالي المدفوعات',
        'نسبة التحصيل %',
        'عدد الغرامات',
        'الحالة',
        'أيام التأخير'
      ],
      ...customers.map(customer => [
        customer.customer_code,
        customer.customer_name,
        customer.phone,
        customer.email,
        customer.contracts_count,
        customer.current_balance,
        customer.total_invoices,
        customer.total_payments,
        customer.collection_rate.toFixed(1),
        customer.penalties_count,
        this.getStatusName(customer.status),
        customer.days_overdue
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    
    // Style the header row
    const headerRange = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: 11, r: 0 } });
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير العملاء');
    
    // Save Excel file
    XLSX.writeFile(workbook, `تقرير_العملاء_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }

  // 4. Export Fixed Assets to PDF
  async exportFixedAssetsPDF(assets: FixedAsset[]): Promise<void> {
    const doc = new jsPDF('landscape'); // Landscape for better table width
    
    // Header
    this.addHeader(doc, 'تقرير الأصول الثابتة');
    
    // Summary
    const totalValue = assets.reduce((sum, asset) => sum + asset.purchase_value, 0);
    const totalBookValue = assets.reduce((sum, asset) => sum + asset.book_value, 0);
    const totalDepreciation = assets.reduce((sum, asset) => sum + asset.accumulated_depreciation, 0);
    
    doc.setFontSize(12);
    doc.text(`إجمالي القيمة الأصلية: ${totalValue.toLocaleString()} د.ك`, 20, 60);
    doc.text(`إجمالي القيمة الدفترية: ${totalBookValue.toLocaleString()} د.ك`, 20, 70);
    doc.text(`إجمالي الإهلاك المجمع: ${totalDepreciation.toLocaleString()} د.ك`, 20, 80);
    
    // Assets table
    const headers = [
      'كود الأصل', 'رقم اللوحة', 'الموديل', 'تاريخ الشراء',
      'القيمة الأصلية', 'معدل الإهلاك', 'الإهلاك المجمع', 'القيمة الدفترية'
    ];
    
    let yPos = 100;
    
    // Table headers
    headers.forEach((header, index) => {
      doc.text(header, 20 + (index * 30), yPos);
    });
    
    // Draw line under headers
    doc.line(20, yPos + 3, 260, yPos + 3);
    
    // Asset rows
    yPos += 10;
    assets.forEach(asset => {
      if (yPos > 180) {
        doc.addPage();
        yPos = 30;
      }
      
      const assetData = [
        asset.asset_code,
        asset.plate_number,
        asset.model,
        format(new Date(asset.purchase_date), 'yyyy/MM/dd'),
        `${asset.purchase_value.toLocaleString()}`,
        `${asset.depreciation_rate}%`,
        `${asset.accumulated_depreciation.toLocaleString()}`,
        `${asset.book_value.toLocaleString()}`
      ];
      
      assetData.forEach((data, index) => {
        doc.text(data, 20 + (index * 30), yPos);
      });
      yPos += 8;
    });
    
    // Add footer
    this.addFooter(doc);
    
    // Save PDF
    doc.save(`تقرير_الأصول_الثابتة_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  // 5. Export Fixed Assets to Excel
  async exportFixedAssetsExcel(assets: FixedAsset[]): Promise<void> {
    const worksheetData = [
      [
        'كود الأصل',
        'نوع المركبة',
        'رقم اللوحة',
        'الموديل',
        'السنة',
        'تاريخ الشراء',
        'القيمة الأصلية',
        'معدل الإهلاك %',
        'الإهلاك الشهري',
        'الإهلاك المجمع',
        'القيمة الدفترية',
        'الحالة'
      ],
      ...assets.map(asset => [
        asset.asset_code,
        this.getVehicleTypeName(asset.vehicle_type),
        asset.plate_number,
        asset.model,
        asset.year,
        format(new Date(asset.purchase_date), 'yyyy/MM/dd'),
        asset.purchase_value,
        asset.depreciation_rate,
        asset.monthly_depreciation,
        asset.accumulated_depreciation,
        asset.book_value,
        this.getStatusName(asset.status)
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الأصول الثابتة');
    
    // Save Excel file
    XLSX.writeFile(workbook, `الأصول_الثابتة_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  }

  // Helper methods
  private addHeader(doc: jsPDF, title: string): void {
    // Company logo placeholder (you can add actual logo here)
    doc.setFontSize(16);
    doc.text(this.companyInfo.name, 20, 20);
    
    // Title
    doc.setFontSize(18);
    doc.text(title, 20, 35);
    
    // Company info
    doc.setFontSize(10);
    doc.text(this.companyInfo.address, 20, 45);
    doc.text(`هاتف: ${this.companyInfo.phone} | بريد: ${this.companyInfo.email}`, 20, 50);
  }

  private addFooter(doc: jsPDF): void {
    const pageHeight = doc.internal.pageSize.height;
    
    // Signatures
    doc.setFontSize(10);
    doc.text('المحاسب:', 20, pageHeight - 30);
    doc.text(this.companyInfo.accountantName, 20, pageHeight - 20);
    doc.text('التوقيع: _______________', 20, pageHeight - 10);
    
    doc.text('المدير المالي:', 120, pageHeight - 30);
    doc.text(this.companyInfo.managerName, 120, pageHeight - 20);
    doc.text('التوقيع: _______________', 120, pageHeight - 10);
    
    // Date and page number
    doc.text(`تاريخ الطباعة: ${format(new Date(), 'yyyy/MM/dd HH:mm', { locale: ar })}`, 200, pageHeight - 20);
  }

  private getTransactionTypeName(type: string): string {
    switch (type) {
      case 'invoice':
        return 'فاتورة';
      case 'payment':
        return 'دفعة';
      case 'penalty':
        return 'غرامة';
      case 'discount':
        return 'خصم';
      default:
        return type;
    }
  }

  private getVehicleTypeName(type: string): string {
    switch (type) {
      case 'sedan':
        return 'سيارة صالون';
      case 'suv':
        return 'دفع رباعي';
      case 'bus':
        return 'باص';
      case 'truck':
        return 'شاحنة';
      default:
        return type;
    }
  }

  private getStatusName(status: string): string {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      case 'overdue':
        return 'متأخر';
      case 'maintenance':
        return 'صيانة';
      case 'disposed':
        return 'مُستبعد';
      default:
        return status;
    }
  }

  // 6. Print specific report
  async printReport(reportElement: HTMLElement, title: string): Promise<void> {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              direction: rtl;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .report-title {
              font-size: 18px;
              color: #666;
            }
            .footer {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .signature {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-top: 1px solid #333;
              margin-top: 30px;
              padding-top: 5px;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${this.companyInfo.name}</div>
            <div class="report-title">${title}</div>
            <div style="font-size: 12px; margin-top: 10px;">
              ${this.companyInfo.address} | ${this.companyInfo.phone}
            </div>
          </div>
          
          ${reportElement.innerHTML}
          
          <div class="footer">
            <div class="signature">
              <div>المحاسب</div>
              <div style="font-weight: bold;">${this.companyInfo.accountantName}</div>
              <div class="signature-line">التوقيع</div>
            </div>
            
            <div style="text-align: center;">
              <div>تاريخ الطباعة</div>
              <div>${format(new Date(), 'yyyy/MM/dd HH:mm', { locale: ar })}</div>
            </div>
            
            <div class="signature">
              <div>المدير المالي</div>
              <div style="font-weight: bold;">${this.companyInfo.managerName}</div>
              <div class="signature-line">التوقيع</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  // 7. Update company information
  updateCompanyInfo(info: Partial<CompanyInfo>): void {
    this.companyInfo = { ...this.companyInfo, ...info };
  }

  // 8. Get current company info
  getCompanyInfo(): CompanyInfo {
    return { ...this.companyInfo };
  }
}

export const accountingExportService = new AccountingExportService(); 