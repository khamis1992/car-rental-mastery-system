import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Wrench, 
  Database,
  HardDrive,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Server,
  Activity,
  FileText,
  Archive,
  PlayCircle,
  StopCircle,
  Calendar,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  lastRun?: string;
  nextRun?: string;
  duration?: string;
  logs?: string[];
}

interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'critical';
    connections: number;
    maxConnections: number;
    size: string;
    performance: number;
  };
  storage: {
    status: 'healthy' | 'warning' | 'critical';
    used: number;
    total: number;
    uploads: string;
    backups: string;
  };
  cache: {
    status: 'healthy' | 'warning' | 'critical';
    hitRate: number;
    memory: string;
    keys: number;
  };
  api: {
    status: 'healthy' | 'warning' | 'critical';
    responseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
}

const MaintenanceTools: React.FC = () => {
  const { toast } = useToast();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('يخضع النظام حالياً للصيانة. سيعود قريباً.');
  
  const [systemHealth] = useState<SystemHealth>({
    database: {
      status: 'healthy',
      connections: 25,
      maxConnections: 100,
      size: '2.3 GB',
      performance: 92
    },
    storage: {
      status: 'warning',
      used: 75,
      total: 100,
      uploads: '15.2 GB',
      backups: '8.1 GB'
    },
    cache: {
      status: 'healthy',
      hitRate: 94.5,
      memory: '512 MB',
      keys: 15420
    },
    api: {
      status: 'healthy',
      responseTime: 127,
      requestsPerMinute: 1250,
      errorRate: 0.2
    }
  });

  const [maintenanceTasks] = useState<MaintenanceTask[]>([
    {
      id: '1',
      name: 'تنظيف قاعدة البيانات',
      description: 'إزالة البيانات المؤقتة والملفات غير المستخدمة',
      status: 'completed',
      progress: 100,
      lastRun: '2024-01-15 02:30',
      nextRun: '2024-01-22 02:30',
      duration: '15 دقيقة',
      logs: ['بدء تنظيف قاعدة البيانات', 'حذف 1,250 سجل مؤقت', 'إعادة فهرسة الجداول', 'اكتمل التنظيف بنجاح']
    },
    {
      id: '2',
      name: 'نسخ احتياطي للنظام',
      description: 'إنشاء نسخة احتياطية كاملة من البيانات',
      status: 'running',
      progress: 65,
      lastRun: '2024-01-14 01:00',
      nextRun: '2024-01-16 01:00',
      duration: '45 دقيقة',
      logs: ['بدء النسخ الاحتياطي', 'نسخ جداول المستخدمين...', 'نسخ بيانات العقود...', 'جاري نسخ الملفات...']
    },
    {
      id: '3',
      name: 'تحديث الفهارس',
      description: 'إعادة بناء فهارس قاعدة البيانات لتحسين الأداء',
      status: 'pending',
      progress: 0,
      lastRun: '2024-01-10 03:00',
      nextRun: '2024-01-17 03:00',
      duration: '30 دقيقة'
    },
    {
      id: '4',
      name: 'تنظيف الملفات المؤقتة',
      description: 'حذف الملفات المؤقتة وملفات التخزين المؤقت',
      status: 'failed',
      progress: 0,
      lastRun: '2024-01-15 04:00',
      nextRun: '2024-01-16 04:00',
      duration: '10 دقائق',
      logs: ['بدء تنظيف الملفات المؤقتة', 'خطأ: لا يمكن الوصول إلى مجلد التخزين المؤقت', 'فشل في اكمال المهمة']
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'في الانتظار', color: '' },
      running: { variant: 'default' as const, text: 'قيد التشغيل', color: '' },
      completed: { variant: 'default' as const, text: 'مكتمل', color: 'bg-green-100 text-green-800' },
      failed: { variant: 'destructive' as const, text: 'فشل', color: '' }
    };
    
    const statusInfo = variants[status as keyof typeof variants] || variants.pending;
    return (
      <Badge className={statusInfo.color} variant={statusInfo.variant}>
        {statusInfo.text}
      </Badge>
    );
  };

  const handleMaintenanceMode = async (enabled: boolean) => {
    setMaintenanceMode(enabled);
    toast({
      title: enabled ? "تم تفعيل وضع الصيانة" : "تم إلغاء وضع الصيانة",
      description: enabled ? "النظام الآن في وضع الصيانة" : "النظام عاد للعمل الطبيعي",
    });
  };

  const runMaintenanceTask = async (taskId: string) => {
    toast({
      title: "تم بدء المهمة",
      description: "تم تشغيل مهمة الصيانة بنجاح",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">أدوات الصيانة</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="maintenance-mode">وضع الصيانة</Label>
            <Switch
              id="maintenance-mode"
              checked={maintenanceMode}
              onCheckedChange={handleMaintenanceMode}
            />
          </div>
        </div>
      </div>

      {maintenanceMode && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>النظام في وضع الصيانة</AlertTitle>
          <AlertDescription>
            النظام حالياً في وضع الصيانة. المستخدمون لن يتمكنوا من الوصول إلى النظام.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="health" className="space-y-6">
        <TabsList>
          <TabsTrigger value="health">صحة النظام</TabsTrigger>
          <TabsTrigger value="tasks">مهام الصيانة</TabsTrigger>
          <TabsTrigger value="backup">النسخ الاحتياطي</TabsTrigger>
          <TabsTrigger value="cleanup">التنظيف</TabsTrigger>
          <TabsTrigger value="logs">السجلات</TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Database Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  قاعدة البيانات
                  {getStatusIcon(systemHealth.database.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>الاتصالات النشطة</span>
                    <span>{systemHealth.database.connections}/{systemHealth.database.maxConnections}</span>
                  </div>
                  <Progress value={(systemHealth.database.connections / systemHealth.database.maxConnections) * 100} />
                </div>
                <div className="flex justify-between text-sm">
                  <span>حجم البيانات</span>
                  <span>{systemHealth.database.size}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>الأداء</span>
                    <span>{systemHealth.database.performance}%</span>
                  </div>
                  <Progress value={systemHealth.database.performance} />
                </div>
              </CardContent>
            </Card>

            {/* Storage Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  التخزين
                  {getStatusIcon(systemHealth.storage.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>المساحة المستخدمة</span>
                    <span>{systemHealth.storage.used} GB / {systemHealth.storage.total} GB</span>
                  </div>
                  <Progress value={(systemHealth.storage.used / systemHealth.storage.total) * 100} />
                </div>
                <div className="flex justify-between text-sm">
                  <span>ملفات المستخدمين</span>
                  <span>{systemHealth.storage.uploads}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>النسخ الاحتياطية</span>
                  <span>{systemHealth.storage.backups}</span>
                </div>
              </CardContent>
            </Card>

            {/* Cache Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  التخزين المؤقت
                  {getStatusIcon(systemHealth.cache.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>معدل النجاح</span>
                    <span>{systemHealth.cache.hitRate}%</span>
                  </div>
                  <Progress value={systemHealth.cache.hitRate} />
                </div>
                <div className="flex justify-between text-sm">
                  <span>الذاكرة المستخدمة</span>
                  <span>{systemHealth.cache.memory}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>عدد المفاتيح</span>
                  <span>{systemHealth.cache.keys.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* API Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  واجهة البرمجة
                  {getStatusIcon(systemHealth.api.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>زمن الاستجابة</span>
                  <span>{systemHealth.api.responseTime} ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>الطلبات/دقيقة</span>
                  <span>{systemHealth.api.requestsPerMinute.toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>معدل الأخطاء</span>
                    <span>{systemHealth.api.errorRate}%</span>
                  </div>
                  <Progress value={systemHealth.api.errorRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  مهام الصيانة المجدولة
                </span>
                <Button className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  جدولة مهمة جديدة
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المهمة</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">التقدم</TableHead>
                    <TableHead className="text-right">آخر تشغيل</TableHead>
                    <TableHead className="text-right">التشغيل التالي</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.name}</div>
                          <div className="text-sm text-muted-foreground">{task.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={task.progress} className="h-2" />
                          <div className="text-xs text-muted-foreground">{task.progress}%</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {task.lastRun ? new Date(task.lastRun).toLocaleString('ar-SA') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {task.nextRun ? new Date(task.nextRun).toLocaleString('ar-SA') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {task.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => runMaintenanceTask(task.id)}
                            >
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {task.status === 'running' && (
                            <Button size="sm" variant="outline">
                              <StopCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <FileText className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent dir="rtl">
                              <DialogHeader>
                                <DialogTitle>سجل المهمة - {task.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-2">
                                {task.logs?.map((log, index) => (
                                  <div key={index} className="text-sm p-2 bg-muted rounded">
                                    {log}
                                  </div>
                                )) || (
                                  <div className="text-sm text-muted-foreground">لا توجد سجلات متاحة</div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  إنشاء نسخة احتياطية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>نوع النسخة الاحتياطية</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="full" name="backup-type" defaultChecked />
                      <Label htmlFor="full">نسخة كاملة (قاعدة البيانات + الملفات)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="database" name="backup-type" />
                      <Label htmlFor="database">قاعدة البيانات فقط</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="files" name="backup-type" />
                      <Label htmlFor="files">الملفات فقط</Label>
                    </div>
                  </div>
                </div>
                <Button className="w-full">
                  <Download className="w-4 h-4 ml-2" />
                  إنشاء نسخة احتياطية
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  استعادة نسخة احتياطية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ملف النسخة الاحتياطية</Label>
                  <Input type="file" accept=".sql,.zip,.tar.gz" />
                </div>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>تحذير</AlertTitle>
                  <AlertDescription>
                    استعادة النسخة الاحتياطية ستحل محل البيانات الحالية. تأكد من إنشاء نسخة احتياطية أولاً.
                  </AlertDescription>
                </Alert>
                <Button variant="destructive" className="w-full">
                  <Upload className="w-4 h-4 ml-2" />
                  استعادة النسخة الاحتياطية
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cleanup">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  تنظيف البيانات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>حذف السجلات القديمة</Label>
                    <Input type="number" placeholder="عدد الأيام" defaultValue="90" />
                    <p className="text-sm text-muted-foreground">
                      حذف السجلات أقدم من العدد المحدد من الأيام
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="logs" defaultChecked />
                      <Label htmlFor="logs">سجلات النظام</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="temp" defaultChecked />
                      <Label htmlFor="temp">الملفات المؤقتة</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="cache" />
                      <Label htmlFor="cache">ذاكرة التخزين المؤقت</Label>
                    </div>
                  </div>
                </div>
                <Button className="w-full">
                  <Trash2 className="w-4 h-4 ml-2" />
                  بدء التنظيف
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  إعادة بناء الفهارس
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  إعادة بناء فهارس قاعدة البيانات لتحسين الأداء. قد تستغرق هذه العملية وقتاً طويلاً.
                </p>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>ملاحظة</AlertTitle>
                  <AlertDescription>
                    قد يؤثر على أداء النظام أثناء التنفيذ
                  </AlertDescription>
                </Alert>
                <Button className="w-full">
                  <RefreshCw className="w-4 h-4 ml-2" />
                  إعادة بناء الفهارس
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                سجلات النظام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4" />
                سيتم تطوير عارض السجلات قريباً
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaintenanceTools;