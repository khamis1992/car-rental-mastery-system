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
            <title>تقرير المراجعة</title>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');
              
              body { 
                font-family: 'Noto Sans Arabic', Arial, sans-serif; 
                direction: rtl; 
                margin: 0;
                padding: 20px;
                background: #ffffff;
                color: #1a1a1a;
                line-height: 1.6;
              }
              
              .report-header { 
                text-align: center; 
                margin-bottom: 40px; 
                padding: 30px 0;
                border-bottom: 3px solid #2563eb;
                position: relative;
              }
              
              .report-header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 8px;
                background: linear-gradient(90deg, #2563eb, #1d4ed8, #2563eb);
              }
              
              .report-title {
                font-size: 28px;
                font-weight: 700;
                color: #1e40af;
                margin-bottom: 8px;
              }
              
              .report-subtitle {
                font-size: 16px;
                color: #64748b;
                margin-bottom: 20px;
              }
              
              .report-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f8fafc;
                padding: 15px 20px;
                border-radius: 8px;
                margin-top: 20px;
              }
              
              .company-info {
                text-align: right;
              }
              
              .company-name {
                font-size: 18px;
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 4px;
              }
              
              .company-details {
                font-size: 14px;
                color: #64748b;
              }
              
              .report-date {
                text-align: left;
                font-size: 14px;
                color: #64748b;
              }
              
              .report-section { 
                margin-bottom: 35px; 
                padding: 25px;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                background: #ffffff;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
                page-break-inside: avoid;
              }
              
              .section-title {
                font-size: 20px;
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e2e8f0;
              }
              
              .report-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 15px;
                font-size: 13px;
              }
              
              .report-table th { 
                background: linear-gradient(135deg, #2563eb, #1d4ed8);
                color: white;
                font-weight: 600;
                padding: 12px 8px;
                text-align: center;
                border: none;
                font-size: 14px;
              }
              
              .report-table th:first-child {
                border-top-right-radius: 8px;
              }
              
              .report-table th:last-child {
                border-top-left-radius: 8px;
              }
              
              .report-table td { 
                padding: 10px 8px;
                text-align: center;
                border-bottom: 1px solid #e2e8f0;
                vertical-align: middle;
              }
              
              .report-table tbody tr:hover {
                background-color: #f8fafc;
              }
              
              .report-table tbody tr:last-child td {
                border-bottom: none;
              }
              
              .score-display {
                text-align: center;
                margin: 30px 0;
                padding: 40px;
                background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
                border-radius: 16px;
                border: 2px solid #0ea5e9;
              }
              
              .score-number {
                font-size: 48px;
                font-weight: 700;
                margin-bottom: 10px;
              }
              
              .score-excellent { color: #059669; }
              .score-good { color: #d97706; }
              .score-poor { color: #dc2626; }
              
              .score-description {
                font-size: 16px;
                color: #64748b;
                margin-bottom: 25px;
              }
              
              .metrics-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-top: 20px;
              }
              
              .metric-card {
                text-align: center;
                padding: 20px;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                background: #ffffff;
              }
              
              .metric-number {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 8px;
              }
              
              .metric-critical { color: #dc2626; }
              .metric-high { color: #d97706; }
              .metric-medium { color: #2563eb; }
              
              .metric-label {
                font-size: 12px;
                color: #64748b;
              }
              
              .audit-checks {
                display: grid;
                gap: 15px;
              }
              
              .audit-check-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 20px;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                background: #ffffff;
              }
              
              .check-info {
                display: flex;
                align-items: center;
                gap: 15px;
              }
              
              .check-status {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                flex-shrink: 0;
              }
              
              .check-success { background-color: #059669; }
              .check-failed { background-color: #dc2626; }
              
              .check-details h4 {
                font-weight: 600;
                margin: 0 0 4px 0;
                color: #1e40af;
              }
              
              .check-stats {
                font-size: 12px;
                color: #64748b;
                margin: 0;
              }
              
              .check-percentage {
                font-size: 24px;
                font-weight: 700;
                color: #1e40af;
              }
              
              .recommendations {
                background: #fefce8;
                border: 1px solid #facc15;
                border-radius: 12px;
                padding: 25px;
              }
              
              .recommendation-item {
                margin-bottom: 15px;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid;
              }
              
              .rec-critical { 
                background: #fef2f2; 
                border-left-color: #dc2626; 
              }
              
              .rec-medium { 
                background: #fffbeb; 
                border-left-color: #d97706; 
              }
              
              .rec-success { 
                background: #f0fdf4; 
                border-left-color: #059669; 
              }
              
              .rec-title {
                font-weight: 600;
                margin-bottom: 5px;
              }
              
              .rec-description {
                font-size: 13px;
                color: #64748b;
                margin-bottom: 8px;
              }
              
              .rec-action {
                display: inline-block;
                background: #f1f5f9;
                color: #475569;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
              }
              
              .report-footer {
                text-align: center;
                margin-top: 50px;
                padding-top: 30px;
                border-top: 2px solid #e2e8f0;
                font-size: 12px;
                color: #64748b;
              }
              
              .footer-logo {
                font-size: 16px;
                font-weight: 600;
                color: #1e40af;
                margin-bottom: 10px;
              }
              
              .badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
              }
              
              .badge-critical { background: #fecaca; color: #991b1b; }
              .badge-high { background: #fed7aa; color: #9a3412; }
              .badge-medium { background: #dbeafe; color: #1e40af; }
              
              @media print { 
                body { margin: 0; padding: 15px; }
                .no-print { display: none !important; }
                .report-section { page-break-inside: avoid; }
                .score-display { page-break-inside: avoid; }
                h3 { page-break-after: avoid; }
              }
            </style>
          </head>
          <body>${content.innerHTML}</body>
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
        <div className="report-header">
          <h1 className="report-title">
            <Shield className="w-8 h-8 inline-block ml-3" />
            تقرير المراجعة المحاسبية
          </h1>
          <p className="report-subtitle">
            تقرير شامل لمراجعة سلامة وصحة القيود المحاسبية
          </p>
          <div className="report-meta">
            <div className="company-info">
              <div className="company-name">نظام بشائر المحاسبي</div>
              <div className="company-details">دولة الكويت • النظام المحاسبي المتكامل</div>
            </div>
            <div className="report-date">
              <div>تاريخ التقرير</div>
              <div style={{ fontWeight: '600', color: '#1e40af' }}>{formatDateTime(reportData?.auditDate)}</div>
            </div>
          </div>
        </div>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div className="score-display">
            <h3 className="section-title" style={{ borderBottom: 'none', marginBottom: '15px' }}>النتيجة الإجمالية للمراجعة</h3>
            <div className={`score-number ${
              (reportData?.overallScore || 0) >= 95 ? 'score-excellent' : 
              (reportData?.overallScore || 0) >= 80 ? 'score-good' : 'score-poor'
            }`}>
              {(reportData?.overallScore || 0).toFixed(1)}%
            </div>
            <p className="score-description">
              نتيجة فحص {reportData?.totalEntries || 0} قيد محاسبي
            </p>
            <div className="metrics-grid">
              <div className="metric-card">
                <p className="metric-number metric-critical">{reportData?.criticalIssues.length || 0}</p>
                <p className="metric-label">مشاكل حرجة</p>
              </div>
              <div className="metric-card">
                <p className="metric-number metric-high">{reportData?.highIssues.length || 0}</p>
                <p className="metric-label">مشاكل عالية</p>
              </div>
              <div className="metric-card">
                <p className="metric-number metric-medium">{reportData?.mediumIssues.length || 0}</p>
                <p className="metric-label">مشاكل متوسطة</p>
              </div>
            </div>
          </div>

          {/* Audit Checks Summary */}
          <div className="report-section">
            <h3 className="section-title">ملخص فحوصات المراجعة</h3>
            <div className="audit-checks">
              {Object.entries(reportData?.auditChecks || {}).map(([key, check]: [string, any]) => (
                <div key={key} className="audit-check-item">
                  <div className="check-info">
                    <div className={`check-status ${check.failed === 0 ? 'check-success' : 'check-failed'}`}></div>
                    <div className="check-details">
                      <h4>{check.name}</h4>
                      <p className="check-stats">
                        {check.passed} نجح • {check.failed} فشل
                      </p>
                    </div>
                  </div>
                  <div className="check-percentage">
                    {check.passed + check.failed > 0 ? ((check.passed / (check.passed + check.failed)) * 100).toFixed(0) : 100}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Issues */}
          {reportData?.criticalIssues.length > 0 && (
            <div className="report-section">
              <h3 className="section-title" style={{ color: '#dc2626' }}>
                <AlertTriangle className="w-6 h-6 inline-block ml-2" />
                المشاكل الحرجة التي تتطلب إجراءً فورياً
              </h3>
              <div className="overflow-x-auto">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>رقم القيد</th>
                      <th>وصف المشكلة</th>
                      <th>مستوى الخطورة</th>
                      <th>الإجراء المطلوب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.criticalIssues.map((issue: any, index: number) => (
                      <tr key={index}>
                        <td style={{ fontWeight: '600' }}>{issue.entry_number}</td>
                        <td>{issue.issue}</td>
                        <td><span className="badge badge-critical">حرج</span></td>
                        <td><span className="badge badge-critical">فوري</span></td>
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
              <h3 className="section-title">جميع المشاكل المكتشفة</h3>
              <div className="overflow-x-auto">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>رقم القيد</th>
                      <th>وصف المشكلة</th>
                      <th>مستوى الخطورة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...reportData.criticalIssues, ...reportData.highIssues, ...reportData.mediumIssues]
                      .slice(0, 20)
                      .map((issue: any, index: number) => (
                        <tr key={index}>
                          <td style={{ fontWeight: '600' }}>{issue.entry_number}</td>
                          <td>{issue.issue}</td>
                          <td>
                            <span className={`badge ${
                              issue.severity === 'critical' ? 'badge-critical' :
                              issue.severity === 'high' ? 'badge-high' : 'badge-medium'
                            }`}>
                              {issue.severity === 'critical' ? 'حرج' :
                               issue.severity === 'high' ? 'عالي' : 'متوسط'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {reportData.totalIssues > 20 && (
                <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '13px', color: '#64748b' }}>
                  وهناك {reportData.totalIssues - 20} مشكلة أخرى تتطلب المراجعة...
                </p>
              )}
            </div>
          )}

          {/* Recommendations */}
          <div className="recommendations">
            <h3 className="section-title" style={{ color: '#d97706' }}>التوصيات والإجراءات المقترحة</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {reportData?.recommendations.map((rec: any, index: number) => (
                <div key={index} className={`recommendation-item ${
                  rec.type === 'critical' ? 'rec-critical' :
                  rec.type === 'medium' ? 'rec-medium' :
                  'rec-success'
                }`}>
                  <h4 className="rec-title">{rec.title}</h4>
                  <p className="rec-description">{rec.description}</p>
                  <span className="rec-action">{rec.action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Report Footer */}
          <div className="report-footer">
            <div className="footer-logo">نظام بشائر المحاسبي</div>
            <div style={{ marginBottom: '10px' }}>
              <Eye className="w-4 h-4 inline-block ml-1" />
              تم إجراء المراجعة في: {formatDateTime(reportData?.auditDate)}
            </div>
            <p>يُنصح بإجراء مراجعة دورية كل شهر للحفاظ على سلامة البيانات المحاسبية</p>
            <p style={{ marginTop: '10px', fontSize: '11px' }}>
              هذا التقرير تم إنشاؤه تلقائياً بواسطة نظام بشائر المحاسبي المتكامل
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};