import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { tenantIsolationService, TenantAccessLog, TenantIsolationReport } from '@/services/BusinessServices/TenantIsolationService';
import { Shield, AlertTriangle, Activity, Database, Users, Car, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function TenantIsolationMonitor() {
  const [stats, setStats] = useState<any>(null);
  const [accessLogs, setAccessLogs] = useState<TenantAccessLog[]>([]);
  const [report, setReport] = useState<TenantIsolationReport | null>(null);
  const [integrity, setIntegrity] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // تحميل البيانات الأساسية
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [currentStats, logs, integrityCheck] = await Promise.all([
        tenantIsolationService.getCurrentTenantStats(),
        tenantIsolationService.getAccessLogs(50),
        tenantIsolationService.checkIsolationIntegrity()
      ]);

      setStats(currentStats);
      setAccessLogs(logs);
      setIntegrity(integrityCheck);

      // إنشاء تقرير للأسبوع الماضي
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const weeklyReport = await tenantIsolationService.generateIsolationReport(startDate, endDate);
      setReport(weeklyReport);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast.error('خطأ في تحميل بيانات المراقبة');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    toast.success('جاري تحديث البيانات...');
    loadData();
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'bg-success' : 'bg-destructive';
  };

  const getSecurityLevel = () => {
    if (!integrity) return { level: 'غير معروف', color: 'bg-muted' };
    if (integrity.is_secure) return { level: 'آمن', color: 'bg-success' };
    if (integrity.issues.length <= 2) return { level: 'تحذير', color: 'bg-warning' };
    return { level: 'خطر', color: 'bg-destructive' };
  };

  if (loading) {
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
        <Button onClick={refreshData} disabled={loading}>
          تحديث البيانات
        </Button>
      </div>

      {/* إحصائيات المؤسسة الحالية */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 rtl-title">
              <Database className="h-5 w-5" />
              إحصائيات المؤسسة الحالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total_users}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Users className="h-4 w-4" />
                  المستخدمون
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total_vehicles}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Car className="h-4 w-4" />
                  المركبات
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.total_contracts}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <FileText className="h-4 w-4" />
                  العقود
                </div>
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
          <TabsTrigger value="logs">سجل الوصول</TabsTrigger>
          <TabsTrigger value="integrity">فحص السلامة</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {report && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{report.total_access_attempts}</div>
                  <p className="text-sm text-muted-foreground">إجمالي محاولات الوصول</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-success">{report.successful_attempts}</div>
                  <p className="text-sm text-muted-foreground">محاولات ناجحة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-destructive">{report.failed_attempts}</div>
                  <p className="text-sm text-muted-foreground">محاولات فاشلة</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-warning">{report.suspicious_attempts}</div>
                  <p className="text-sm text-muted-foreground">محاولات مشبوهة</p>
                </CardContent>
              </Card>
            </div>
          )}

          {report && report.total_access_attempts > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>معدل النجاح</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={(report.successful_attempts / report.total_access_attempts) * 100} 
                  className="h-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {((report.successful_attempts / report.total_access_attempts) * 100).toFixed(1)}% نجاح
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل محاولات الوصول الحديثة</CardTitle>
              <CardDescription>آخر 50 محاولة وصول</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>التوقيت</TableHead>
                    <TableHead>الجدول</TableHead>
                    <TableHead>العملية</TableHead>
                    <TableHead>النتيجة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(log.created_at).toLocaleString('ar-SA')}
                        </div>
                      </TableCell>
                      <TableCell>{log.table_name}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.success)}>
                          {log.success ? 'نجح' : 'فشل'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {accessLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد سجلات وصول حديثة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          {integrity && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 rtl-title">
                    <Shield className="h-5 w-5" />
                    فحص سلامة عزل البيانات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Badge className={securityLevel.color}>
                      {securityLevel.level}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      تم الفحص في: {new Date().toLocaleString('ar-SA')}
                    </span>
                  </div>

                  {integrity.issues.length > 0 && (
                    <Alert className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        تم العثور على {integrity.issues.length} مشكلة تحتاج لمراجعة
                      </AlertDescription>
                    </Alert>
                  )}

                  {integrity.issues.map((issue: string, index: number) => (
                    <div key={index} className="mb-2 p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm text-destructive">{issue}</p>
                    </div>
                  ))}

                  {integrity.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">التوصيات:</h4>
                      {integrity.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="mb-1 text-sm text-muted-foreground">
                          • {rec}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {report && (
            <Card>
              <CardHeader>
                <CardTitle>تقرير أسبوعي</CardTitle>
                <CardDescription>الفترة: {report.period}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">الجداول المستخدمة:</h4>
                    <div className="flex flex-wrap gap-2">
                      {report.tables_accessed.map((table) => (
                        <Badge key={table} variant="outline">{table}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-lg font-semibold">{report.successful_attempts}</div>
                      <div className="text-sm text-success">محاولات ناجحة</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{report.suspicious_attempts}</div>
                      <div className="text-sm text-warning">محاولات مشبوهة</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}