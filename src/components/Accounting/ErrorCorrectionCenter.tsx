
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Search,
  RefreshCw,
  FileText
} from 'lucide-react';

interface CorrectionIssue {
  id: string;
  type: 'duplicate' | 'unbalanced' | 'missing' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_entries: string[];
  status: 'detected' | 'reviewing' | 'fixed' | 'ignored';
  detected_at: string;
}

export const ErrorCorrectionCenter: React.FC = () => {
  const [issues, setIssues] = useState<CorrectionIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = () => {
    // محاكاة تحميل المشاكل المكتشفة
    const mockIssues: CorrectionIssue[] = [
      {
        id: '1',
        type: 'duplicate',
        severity: 'medium',
        description: 'تم اكتشاف قيود مكررة في الفترة الحالية',
        affected_entries: ['JE-2024-001', 'JE-2024-002'],
        status: 'detected',
        detected_at: new Date().toISOString()
      },
      {
        id: '2',
        type: 'unbalanced',
        severity: 'high',
        description: 'قيود غير متوازنة تحتاج مراجعة',
        affected_entries: ['JE-2024-003'],
        status: 'reviewing',
        detected_at: new Date().toISOString()
      },
      {
        id: '3',
        type: 'anomaly',
        severity: 'low',
        description: 'مبالغ استثنائية في حسابات المصروفات',
        affected_entries: ['JE-2024-004', 'JE-2024-005'],
        status: 'fixed',
        detected_at: new Date().toISOString()
      }
    ];
    
    setIssues(mockIssues);
  };

  const runScan = async () => {
    setScanning(true);
    console.log('Running error detection scan...');
    
    // محاكاة عملية الفحص
    setTimeout(() => {
      setScanning(false);
      loadIssues();
    }, 3000);
  };

  const updateIssueStatus = (issueId: string, newStatus: CorrectionIssue['status']) => {
    setIssues(prev => 
      prev.map(issue => 
        issue.id === issueId 
          ? { ...issue, status: newStatus }
          : issue
      )
    );
  };

  const getIssueIcon = (type: CorrectionIssue['type']) => {
    switch (type) {
      case 'duplicate':
        return <FileText className="w-4 h-4" />;
      case 'unbalanced':
        return <AlertTriangle className="w-4 h-4" />;
      case 'missing':
        return <XCircle className="w-4 h-4" />;
      case 'anomaly':
        return <Search className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: CorrectionIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: CorrectionIssue['status']) => {
    switch (status) {
      case 'detected':
        return 'destructive';
      case 'reviewing':
        return 'secondary';
      case 'fixed':
        return 'default';
      case 'ignored':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const issueTypeLabels = {
    duplicate: 'قيود مكررة',
    unbalanced: 'قيود غير متوازنة',
    missing: 'قيود ناقصة',
    anomaly: 'شذوذ في البيانات'
  };

  const severityLabels = {
    critical: 'حرج',
    high: 'عالي',
    medium: 'متوسط',
    low: 'منخفض'
  };

  const statusLabels = {
    detected: 'مكتشف',
    reviewing: 'قيد المراجعة',
    fixed: 'تم الإصلاح',
    ignored: 'تم تجاهله'
  };

  const stats = {
    total: issues.length,
    detected: issues.filter(i => i.status === 'detected').length,
    fixed: issues.filter(i => i.status === 'fixed').length,
    critical: issues.filter(i => i.severity === 'critical').length
  };

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">إجمالي المشاكل</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">مكتشفة حديثاً</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.detected}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">تم إصلاحها</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.fixed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium rtl-title">حرجة</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          </CardContent>
        </Card>
      </div>

      {/* أدوات التحكم */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="rtl-title">أدوات الكشف والتصحيح</CardTitle>
            <Button 
              onClick={runScan}
              disabled={scanning}
              className="rtl-flex"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري الفحص...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  تشغيل فحص شامل
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {scanning && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">جاري فحص القيود المحاسبية...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* قائمة المشاكل */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">المشاكل المكتشفة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {issues.length > 0 ? (
              issues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      {getIssueIcon(issue.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{issueTypeLabels[issue.type]}</h4>
                        <Badge variant={getSeverityColor(issue.severity) as any}>
                          {severityLabels[issue.severity]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {issue.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        القيود المتأثرة: {issue.affected_entries.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(issue.status) as any}>
                      {statusLabels[issue.status]}
                    </Badge>
                    {issue.status === 'detected' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateIssueStatus(issue.id, 'reviewing')}
                        >
                          مراجعة
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateIssueStatus(issue.id, 'fixed')}
                        >
                          إصلاح
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">لا توجد مشاكل</h3>
                <p className="text-muted-foreground">
                  جميع القيود المحاسبية سليمة ومتوازنة
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
