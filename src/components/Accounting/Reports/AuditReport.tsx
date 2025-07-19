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