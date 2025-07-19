import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Printer } from 'lucide-react';
import { accountingService } from '@/services/accountingService';

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
            <title>التقرير الشهري - ${month}/${year}</title>
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
                      <td>{new Date(entry.entry_date).toLocaleDateString('ar-SA')}</td>
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
            تم إنشاء التقرير في: {new Date().toLocaleDateString('ar-SA')} - {new Date().toLocaleTimeString('ar-SA')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};