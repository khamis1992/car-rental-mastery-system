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
            <title>تقرير الأداء - نظام المحاسبة المتقدم</title>
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
                background: linear-gradient(135deg, #ea580c, #f97316);
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
                color: #ea580c;
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
                border-color: #ea580c;
                background: linear-gradient(135deg, #fff7ed, #fed7aa);
              }

              .stat-card.success {
                border-color: #10b981;
                background: linear-gradient(135deg, #f0fdf4, #dcfce7);
              }

              .stat-card.info {
                border-color: #2563eb;
                background: linear-gradient(135deg, #eff6ff, #dbeafe);
              }

              .stat-card.warning {
                border-color: #d97706;
                background: linear-gradient(135deg, #fffbeb, #fef3c7);
              }

              .stat-number {
                font-size: 32px;
                font-weight: 800;
                margin-bottom: 8px;
              }

              .stat-number.primary { color: #ea580c; }
              .stat-number.success { color: #10b981; }
              .stat-number.info { color: #2563eb; }
              .stat-number.warning { color: #d97706; }

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
                background: linear-gradient(135deg, #ea580c, #f97316);
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

              .badge.outline {
                background: #fff;
                color: #ea580c;
                border: 1px solid #fed7aa;
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
                color: #ea580c;
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
                  <h1 class="report-title">تقرير الأداء</h1>
                  <p class="report-subtitle">تحليل أداء النظام المحاسبي والاتجاهات</p>
                  <div class="report-meta">
                    <div class="meta-item">
                      <div class="meta-label">تاريخ التقرير</div>
                      <div class="meta-value">${new Date().toLocaleDateString('ar-KW')}</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">نوع التقرير</div>
                      <div class="meta-value">تقرير أداء</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">فترة التحليل</div>
                      <div class="meta-value">30 يوم</div>
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
                    هذا التقرير يوفر تحليلاً شاملاً لأداء النظام المحاسبي ويساعد في تحسين الكفاءة والإنتاجية.
                    جميع المؤشرات محسوبة وفقاً لأحدث المعايير المحاسبية المعتمدة.
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