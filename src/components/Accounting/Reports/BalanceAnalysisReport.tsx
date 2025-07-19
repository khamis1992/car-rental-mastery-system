import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, Printer, TrendingUp, TrendingDown } from 'lucide-react';
import { accountingService } from '@/services/accountingService';

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
            <title>تحليل الأرصدة</title>
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; }
              .report-header { text-align: center; margin-bottom: 20px; }
              .report-section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; }
              .report-table { width: 100%; border-collapse: collapse; }
              .report-table th, .report-table td { border: 1px solid #ddd; padding: 8px; text-align: right; }
              .report-table th { background-color: #f5f5f5; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>${content.innerHTML}</body>
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
            تم إنشاء التقرير في: {new Date().toLocaleDateString('ar-SA')} - {new Date().toLocaleTimeString('ar-SA')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};