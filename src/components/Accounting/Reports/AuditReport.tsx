import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Printer, AlertTriangle, Shield, Eye } from 'lucide-react';
import { accountingService } from '@/services/accountingService';
import { formatDateTime } from '@/lib/utils';

export const AuditReport: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const entries = await accountingService.getJournalEntries();
      
      // Audit checks
      const auditChecks = {
        balanceCheck: {
          name: 'فحص توازن القيود',
          passed: 0,
          failed: 0,
          issues: [] as any[]
        },
        duplicateCheck: {
          name: 'فحص القيود المكررة',
          passed: 0,
          failed: 0,
          issues: [] as any[]
        },
        dateCheck: {
          name: 'فحص صحة التواريخ',
          passed: 0,
          failed: 0,
          issues: [] as any[]
        },
        amountCheck: {
          name: 'فحص صحة المبالغ',
          passed: 0,
          failed: 0,
          issues: [] as any[]
        },
        statusCheck: {
          name: 'فحص حالة القيود',
          passed: 0,
          failed: 0,
          issues: [] as any[]
        }
      };

      // Check balance for each entry
      entries.forEach(entry => {
        const diff = Math.abs(entry.total_debit - entry.total_credit);
        if (diff > 0.01) {
          auditChecks.balanceCheck.failed++;
          auditChecks.balanceCheck.issues.push({
            id: entry.id,
            entry_number: entry.entry_number,
            issue: `فرق في الرصيد: ${diff.toFixed(3)} د.ك`,
            severity: 'critical'
          });
        } else {
          auditChecks.balanceCheck.passed++;
        }

        // Check for negative amounts
        if (entry.total_debit < 0 || entry.total_credit < 0) {
          auditChecks.amountCheck.failed++;
          auditChecks.amountCheck.issues.push({
            id: entry.id,
            entry_number: entry.entry_number,
            issue: 'مبلغ سالب غير صحيح',
            severity: 'high'
          });
        } else {
          auditChecks.amountCheck.passed++;
        }

        // Check entry date
        const entryDate = new Date(entry.entry_date);
        const currentDate = new Date();
        if (entryDate > currentDate) {
          auditChecks.dateCheck.failed++;
          auditChecks.dateCheck.issues.push({
            id: entry.id,
            entry_number: entry.entry_number,
            issue: 'تاريخ مستقبلي غير صحيح',
            severity: 'medium'
          });
        } else {
          auditChecks.dateCheck.passed++;
        }

        // Check status consistency
        if (!entry.status || !['draft', 'posted', 'cancelled'].includes(entry.status)) {
          auditChecks.statusCheck.failed++;
          auditChecks.statusCheck.issues.push({
            id: entry.id,
            entry_number: entry.entry_number,
            issue: 'حالة قيد غير صحيحة',
            severity: 'medium'
          });
        } else {
          auditChecks.statusCheck.passed++;
        }
      });

      // Check for duplicates
      const duplicates = new Map();
      entries.forEach(entry => {
        const key = `${entry.entry_date}-${entry.total_debit}-${entry.total_credit}-${entry.description}`;
        if (duplicates.has(key)) {
          const existing = duplicates.get(key);
          auditChecks.duplicateCheck.failed++;
          auditChecks.duplicateCheck.issues.push({
            id: entry.id,
            entry_number: entry.entry_number,
            issue: `قيد مكرر مع ${existing.entry_number}`,
            severity: 'medium'
          });
        } else {
          duplicates.set(key, entry);
          auditChecks.duplicateCheck.passed++;
        }
      });

      // Calculate overall scores
      const totalChecks = Object.values(auditChecks).reduce((sum, check) => sum + check.passed + check.failed, 0);
      const totalPassed = Object.values(auditChecks).reduce((sum, check) => sum + check.passed, 0);
      const overallScore = totalChecks > 0 ? (totalPassed / totalChecks) * 100 : 100;

      // Critical issues
      const criticalIssues = Object.values(auditChecks)
        .flatMap(check => check.issues)
        .filter(issue => issue.severity === 'critical');

      const highIssues = Object.values(auditChecks)
        .flatMap(check => check.issues)
        .filter(issue => issue.severity === 'high');

      const mediumIssues = Object.values(auditChecks)
        .flatMap(check => check.issues)
        .filter(issue => issue.severity === 'medium');

      setReportData({
        auditChecks,
        overallScore,
        totalEntries: entries.length,
        totalIssues: criticalIssues.length + highIssues.length + mediumIssues.length,
        criticalIssues,
        highIssues,
        mediumIssues,
        auditDate: new Date(),
        recommendations: generateRecommendations(auditChecks, overallScore)
      });
    } catch (error) {
      console.error('Error loading audit report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = (checks: any, score: number) => {
    const recommendations = [];

    if (checks.balanceCheck.failed > 0) {
      recommendations.push({
        type: 'critical',
        title: 'قيود غير متوازنة',
        description: 'يجب مراجعة وتصحيح القيود غير المتوازنة فوراً',
        action: 'مراجعة فورية مطلوبة'
      });
    }

    if (checks.duplicateCheck.failed > 0) {
      recommendations.push({
        type: 'medium',
        title: 'قيود مكررة',
        description: 'مراجعة القيود المكررة وحذف غير الضروري منها',
        action: 'مراجعة وتنظيف'
      });
    }

    if (checks.statusCheck.failed > 0) {
      recommendations.push({
        type: 'medium',
        title: 'حالات قيود غير صحيحة',
        description: 'تحديث حالات القيود للقيم المناسبة',
        action: 'تحديث الحالات'
      });
    }

    if (score >= 95) {
      recommendations.push({
        type: 'success',
        title: 'جودة عالية',
        description: 'النظام المحاسبي يعمل بجودة عالية',
        action: 'مواصلة المراقبة الدورية'
      });
    }

    return recommendations;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = document.getElementById('audit-report');
    if (content) {
      const printWindow = window.open('', '_blank');
      printWindow?.document.write(`
        <html>
          <head>
            <title>تقرير المراجعة الداخلية - نظام المحاسبة المتقدم</title>
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
                background: linear-gradient(135deg, #1e40af, #3b82f6);
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
                color: #1e40af;
                display: flex;
                align-items: center;
                gap: 10px;
              }

              .section-body {
                padding: 25px;
              }

              /* Score Display */
              .score-display {
                text-align: center;
                padding: 30px;
                background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
                border-radius: 20px;
                margin-bottom: 30px;
                border: 2px solid #0ea5e9;
              }

              .score-number {
                font-size: 72px;
                font-weight: 800;
                margin-bottom: 10px;
                background: linear-gradient(135deg, #0ea5e9, #3b82f6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
              }

              .score-label {
                font-size: 16px;
                color: #64748b;
                font-weight: 500;
              }

              /* Statistics Grid */
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-top: 30px;
              }

              .stat-card {
                background: white;
                border-radius: 12px;
                padding: 25px 20px;
                text-align: center;
                border: 2px solid #e5e7eb;
                transition: all 0.3s ease;
              }

              .stat-card.critical {
                border-color: #ef4444;
                background: linear-gradient(135deg, #fef2f2, #fee2e2);
              }

              .stat-card.warning {
                border-color: #f59e0b;
                background: linear-gradient(135deg, #fffbeb, #fef3c7);
              }

              .stat-card.info {
                border-color: #3b82f6;
                background: linear-gradient(135deg, #eff6ff, #dbeafe);
              }

              .stat-number {
                font-size: 36px;
                font-weight: 800;
                margin-bottom: 8px;
              }

              .stat-number.critical { color: #dc2626; }
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
                background: linear-gradient(135deg, #1e40af, #3b82f6);
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

              .badge.critical {
                background: #fecaca;
                color: #dc2626;
                border: 1px solid #f87171;
              }

              .badge.warning {
                background: #fed7aa;
                color: #ea580c;
                border: 1px solid #fb923c;
              }

              .badge.info {
                background: #bfdbfe;
                color: #1d4ed8;
                border: 1px solid #60a5fa;
              }

              .badge.success {
                background: #bbf7d0;
                color: #059669;
                border: 1px solid #34d399;
              }

              /* Recommendations */
              .recommendation-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 15px;
                border-left: 5px solid #3b82f6;
                box-shadow: 0 2px 4px rgba(0,0,0,0.06);
              }

              .recommendation-card.critical {
                border-left-color: #ef4444;
                background: linear-gradient(135deg, #fef2f2, #ffffff);
              }

              .recommendation-card.warning {
                border-left-color: #f59e0b;
                background: linear-gradient(135deg, #fffbeb, #ffffff);
              }

              .recommendation-card.success {
                border-left-color: #10b981;
                background: linear-gradient(135deg, #f0fdf4, #ffffff);
              }

              .recommendation-title {
                font-size: 16px;
                font-weight: 700;
                margin-bottom: 8px;
                color: #1f2937;
              }

              .recommendation-desc {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 12px;
                line-height: 1.5;
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
                color: #1e40af;
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

              /* Check Items */
              .check-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px;
                background: white;
                border-radius: 10px;
                margin-bottom: 12px;
                border: 1px solid #e5e7eb;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
              }

              .check-info {
                display: flex;
                align-items: center;
                gap: 15px;
              }

              .check-status {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                flex-shrink: 0;
              }

              .check-status.success { background: #10b981; }
              .check-status.error { background: #ef4444; }

              .check-details h4 {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 4px;
              }

              .check-details p {
                font-size: 13px;
                color: #6b7280;
              }

              .check-score {
                text-align: left;
                font-size: 24px;
                font-weight: 800;
                color: #1e40af;
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
                  <div class="company-logo">🛡️</div>
                  <h1 class="report-title">تقرير المراجعة الداخلية</h1>
                  <p class="report-subtitle">تحليل شامل لسلامة وصحة النظام المحاسبي</p>
                  <div class="report-meta">
                    <div class="meta-item">
                      <div class="meta-label">تاريخ التقرير</div>
                      <div class="meta-value">${new Date().toLocaleDateString('ar-KW')}</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">نوع المراجعة</div>
                      <div class="meta-value">مراجعة شاملة</div>
                    </div>
                    <div class="meta-item">
                      <div class="meta-label">حالة النظام</div>
                      <div class="meta-value">${reportData?.overallScore >= 95 ? 'ممتاز' : reportData?.overallScore >= 80 ? 'جيد' : 'يحتاج تحسين'}</div>
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
                    هذا التقرير تم إنشاؤه تلقائياً بواسطة نظام المراجعة الداخلية المتقدم.
                    يُنصح بمراجعة دورية شهرية للحفاظ على أعلى معايير الجودة والامتثال.
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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">حرج</Badge>;
      case 'high':
        return <Badge variant="destructive">عالي</Badge>;
      case 'medium':
        return <Badge variant="outline">متوسط</Badge>;
      default:
        return <Badge variant="secondary">منخفض</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
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
      <Card id="audit-report">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            <Shield className="w-6 h-6 inline-block ml-2" />
            تقرير المراجعة
          </CardTitle>
          <p className="text-muted-foreground">
            تقرير شامل لمراجعة سلامة وصحة القيود المحاسبية
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="report-section text-center">
            <h3 className="text-lg font-semibold mb-4">النتيجة الإجمالية</h3>
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(reportData?.overallScore || 0)}`}>
              {(reportData?.overallScore || 0).toFixed(1)}%
            </div>
            <p className="text-muted-foreground">
              من أصل {reportData?.totalEntries || 0} قيد محاسبي
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold text-red-600">{reportData?.criticalIssues.length || 0}</p>
                <p className="text-sm text-red-700">مشاكل حرجة</p>
              </div>
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold text-yellow-600">{reportData?.highIssues.length || 0}</p>
                <p className="text-sm text-yellow-700">مشاكل عالية</p>
              </div>
              <div className="text-center p-4 border rounded">
                <p className="text-2xl font-bold text-blue-600">{reportData?.mediumIssues.length || 0}</p>
                <p className="text-sm text-blue-700">مشاكل متوسطة</p>
              </div>
            </div>
          </div>

          {/* Audit Checks Summary */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">ملخص الفحوصات</h3>
            <div className="space-y-4">
              {Object.entries(reportData?.auditChecks || {}).map(([key, check]: [string, any]) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${check.failed === 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <div>
                      <p className="font-medium">{check.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {check.passed} نجح، {check.failed} فشل
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {check.passed + check.failed > 0 ? ((check.passed / (check.passed + check.failed)) * 100).toFixed(0) : 100}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Issues */}
          {reportData?.criticalIssues.length > 0 && (
            <div className="report-section">
              <h3 className="text-lg font-semibold mb-4 text-red-600">
                <AlertTriangle className="w-5 h-5 inline-block ml-2" />
                مشاكل حرجة
              </h3>
              <div className="overflow-x-auto">
                <table className="report-table w-full">
                  <thead>
                    <tr>
                      <th>رقم القيد</th>
                      <th>المشكلة</th>
                      <th>الخطورة</th>
                      <th>إجراء مطلوب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.criticalIssues.map((issue: any, index: number) => (
                      <tr key={index}>
                        <td>{issue.entry_number}</td>
                        <td>{issue.issue}</td>
                        <td>{getSeverityBadge(issue.severity)}</td>
                        <td>
                          <Badge variant="destructive">فوري</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* All Issues */}
          {reportData?.totalIssues > 0 && (
            <div className="report-section">
              <h3 className="text-lg font-semibold mb-4">جميع المشاكل المكتشفة</h3>
              <div className="overflow-x-auto">
                <table className="report-table w-full">
                  <thead>
                    <tr>
                      <th>رقم القيد</th>
                      <th>المشكلة</th>
                      <th>الخطورة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...reportData.criticalIssues, ...reportData.highIssues, ...reportData.mediumIssues]
                      .slice(0, 20)
                      .map((issue: any, index: number) => (
                        <tr key={index}>
                          <td>{issue.entry_number}</td>
                          <td>{issue.issue}</td>
                          <td>{getSeverityBadge(issue.severity)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {reportData.totalIssues > 20 && (
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  وهناك {reportData.totalIssues - 20} مشكلة أخرى...
                </p>
              )}
            </div>
          )}

          {/* Recommendations */}
          <div className="report-section">
            <h3 className="text-lg font-semibold mb-4">التوصيات</h3>
            <div className="space-y-3">
              {reportData?.recommendations.map((rec: any, index: number) => (
                <div key={index} className={`p-4 border rounded ${
                  rec.type === 'critical' ? 'bg-red-50 border-red-200' :
                  rec.type === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  <h4 className="font-semibold">{rec.title}</h4>
                  <p className="text-sm mt-1">{rec.description}</p>
                  <Badge variant="outline" className="mt-2">{rec.action}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Report Footer */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Eye className="w-4 h-4" />
              <span>تم إجراء المراجعة في: {formatDateTime(reportData?.auditDate)}</span>
            </div>
            <p>يُنصح بإجراء مراجعة دورية كل شهر للحفاظ على سلامة البيانات المحاسبية</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};