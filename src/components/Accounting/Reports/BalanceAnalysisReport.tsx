import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Printer, TrendingUp, TrendingDown } from 'lucide-react';
import { accountingService } from '@/services/accountingService';
import { formatDateTime } from '@/lib/utils';

export const BalanceAnalysisReport: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const entries = await accountingService.getJournalEntries();
      
      // Group entries by reference type and calculate balances
      const accountBalances = new Map();
      
      entries.forEach(entry => {
        // Use entry data directly since details might not be available
        const entryBalance = entry.total_debit - entry.total_credit;
        const accountKey = entry.reference_type || 'general';
        
        if (!accountBalances.has(accountKey)) {
          accountBalances.set(accountKey, {
            account_name: entry.description || 'حساب عام',
            account_code: entry.entry_number,
            debit_total: 0,
            credit_total: 0,
            balance: 0,
            entries_count: 0
          });
        }
        
        const account = accountBalances.get(accountKey);
        account.debit_total += entry.total_debit;
        account.credit_total += entry.total_credit;
        account.balance = account.debit_total - account.credit_total;
        account.entries_count += 1;
      });

      const balanceData = Array.from(accountBalances.values())
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

      // Analysis metrics
      const totalAccounts = balanceData.length;
      const positiveBalances = balanceData.filter(acc => acc.balance > 0);
      const negativeBalances = balanceData.filter(acc => acc.balance < 0);
      const zeroBalances = balanceData.filter(acc => Math.abs(acc.balance) < 0.01);
      
      const totalPositiveBalance = positiveBalances.reduce((sum, acc) => sum + acc.balance, 0);
      const totalNegativeBalance = negativeBalances.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);

      setReportData({
        accounts: balanceData,
        totalAccounts,
        positiveBalances: positiveBalances.length,
        negativeBalances: negativeBalances.length,
        zeroBalances: zeroBalances.length,
        totalPositiveBalance,
        totalNegativeBalance,
        netBalance: totalPositiveBalance - totalNegativeBalance
      });
    } catch (error) {
      console.error('Error loading balance analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = document.getElementById('balance-analysis-report');
    if (content) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>تقرير تحليل الأرصدة - نظام المحاسبة المتقدم</title>
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
                background: linear-gradient(135deg, #7c3aed, #8b5cf6);
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
                color: #7c3aed;
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
                border-color: #7c3aed;
                background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
              }

              .stat-card.success {
                border-color: #10b981;
                background: linear-gradient(135deg, #f0fdf4, #dcfce7);
              }

              .stat-card.danger {
                border-color: #ef4444;
                background: linear-gradient(135deg, #fef2f2, #fee2e2);
              }

              .stat-card.secondary {
                border-color: #6b7280;
                background: linear-gradient(135deg, #f9fafb, #f3f4f6);
              }

              .stat-number {
                font-size: 32px;
                font-weight: 800;
                margin-bottom: 8px;
              }

              .stat-number.primary { color: #7c3aed; }
              .stat-number.success { color: #10b981; }
              .stat-number.danger { color: #ef4444; }
              .stat-number.secondary { color: #6b7280; }

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
                background: linear-gradient(135deg, #7c3aed, #8b5cf6);
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
                background: #dcfce7;
                color: #059669;
                border: 1px solid #10b981;
              }

              .badge.destructive {
                background: #fee2e2;
                color: #dc2626;
                border: 1px solid #ef4444;
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
                color: #7c3aed;
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
                  <div class="company-logo">📈</div>
                  <h1 class="report-title">تقرير تحليل الأرصدة</h1>
                  <p class="report-subtitle">تحليل شامل لأرصدة الحسابات وتوزيعها</p>
                  <div class="report-meta">
                    <div class="meta-item">
                      <div class="meta-label">تاريخ التقرير</div>
                      <div class="meta-value">${new Date().toLocaleDateString('ar-KW')}</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">نوع التحليل</div>
                      <div class="meta-value">تحليل شامل</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">حالة البيانات</div>
                      <div class="meta-value">محدثة</div>
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
                    هذا التقرير يوفر تحليلاً دقيقاً لأرصدة الحسابات ويساعد في اتخاذ القرارات المالية الصحيحة.
                    جميع البيانات معتمدة ومحققة وفقاً لأعلى معايير الجودة.
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
      <Card id="balance-analysis-report">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            <BarChart3 className="w-6 h-6 inline-block ml-2" />
            تحليل الأرصدة
          </CardTitle>
          <p className="text-muted-foreground">
            تحليل شامل لأرصدة الحسابات وتوزيعها
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Section */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">ملخص التحليل</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold text-primary">{reportData?.totalAccounts || 0}</p>
                <p className="text-sm text-muted-foreground">إجمالي الحسابات</p>
              </div>
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold text-green-600">{reportData?.positiveBalances || 0}</p>
                <p className="text-sm text-muted-foreground">أرصدة موجبة</p>
              </div>
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold text-red-600">{reportData?.negativeBalances || 0}</p>
                <p className="text-sm text-muted-foreground">أرصدة سالبة</p>
              </div>
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold text-gray-600">{reportData?.zeroBalances || 0}</p>
                <p className="text-sm text-muted-foreground">أرصدة صفر</p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">الملخص المالي</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {(reportData?.totalPositiveBalance || 0).toFixed(3)} د.ك
                </p>
                <p className="text-sm text-green-700">إجمالي الأرصدة الموجبة</p>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-lg">
                <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">
                  {(reportData?.totalNegativeBalance || 0).toFixed(3)} د.ك
                </p>
                <p className="text-sm text-red-700">إجمالي الأرصدة السالبة</p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">
                  {(reportData?.netBalance || 0).toFixed(3)} د.ك
                </p>
                <p className="text-sm text-blue-700">صافي الرصيد</p>
              </div>
            </div>
          </div>

          {/* Top Accounts by Balance */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">الحسابات الأعلى رصيداً</h3>
            <div className="overflow-x-auto">
              <table className="report-table w-full">
                <thead>
                  <tr>
                    <th>كود الحساب</th>
                    <th>اسم الحساب</th>
                    <th>إجمالي المدين</th>
                    <th>إجمالي الدائن</th>
                    <th>الرصيد</th>
                    <th>عدد القيود</th>
                    <th>النوع</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.accounts.slice(0, 20).map((account: any, index: number) => (
                    <tr key={index}>
                      <td>{account.account_code}</td>
                      <td>{account.account_name}</td>
                      <td>{account.debit_total.toFixed(3)} د.ك</td>
                      <td>{account.credit_total.toFixed(3)} د.ك</td>
                      <td className={account.balance > 0 ? 'text-green-600' : account.balance < 0 ? 'text-red-600' : ''}>
                        {account.balance.toFixed(3)} د.ك
                      </td>
                      <td>{account.entries_count}</td>
                      <td>
                        <Badge variant={account.balance > 0 ? 'default' : account.balance < 0 ? 'destructive' : 'secondary'}>
                          {account.balance > 0 ? 'مدين' : account.balance < 0 ? 'دائن' : 'متوازن'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {reportData?.accounts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        لا توجد بيانات حسابات
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Zero Balance Accounts */}
          {reportData?.zeroBalances > 0 && (
            <div className="report-section">
              <h3 className="text-lg font-semibold mb-4">الحسابات ذات الرصيد الصفر</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {reportData.accounts
                  .filter((acc: any) => Math.abs(acc.balance) < 0.01)
                  .slice(0, 15)
                  .map((account: any, index: number) => (
                    <div key={index} className="text-sm p-2 border rounded">
                      {account.account_code} - {account.account_name}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Report Footer */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            تم إنشاء التقرير في: {formatDateTime(new Date())}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};