import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Download, Printer, Activity, Target, Clock } from 'lucide-react';
import { accountingService } from '@/services/accountingService';
import { formatDate, formatDateTime } from '@/lib/utils';

export const PerformanceReport: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const entries = await accountingService.getJournalEntries();
      
      // Current month analysis
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const currentMonthEntries = entries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      });

      // Previous month analysis
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const prevMonthEntries = entries.filter(entry => {
        const entryDate = new Date(entry.entry_date);
        return entryDate.getMonth() === prevMonth && entryDate.getFullYear() === prevYear;
      });

      // Calculate metrics
      const currentTotalValue = currentMonthEntries.reduce((sum, e) => sum + e.total_debit, 0);
      const prevTotalValue = prevMonthEntries.reduce((sum, e) => sum + e.total_debit, 0);
      const growthRate = prevTotalValue > 0 ? ((currentTotalValue - prevTotalValue) / prevTotalValue) * 100 : 0;

      const currentPostedEntries = currentMonthEntries.filter(e => e.status === 'posted').length;
      const currentDraftEntries = currentMonthEntries.filter(e => e.status === 'draft').length;
      const processingEfficiency = currentMonthEntries.length > 0 ? (currentPostedEntries / currentMonthEntries.length) * 100 : 0;

      // Entry trends by day
      const entryTrends = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayEntries = entries.filter(entry => {
          const entryDate = new Date(entry.entry_date);
          return entryDate.toDateString() === date.toDateString();
        });
        
        entryTrends.push({
          date: formatDate(date),
          count: dayEntries.length,
          value: dayEntries.reduce((sum, e) => sum + e.total_debit, 0)
        });
      }

      // Reference type analysis
      const referenceTypes = entries.reduce((acc, entry) => {
        const type = entry.reference_type || 'manual';
        if (!acc[type]) {
          acc[type] = { count: 0, value: 0 };
        }
        acc[type].count += 1;
        acc[type].value += entry.total_debit;
        return acc;
      }, {} as any);

      setReportData({
        currentMonth: {
          entries: currentMonthEntries.length,
          value: currentTotalValue,
          posted: currentPostedEntries,
          drafts: currentDraftEntries
        },
        previousMonth: {
          entries: prevMonthEntries.length,
          value: prevTotalValue
        },
        growthRate,
        processingEfficiency,
        entryTrends: entryTrends.reverse(),
        referenceTypes: Object.entries(referenceTypes).map(([type, data]: [string, any]) => ({
          type,
          count: data.count,
          value: data.value,
          percentage: (data.count / entries.length) * 100
        })).sort((a, b) => b.count - a.count)
      });
    } catch (error) {
      console.error('Error loading performance report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = document.getElementById('performance-report');
    if (content) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>تقرير الأداء</title>
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

  const getReferenceTypeLabel = (type: string) => {
    const labels = {
      manual: 'يدوي',
      invoice: 'فاتورة',
      contract: 'عقد',
      payment: 'دفعة',
      expense_voucher: 'سند مصروف'
    };
    return labels[type as keyof typeof labels] || type;
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
      <Card id="performance-report">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            <TrendingUp className="w-6 h-6 inline-block ml-2" />
            تقرير الأداء
          </CardTitle>
          <p className="text-muted-foreground">
            تحليل أداء النظام المحاسبي والاتجاهات
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Performance Metrics */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">مؤشرات الأداء الرئيسية</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded bg-blue-50">
                <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{reportData?.currentMonth.entries || 0}</p>
                <p className="text-sm text-blue-700">قيود هذا الشهر</p>
              </div>
              <div className="text-center p-4 border rounded bg-green-50">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {reportData?.growthRate ? (reportData.growthRate > 0 ? '+' : '') + reportData.growthRate.toFixed(1) + '%' : '0%'}
                </p>
                <p className="text-sm text-green-700">معدل النمو</p>
              </div>
              <div className="text-center p-4 border rounded bg-purple-50">
                <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">
                  {reportData?.processingEfficiency?.toFixed(1) || 0}%
                </p>
                <p className="text-sm text-purple-700">كفاءة المعالجة</p>
              </div>
              <div className="text-center p-4 border rounded bg-orange-50">
                <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">{reportData?.currentMonth.drafts || 0}</p>
                <p className="text-sm text-orange-700">قيود معلقة</p>
              </div>
            </div>
          </div>

          {/* Monthly Comparison */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">مقارنة شهرية</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 border rounded">
                <h4 className="text-lg font-medium mb-4">الشهر الحالي</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">عدد القيود:</span> {reportData?.currentMonth.entries}</p>
                  <p><span className="font-medium">القيمة الإجمالية:</span> {(reportData?.currentMonth.value || 0).toFixed(3)} د.ك</p>
                  <p><span className="font-medium">قيود مرحلة:</span> {reportData?.currentMonth.posted}</p>
                  <p><span className="font-medium">مسودات:</span> {reportData?.currentMonth.drafts}</p>
                </div>
              </div>
              <div className="text-center p-6 border rounded bg-muted/30">
                <h4 className="text-lg font-medium mb-4">الشهر السابق</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">عدد القيود:</span> {reportData?.previousMonth.entries}</p>
                  <p><span className="font-medium">القيمة الإجمالية:</span> {(reportData?.previousMonth.value || 0).toFixed(3)} د.ك</p>
                  <p className="text-sm text-muted-foreground mt-4">
                    للمقارنة مع الأداء الحالي
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Entry Trends */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">اتجاهات القيود (آخر 10 أيام)</h3>
            <div className="overflow-x-auto">
              <table className="report-table w-full">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>عدد القيود</th>
                    <th>إجمالي القيمة</th>
                    <th>متوسط القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.entryTrends.slice(-10).map((trend: any, index: number) => (
                    <tr key={index}>
                      <td>{trend.date}</td>
                      <td>{trend.count}</td>
                      <td>{trend.value.toFixed(3)} د.ك</td>
                      <td>{trend.count > 0 ? (trend.value / trend.count).toFixed(3) : '0.000'} د.ك</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reference Types Analysis */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">تحليل أنواع القيود</h3>
            <div className="overflow-x-auto">
              <table className="report-table w-full">
                <thead>
                  <tr>
                    <th>نوع القيد</th>
                    <th>العدد</th>
                    <th>النسبة المئوية</th>
                    <th>إجمالي القيمة</th>
                    <th>متوسط القيمة</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.referenceTypes.map((refType: any, index: number) => (
                    <tr key={index}>
                      <td>
                        <Badge variant="outline">
                          {getReferenceTypeLabel(refType.type)}
                        </Badge>
                      </td>
                      <td>{refType.count}</td>
                      <td>{refType.percentage.toFixed(1)}%</td>
                      <td>{refType.value.toFixed(3)} د.ك</td>
                      <td>{(refType.value / refType.count).toFixed(3)} د.ك</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">التوصيات</h3>
            <div className="space-y-3">
              {reportData?.processingEfficiency < 80 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm">⚠️ كفاءة المعالجة أقل من 80%. يُنصح بمراجعة القيود المعلقة.</p>
                </div>
              )}
              {reportData?.growthRate < 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm">📉 انخفاض في عدد القيود مقارنة بالشهر السابق. مراجعة النشاط المحاسبي مطلوبة.</p>
                </div>
              )}
              {reportData?.currentMonth.drafts > (reportData?.currentMonth.entries * 0.3) && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-sm">⏳ عدد كبير من المسودات. يُنصح بمراجعة وترحيل القيود المعلقة.</p>
                </div>
              )}
              {reportData?.processingEfficiency >= 80 && reportData?.growthRate >= 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm">✅ الأداء جيد. النظام يعمل بكفاءة عالية.</p>
                </div>
              )}
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