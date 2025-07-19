import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Printer } from 'lucide-react';
import { accountingService } from '@/services/accountingService';
import { formatDate, formatDateTime } from '@/lib/utils';

interface MonthlyReportProps {
  month?: number;
  year?: number;
}

export const MonthlyReport: React.FC<MonthlyReportProps> = ({ 
  month = new Date().getMonth() + 1, 
  year = new Date().getFullYear() 
}) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [month, year]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const entries = await accountingService.getJournalEntries();
      
      // Filter entries for the specified month/year
      const monthlyEntries = entries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        return entryDate.getMonth() + 1 === month && entryDate.getFullYear() === year;
      });

      const totalDebit = monthlyEntries.reduce((sum, entry) => sum + entry.total_debit, 0);
      const totalCredit = monthlyEntries.reduce((sum, entry) => sum + entry.total_credit, 0);
      const postedEntries = monthlyEntries.filter(entry => entry.status === 'posted').length;
      const draftEntries = monthlyEntries.filter(entry => entry.status === 'draft').length;

      setReportData({
        entries: monthlyEntries,
        totalDebit,
        totalCredit,
        postedEntries,
        draftEntries,
        balance: totalDebit - totalCredit
      });
    } catch (error) {
      console.error('Error loading monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = document.getElementById('monthly-report');
    if (content) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>التقرير الشهري - ${monthNames[month - 1]} ${year}</title>
            <meta charset="utf-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
              
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                font-family: 'Tajawal', 'Arial', sans-serif;
                direction: rtl;
                background: #ffffff;
                color: #1a1a1a;
                line-height: 1.6;
                font-size: 14px;
              }

              .report-container {
                max-width: 210mm;
                margin: 0 auto;
                background: white;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
              }

              /* Header Design */
              .report-header {
                background: linear-gradient(135deg, #059669, #10b981);
                color: white;
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }

              .report-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
                opacity: 0.3;
              }

              .header-content {
                position: relative;
                z-index: 2;
              }

              .company-logo {
                width: 80px;
                height: 80px;
                background: rgba(255,255,255,0.15);
                border-radius: 50%;
                margin: 0 auto 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                font-weight: 800;
                color: white;
                border: 3px solid rgba(255,255,255,0.3);
              }

              .report-title {
                font-size: 32px;
                font-weight: 800;
                margin-bottom: 10px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }

              .report-subtitle {
                font-size: 18px;
                font-weight: 500;
                opacity: 0.9;
                margin-bottom: 30px;
              }

              .report-meta {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                background: rgba(255,255,255,0.1);
                padding: 20px;
                border-radius: 15px;
                border: 1px solid rgba(255,255,255,0.2);
              }

              .meta-item {
                text-align: center;
              }

              .meta-label {
                font-size: 12px;
                opacity: 0.8;
                margin-bottom: 5px;
              }

              .meta-value {
                font-size: 16px;
                font-weight: 700;
              }

              /* Content Sections */
              .report-content {
                padding: 40px 30px;
              }

              .section {
                margin-bottom: 40px;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                overflow: hidden;
                border: 1px solid #e5e7eb;
              }

              .section-header {
                background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                padding: 20px 25px;
                border-bottom: 2px solid #e5e7eb;
              }

              .section-title {
                font-size: 20px;
                font-weight: 700;
                color: #059669;
                display: flex;
                align-items: center;
                gap: 10px;
              }

              .section-body {
                padding: 25px;
              }

              /* Statistics Grid */
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 20px;
              }

              .stat-card {
                background: white;
                border-radius: 12px;
                padding: 25px 20px;
                text-align: center;
                border: 2px solid #e5e7eb;
                transition: all 0.3s ease;
              }

              .stat-card.primary {
                border-color: #059669;
                background: linear-gradient(135deg, #f0fdf4, #dcfce7);
              }

              .stat-card.success {
                border-color: #10b981;
                background: linear-gradient(135deg, #f0fdf4, #dcfce7);
              }

              .stat-card.warning {
                border-color: #d97706;
                background: linear-gradient(135deg, #fffbeb, #fef3c7);
              }

              .stat-card.info {
                border-color: #2563eb;
                background: linear-gradient(135deg, #eff6ff, #dbeafe);
              }

              .stat-number {
                font-size: 32px;
                font-weight: 800;
                margin-bottom: 8px;
              }

              .stat-number.primary { color: #059669; }
              .stat-number.success { color: #10b981; }
              .stat-number.warning { color: #d97706; }
              .stat-number.info { color: #2563eb; }

              .stat-label {
                font-size: 14px;
                font-weight: 600;
                opacity: 0.8;
              }

              /* Professional Table */
              .professional-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }

              .professional-table thead {
                background: linear-gradient(135deg, #059669, #10b981);
                color: white;
              }

              .professional-table th {
                padding: 18px 15px;
                text-align: right;
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .professional-table td {
                padding: 15px;
                text-align: right;
                border-bottom: 1px solid #e5e7eb;
                font-size: 13px;
              }

              .professional-table tbody tr:hover {
                background-color: #f8fafc;
              }

              .professional-table tbody tr:nth-child(even) {
                background-color: #fafbfc;
              }

              /* Badges */
              .badge {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .badge.default {
                background: #d1fae5;
                color: #059669;
                border: 1px solid #10b981;
              }

              .badge.secondary {
                background: #f3f4f6;
                color: #6b7280;
                border: 1px solid #d1d5db;
              }

              /* Footer */
              .report-footer {
                background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                padding: 30px;
                text-align: center;
                border-top: 3px solid #e5e7eb;
                margin-top: 40px;
              }

              .footer-content {
                max-width: 600px;
                margin: 0 auto;
              }

              .footer-title {
                font-size: 18px;
                font-weight: 700;
                color: #059669;
                margin-bottom: 15px;
              }

              .footer-text {
                font-size: 14px;
                color: #64748b;
                line-height: 1.6;
              }

              .confidentiality-notice {
                background: #fef3c7;
                border: 2px solid #f59e0b;
                border-radius: 8px;
                padding: 15px;
                margin-top: 20px;
                font-size: 12px;
                color: #92400e;
                font-weight: 600;
              }

              @media print {
                .no-print { display: none !important; }
                .report-container { box-shadow: none; }
                body { background: white !important; }
                .section { break-inside: avoid; }
                .professional-table { break-inside: avoid; }
              }

              @page {
                margin: 15mm;
                size: A4;
              }
            </style>
          </head>
          <body>
            <div class="report-container">
              <div class="report-header">
                <div class="header-content">
                  <div class="company-logo">📊</div>
                  <h1 class="report-title">التقرير الشهري</h1>
                  <p class="report-subtitle">${monthNames[month - 1]} ${year}</p>
                  <div class="report-meta">
                    <div class="meta-item">
                      <div class="meta-label">فترة التقرير</div>
                      <div class="meta-value">${monthNames[month - 1]} ${year}</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">تاريخ الإنشاء</div>
                      <div class="meta-value">${new Date().toLocaleDateString('ar-KW')}</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">نوع التقرير</div>
                      <div class="meta-value">تقرير شهري</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="report-content">
                ${content.innerHTML}
              </div>
              
              <div class="report-footer">
                <div class="footer-content">
                  <h3 class="footer-title">نظام المحاسبة المتقدم</h3>
                  <p class="footer-text">
                    هذا التقرير يحتوي على معلومات مالية حساسة ومخصص للاستخدام الداخلي فقط.
                    جميع البيانات تم استخراجها وفقاً لأعلى معايير الدقة والجودة.
                  </p>
                  <div class="confidentiality-notice">
                    <strong>إشعار السرية:</strong> هذا المستند سري ومخصص للاستخدام الداخلي فقط. 
                    يُمنع نشره أو توزيعه خارج نطاق الجهات المخولة.
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow?.document.close();
      printWindow?.print();
    }
  };

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2 no-print">
        <Button onClick={handlePrint} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          طباعة
        </Button>
        <Button onClick={handleDownload} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          تحميل
        </Button>
      </div>

      {/* Report Content */}
      <Card id="monthly-report">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            <Calendar className="w-6 h-6 inline-block ml-2" />
            التقرير الشهري - {monthNames[month - 1]} {year}
          </CardTitle>
          <p className="text-muted-foreground">
            تقرير شامل للقيود المحاسبية للشهر المحدد
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Section */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">ملخص عام</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold text-primary">{reportData?.entries.length || 0}</p>
                <p className="text-sm text-muted-foreground">إجمالي القيود</p>
              </div>
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold text-green-600">{reportData?.postedEntries || 0}</p>
                <p className="text-sm text-muted-foreground">قيود مرحلة</p>
              </div>
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold text-yellow-600">{reportData?.draftEntries || 0}</p>
                <p className="text-sm text-muted-foreground">مسودات</p>
              </div>
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold text-blue-600">
                  {Math.abs(reportData?.balance || 0).toFixed(3)} د.ك
                </p>
                <p className="text-sm text-muted-foreground">الرصيد</p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">الملخص المالي</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {(reportData?.totalDebit || 0).toFixed(3)} د.ك
                </p>
                <p className="text-sm text-green-700">إجمالي المدين</p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {(reportData?.totalCredit || 0).toFixed(3)} د.ك
                </p>
                <p className="text-sm text-blue-700">إجمالي الدائن</p>
              </div>
            </div>
          </div>

          {/* Entries List */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">قائمة القيود</h3>
            <div className="overflow-x-auto">
              <table className="report-table w-full">
                <thead>
                  <tr>
                    <th>رقم القيد</th>
                    <th>التاريخ</th>
                    <th>الوصف</th>
                    <th>المدين</th>
                    <th>الدائن</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.entries.slice(0, 20).map((entry: any) => (
                    <tr key={entry.id}>
                      <td>{entry.entry_number}</td>
                      <td>{formatDate(entry.entry_date)}</td>
                      <td>{entry.description}</td>
                      <td>{entry.total_debit.toFixed(3)} د.ك</td>
                      <td>{entry.total_credit.toFixed(3)} د.ك</td>
                      <td>
                        <Badge variant={entry.status === 'posted' ? 'default' : 'secondary'}>
                          {entry.status === 'posted' ? 'مرحل' : 'مسودة'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {reportData?.entries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        لا توجد قيود للشهر المحدد
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Report Footer */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            تم إنشاء التقرير في: {formatDateTime(new Date())}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};