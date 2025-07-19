import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  FileText, 
  Eye, 
  Search,
  Download,
  Filter,
  AlertCircle,
  Zap,
  Lock,
  Users,
  Calendar,
  TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";

interface AuditItem {
  id: string;
  type: 'compliance' | 'security' | 'process' | 'data';
  title: string;
  description: string;
  status: 'passed' | 'warning' | 'failed' | 'pending';
  priority: 'high' | 'medium' | 'low';
  lastChecked: string;
  nextCheck: string;
  recommendations?: string[];
  responsible: string;
}

interface ComplianceMetric {
  category: string;
  score: number;
  total: number;
  percentage: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface AuditTrail {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: any;
  ipAddress: string;
  userAgent: string;
}

export const AuditCompliance = () => {
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [complianceMetrics, setComplianceMetrics] = useState<ComplianceMetric[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>([]);
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  useEffect(() => {
    loadAuditData();
  }, []);

  const loadAuditData = () => {
    // بيانات وهمية لعناصر المراجعة
    setAuditItems([
      {
        id: '1',
        type: 'compliance',
        title: 'مطابقة معايير GAAP',
        description: 'التحقق من مطابقة القوائم المالية لمعايير المحاسبة المقبولة عموماً',
        status: 'passed',
        priority: 'high',
        lastChecked: '2024-01-15',
        nextCheck: '2024-02-15',
        responsible: 'قسم المحاسبة'
      },
      {
        id: '2',
        type: 'security',
        title: 'أمان البيانات المالية',
        description: 'فحص مستوى الحماية والتشفير للبيانات المالية الحساسة',
        status: 'warning',
        priority: 'high',
        lastChecked: '2024-01-14',
        nextCheck: '2024-01-21',
        recommendations: [
          'تفعيل المصادقة الثنائية لجميع المستخدمين',
          'تحديث كلمات المرور بشكل دوري'
        ],
        responsible: 'قسم تقنية المعلومات'
      },
      {
        id: '3',
        type: 'process',
        title: 'عمليات القيود المحاسبية',
        description: 'مراجعة صحة ودقة عمليات إدخال القيود المحاسبية',
        status: 'failed',
        priority: 'medium',
        lastChecked: '2024-01-13',
        nextCheck: '2024-01-20',
        recommendations: [
          'تطبيق نظام الموافقة المزدوجة',
          'تدريب الموظفين على الإجراءات الصحيحة'
        ],
        responsible: 'مدير المحاسبة'
      },
      {
        id: '4',
        type: 'data',
        title: 'جودة البيانات',
        description: 'التحقق من دقة واكتمال البيانات المالية',
        status: 'passed',
        priority: 'medium',
        lastChecked: '2024-01-15',
        nextCheck: '2024-02-01',
        responsible: 'محلل البيانات'
      },
      {
        id: '5',
        type: 'compliance',
        title: 'متطلبات الزكاة والضريبة',
        description: 'مراجعة الامتثال لمتطلبات هيئة الزكاة والضريبة والجمارك',
        status: 'pending',
        priority: 'high',
        lastChecked: '2024-01-10',
        nextCheck: '2024-01-25',
        responsible: 'المستشار الضريبي'
      }
    ]);

    // مؤشرات الامتثال
    setComplianceMetrics([
      {
        category: 'المعايير المحاسبية',
        score: 18,
        total: 20,
        percentage: 90,
        status: 'excellent'
      },
      {
        category: 'أمان البيانات',
        score: 14,
        total: 18,
        percentage: 78,
        status: 'good'
      },
      {
        category: 'العمليات والإجراءات',
        score: 12,
        total: 16,
        percentage: 75,
        status: 'warning'
      },
      {
        category: 'الامتثال القانوني',
        score: 8,
        total: 12,
        percentage: 67,
        status: 'warning'
      }
    ]);

    // سجل المراجعة
    setAuditTrail([
      {
        id: '1',
        timestamp: '2024-01-15 14:30:22',
        user: 'أحمد المحاسب',
        action: 'تعديل قيد محاسبي',
        entity: 'journal_entry',
        entityId: 'JE-2024-001234',
        changes: {
          amount: { from: 1500, to: 1750 },
          description: { from: 'وقود', to: 'وقود وصيانة' }
        },
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      {
        id: '2',
        timestamp: '2024-01-15 13:45:18',
        user: 'فاطمة الإدارية',
        action: 'إنشاء فاتورة جديدة',
        entity: 'invoice',
        entityId: 'INV-2024-005678',
        ipAddress: '192.168.1.108',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      {
        id: '3',
        timestamp: '2024-01-15 12:20:45',
        user: 'محمد المدير',
        action: 'اعتماد ميزانية',
        entity: 'budget',
        entityId: 'BUD-2024-Q1',
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
      },
      {
        id: '4',
        timestamp: '2024-01-15 11:15:30',
        user: 'سارة المحاسبة',
        action: 'تصدير تقرير مالي',
        entity: 'financial_report',
        entityId: 'FR-2024-JAN',
        ipAddress: '192.168.1.110',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      {
        id: '5',
        timestamp: '2024-01-15 10:30:12',
        user: 'خالد التقنية',
        action: 'تحديث صلاحيات المستخدم',
        entity: 'user_permissions',
        entityId: 'USR-001',
        changes: {
          permissions: { added: ['view_reports'], removed: ['delete_entries'] }
        },
        ipAddress: '192.168.1.115',
        userAgent: 'Mozilla/5.0 (Ubuntu; Linux x86_64)'
      }
    ]);
  };

  const runAudit = async () => {
    setIsRunningAudit(true);
    // محاكاة تشغيل المراجعة
    setTimeout(() => {
      setIsRunningAudit(false);
      // تحديث حالات العناصر
      setAuditItems(prev => prev.map(item => ({
        ...item,
        lastChecked: new Date().toISOString().split('T')[0]
      })));
    }, 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-blue-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'compliance': return <Shield className="h-4 w-4" />;
      case 'security': return <Lock className="h-4 w-4" />;
      case 'process': return <Zap className="h-4 w-4" />;
      case 'data': return <FileText className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const overallScore = Math.round(
    complianceMetrics.reduce((acc, metric) => acc + metric.percentage, 0) / complianceMetrics.length
  );

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">نقاط الامتثال الإجمالية</p>
                <p className={`text-2xl font-bold ${getComplianceColor(
                  overallScore >= 90 ? 'excellent' : 
                  overallScore >= 80 ? 'good' : 
                  overallScore >= 70 ? 'warning' : 'critical'
                )}`}>
                  {overallScore}%
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">العناصر المراجعة</p>
                <p className="text-2xl font-bold">{auditItems.length}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">التنبيهات النشطة</p>
                <p className="text-2xl font-bold text-red-600">
                  {auditItems.filter(item => item.status === 'failed' || item.status === 'warning').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">آخر مراجعة</p>
                <p className="text-sm font-bold">منذ ساعتين</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="audit">عناصر المراجعة</TabsTrigger>
          <TabsTrigger value="compliance">مؤشرات الامتثال</TabsTrigger>
          <TabsTrigger value="trail">سجل المراجعة</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="rtl-title flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  عناصر المراجعة والامتثال
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={runAudit}
                    disabled={isRunningAudit}
                    variant="outline"
                    size="sm"
                  >
                    {isRunningAudit ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        جاري المراجعة...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        تشغيل المراجعة
                      </>
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    تصدير التقرير
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {auditItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(item.type)}
                          <div>
                            <h4 className="font-medium">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            item.priority === 'high' ? 'destructive' :
                            item.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {item.priority === 'high' ? 'عالي' :
                             item.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </Badge>
                          {getStatusIcon(item.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">آخر فحص</p>
                          <p className="font-medium">{item.lastChecked}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">الفحص التالي</p>
                          <p className="font-medium">{item.nextCheck}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">المسؤول</p>
                          <p className="font-medium">{item.responsible}</p>
                        </div>
                      </div>

                      {item.recommendations && (
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded p-3 space-y-2">
                          <p className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            التوصيات
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {item.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-yellow-500">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {complianceMetrics.map((metric, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="rtl-title text-base">{metric.category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getComplianceColor(metric.status)}`}>
                      {metric.percentage}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {metric.score} من {metric.total}
                    </span>
                  </div>
                  
                  <Progress value={metric.percentage} className="w-full" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${getComplianceColor(metric.status)}`}>
                      {metric.status === 'excellent' ? 'ممتاز' :
                       metric.status === 'good' ? 'جيد' :
                       metric.status === 'warning' ? 'يحتاج تحسين' : 'حرج'}
                    </span>
                    <TrendingUp className={`h-4 w-4 ${getComplianceColor(metric.status)}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trail" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <FileText className="h-5 w-5" />
                سجل المراجعة والتدقيق
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {auditTrail.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{entry.user}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm">{entry.action}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.entity}: {entry.entityId}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="h-3 w-3" />
                            {entry.timestamp}
                          </div>
                          <p>IP: {entry.ipAddress}</p>
                        </div>
                      </div>
                      
                      {entry.changes && (
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs">
                          <p className="font-medium mb-1">التغييرات:</p>
                          <pre className="text-muted-foreground">
                            {JSON.stringify(entry.changes, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <FileText className="h-12 w-12 text-blue-500 mx-auto" />
                <div>
                  <h3 className="font-medium">تقرير الامتثال الشامل</h3>
                  <p className="text-sm text-muted-foreground">تقرير مفصل عن جميع معايير الامتثال</p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  تحميل PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <Shield className="h-12 w-12 text-green-500 mx-auto" />
                <div>
                  <h3 className="font-medium">تقرير الأمان</h3>
                  <p className="text-sm text-muted-foreground">تحليل شامل لأمان النظام والبيانات</p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  تحميل PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center space-y-4">
                <Eye className="h-12 w-12 text-purple-500 mx-auto" />
                <div>
                  <h3 className="font-medium">سجل المراجعة المفصل</h3>
                  <p className="text-sm text-muted-foreground">تقرير شامل لجميع العمليات والتغييرات</p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  تحميل Excel
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};