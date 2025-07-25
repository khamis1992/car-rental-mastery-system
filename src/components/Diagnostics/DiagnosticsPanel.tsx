import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Clock,
  RefreshCw,
  User,
  Building,
  Database,
  Shield,
  Settings
} from 'lucide-react';
import { useEnhancedDiagnostics } from '@/hooks/useEnhancedDiagnostics';

const statusIcons = {
  pending: Clock,
  running: Loader2,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle
};

const statusColors = {
  pending: 'text-muted-foreground',
  running: 'text-blue-500 animate-spin',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500'
};

const statusBadgeVariants = {
  pending: 'secondary' as const,
  running: 'default' as const,
  success: 'default' as const,
  warning: 'secondary' as const,
  error: 'destructive' as const
};

const testIcons = {
  authentication: User,
  session: Clock,
  tenant: Building,
  database: Database,
  permissions: Shield,
  functions: Settings
};

export const DiagnosticsPanel: React.FC = () => {
  const { 
    diagnostics, 
    loading, 
    runComprehensiveDiagnostics, 
    getOverallStatus, 
    getRecommendations 
  } = useEnhancedDiagnostics();

  const overallStatus = getOverallStatus();
  const recommendations = getRecommendations();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              تشخيص النظام
            </CardTitle>
            <CardDescription>
              فحص شامل لحالة النظام وإعدادات المستخدم
            </CardDescription>
          </div>
          <Button 
            onClick={runComprehensiveDiagnostics}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'جاري الفحص...' : 'بدء التشخيص'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Status */}
        {diagnostics && (
          <Alert className={
            overallStatus === 'success' ? 'border-green-200 bg-green-50' :
            overallStatus === 'warning' ? 'border-yellow-200 bg-yellow-50' :
            'border-red-200 bg-red-50'
          }>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {overallStatus === 'success' ? 'النظام يعمل بشكل طبيعي' :
               overallStatus === 'warning' ? 'توجد تحذيرات' :
               'توجد مشاكل تحتاج إصلاح'}
            </AlertTitle>
            <AlertDescription>
              {overallStatus === 'success' ? 
                'جميع الاختبارات نجحت والنظام جاهز للاستخدام' :
                'يرجى مراجعة التفاصيل أدناه والتوصيات المقترحة'
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>التوصيات</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Diagnostic Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diagnostics && Object.entries(diagnostics).map(([key, test]) => {
            const StatusIcon = statusIcons[test.status];
            const TestIcon = testIcons[key as keyof typeof testIcons];
            
            return (
              <Card key={key} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TestIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{test.nameAr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${statusColors[test.status]}`} />
                      <Badge variant={statusBadgeVariants[test.status]} className="text-xs">
                        {test.status === 'pending' ? 'انتظار' :
                         test.status === 'running' ? 'جاري' :
                         test.status === 'success' ? 'نجح' :
                         test.status === 'warning' ? 'تحذير' :
                         'خطأ'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {test.status === 'running' && (
                    <div className="text-sm text-muted-foreground">
                      جاري الفحص...
                    </div>
                  )}
                  
                  {test.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
                      {test.error}
                    </div>
                  )}
                  
                  {test.result && (
                    <div className="space-y-2">
                      {typeof test.result === 'object' ? (
                        <div className="text-xs space-y-1">
                          {Object.entries(test.result).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                              <span className="text-muted-foreground">{k}:</span>
                              <span className="font-mono text-xs">
                                {typeof v === 'boolean' ? (v ? '✓' : '✗') : String(v)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-green-600">
                          {String(test.result)}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {test.recommendation && (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border">
                      💡 {test.recommendation}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!diagnostics && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            اضغط على "بدء التشخيص" لفحص حالة النظام
          </div>
        )}
      </CardContent>
    </Card>
  );
};