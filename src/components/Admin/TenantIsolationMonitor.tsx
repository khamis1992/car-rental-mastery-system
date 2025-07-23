import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Activity, Database, CheckCircle, XCircle, RefreshCw, TestTube } from 'lucide-react';
import { toast } from 'sonner';
import { useTenant } from '@/contexts/TenantContext';

interface ComplianceData {
  status: string;
  compliance_score: number;
  total_tables: number;
  total_issues: number;
  issues: Array<{
    table: string;
    issue: string;
    severity: string;
    description: string;
  }>;
  recommendations: string[];
  checked_at: string;
}

interface RLSValidationData {
  status: string;
  tables_checked: number;
  missing_rls: string[];
  missing_policies: string[];
  validated_at: string;
}

interface DataIsolationData {
  status: string;
  total_violations: string;
  tests: Array<{
    table: string;
    status: string;
    records_tested?: number;
    error?: string;
  }>;
  violations: Array<{
    table: string;
    cross_tenant_records: number;
  }>;
  tested_at: string;
}

export function TenantIsolationMonitor() {
  const { currentTenant } = useTenant();
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [dataIsolation, setDataIsolation] = useState<DataIsolationData | null>(null);
  const [rlsValidation, setRlsValidation] = useState<RLSValidationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingTenant, setTestingTenant] = useState(false);

  // تحميل البيانات الأساسية
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // استخدام الدوال الجديدة من Supabase
      const [complianceResult, rlsResult] = await Promise.all([
        supabase.rpc('check_tenant_isolation_compliance'),
        supabase.rpc('validate_rls_policies')
      ]);

      if (complianceResult.error) {
        console.error('خطأ في فحص الامتثال:', complianceResult.error);
        toast.error('خطأ في فحص الامتثال');
      } else {
        setCompliance(complianceResult.data as unknown as ComplianceData);
      }

      if (rlsResult.error) {
        console.error('خطأ في فحص RLS:', rlsResult.error);
        toast.error('خطأ في فحص سياسات الأمان');
      } else {
        setRlsValidation(rlsResult.data as unknown as RLSValidationData);
      }

    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast.error('خطأ في تحميل بيانات المراقبة');
    } finally {
      setLoading(false);
    }
  };

  const testTenantIsolation = async () => {
    if (!currentTenant?.id) {
      toast.error('لا يمكن العثور على معرف المؤسسة الحالية');
      return;
    }

    setTestingTenant(true);
    try {
      const { data, error } = await supabase.rpc('test_tenant_data_isolation', {
        test_tenant_id: currentTenant.id
      });

      if (error) {
        console.error('خطأ في اختبار العزل:', error);
        toast.error('خطأ في اختبار عزل البيانات');
      } else {
        const isolationData = data as unknown as DataIsolationData;
        setDataIsolation(isolationData);
        if (isolationData.status === 'success' && isolationData.total_violations === '0') {
          toast.success('نجح اختبار عزل البيانات - النظام آمن');
        } else {
          toast.warning(`تم العثور على ${isolationData.total_violations} انتهاك في عزل البيانات`);
        }
      }
    } catch (error) {
      console.error('خطأ في اختبار العزل:', error);
      toast.error('خطأ في اختبار عزل البيانات');
    } finally {
      setTestingTenant(false);
    }
  };

  const refreshData = () => {
    toast.success('جاري تحديث البيانات...');
    loadData();
  };

  const getSecurityLevel = () => {
    if (!compliance) return { level: 'غير معروف', color: 'bg-muted' };
    if (compliance.compliance_score >= 90) return { level: 'آمن', color: 'bg-success' };
    if (compliance.compliance_score >= 70) return { level: 'تحذير', color: 'bg-warning' };
    return { level: 'خطر', color: 'bg-destructive' };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive';
      case 'high': return 'bg-warning';
      case 'medium': return 'bg-secondary';
      default: return 'bg-muted';
    }
  };

  if (loading && !compliance && !rlsValidation) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Activity className="h-8 w-8 animate-spin mx-auto" />
          <p>جاري تحميل بيانات المراقبة...</p>
        </div>
      </div>
    );
  }

  const securityLevel = getSecurityLevel();

  return (
    <div className="space-y-6" dir="rtl">
      {/* الحالة العامة */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">مراقبة عزل البيانات</h2>
          <p className="text-muted-foreground">مراقبة وحماية البيانات بين المؤسسات</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={testTenantIsolation} 
            disabled={testingTenant}
            variant="outline"
          >
            {testingTenant ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                جاري الاختبار...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                اختبار العزل
              </>
            )}
          </Button>
          <Button onClick={refreshData} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            تحديث البيانات
          </Button>
        </div>
      </div>

      {/* إحصائيات الامتثال */}
      {compliance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 rtl-title">
              <Database className="h-5 w-5" />
              حالة الامتثال الحالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{compliance.compliance_score}%</div>
                <div className="text-sm text-muted-foreground">نسبة الامتثال</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{compliance.total_tables}</div>
                <div className="text-sm text-muted-foreground">إجمالي الجداول</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{compliance.total_issues}</div>
                <div className="text-sm text-muted-foreground">المشاكل المكتشفة</div>
              </div>
              <div className="text-center">
                <Badge className={securityLevel.color}>
                  <Shield className="h-4 w-4 mr-1" />
                  {securityLevel.level}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">مستوى الأمان</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="compliance">الامتثال</TabsTrigger>
          <TabsTrigger value="rls">سياسات RLS</TabsTrigger>
          <TabsTrigger value="testing">اختبار العزل</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {compliance ? compliance.compliance_score : 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">امتثال الأمان</p>
                  </div>
                  <Shield className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {rlsValidation ? rlsValidation.tables_checked : 0}
                    </div>
                    <p className="text-sm text-muted-foreground">جداول محمية</p>
                  </div>
                  <Database className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {dataIsolation ? dataIsolation.tests.length : 0}
                    </div>
                    <p className="text-sm text-muted-foreground">اختبارات العزل</p>
                  </div>
                  <TestTube className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {compliance && compliance.compliance_score < 100 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                يحتاج النظام إلى تحسينات في الأمان. تم العثور على {compliance.total_issues} مشكلة.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {compliance && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 rtl-title">
                    <Shield className="h-5 w-5" />
                    تقرير الامتثال
                  </CardTitle>
                  <CardDescription>
                    تم الفحص في: {new Date(compliance.checked_at).toLocaleString('ar-SA')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={compliance.compliance_score} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      نسبة الامتثال: {compliance.compliance_score}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {compliance.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>المشاكل المكتشفة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الجدول</TableHead>
                          <TableHead>المشكلة</TableHead>
                          <TableHead>الشدة</TableHead>
                          <TableHead>الوصف</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {compliance.issues.map((issue, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{issue.table}</TableCell>
                            <TableCell>{issue.issue}</TableCell>
                            <TableCell>
                              <Badge className={getSeverityColor(issue.severity)}>
                                {issue.severity}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{issue.description}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {compliance.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>التوصيات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {compliance.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="rls" className="space-y-4">
          {rlsValidation && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>حالة سياسات Row Level Security</CardTitle>
                  <CardDescription>
                    تم الفحص في: {new Date(rlsValidation.validated_at).toLocaleString('ar-SA')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{rlsValidation.tables_checked}</div>
                      <div className="text-sm text-muted-foreground">إجمالي الجداول</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-destructive">
                        {rlsValidation.missing_rls.length}
                      </div>
                      <div className="text-sm text-muted-foreground">بدون RLS</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">
                        {rlsValidation.missing_policies.length}
                      </div>
                      <div className="text-sm text-muted-foreground">بدون سياسات</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {rlsValidation.missing_rls.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-destructive">جداول بدون RLS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {rlsValidation.missing_rls.map((table) => (
                        <Badge key={table} variant="destructive">{table}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {rlsValidation.missing_policies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-warning">جداول بدون سياسات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {rlsValidation.missing_policies.map((table) => (
                        <Badge key={table} variant="outline">{table}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          {dataIsolation && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    نتائج اختبار عزل البيانات
                  </CardTitle>
                  <CardDescription>
                    تم الاختبار في: {new Date(dataIsolation.tested_at).toLocaleString('ar-SA')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className={dataIsolation.status === 'success' ? 'bg-success' : 'bg-destructive'}>
                      {dataIsolation.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      {dataIsolation.status === 'success' ? 'نجح' : 'فشل'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      انتهاكات مكتشفة: {dataIsolation.total_violations}
                    </span>
                  </div>

                  {dataIsolation.violations.length > 0 && (
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        تم العثور على {dataIsolation.violations.length} انتهاك في عزل البيانات
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل الاختبارات</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الجدول</TableHead>
                        <TableHead>النتيجة</TableHead>
                        <TableHead>البيانات المختبرة</TableHead>
                        <TableHead>الملاحظات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dataIsolation.tests.map((test, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{test.table}</TableCell>
                          <TableCell>
                            <Badge className={test.status === 'pass' ? 'bg-success' : test.status === 'fail' ? 'bg-destructive' : 'bg-warning'}>
                              {test.status === 'pass' ? 'نجح' : test.status === 'fail' ? 'فشل' : 'خطأ'}
                            </Badge>
                          </TableCell>
                          <TableCell>{test.records_tested || 0}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {test.error || 'لا يوجد'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {dataIsolation.violations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-destructive">الانتهاكات المكتشفة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الجدول</TableHead>
                          <TableHead>عدد السجلات المخالفة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataIsolation.violations.map((violation, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono">{violation.table}</TableCell>
                            <TableCell className="text-destructive font-semibold">
                              {violation.cross_tenant_records}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
          
          {!dataIsolation && (
            <Card>
              <CardContent className="p-6 text-center">
                <TestTube className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">لم يتم إجراء اختبار العزل</h3>
                <p className="text-muted-foreground mb-4">اضغط على زر "اختبار العزل" لفحص أمان البيانات</p>
                <Button onClick={testTenantIsolation} disabled={testingTenant}>
                  {testingTenant ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      جاري الاختبار...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      اختبار العزل الآن
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}