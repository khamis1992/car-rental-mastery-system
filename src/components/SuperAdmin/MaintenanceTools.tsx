import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Settings,
  Database,
  Server,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  Square,
  Calendar,
  Eye,
  Edit,
  Plus,
  FileText,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Zap,
  Search,
  Download,
  Upload,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// استيراد المكونات المحسنة
import { EnhancedDialog } from '@/components/ui/enhanced-dialog';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { ActionButton, EnhancedButton } from '@/components/ui/enhanced-button';
import { LoadingState, ErrorBoundary } from '@/components/ui/enhanced-error-handling';
import { useTranslation, formatStatus } from '@/utils/translationUtils';

interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  type: 'backup' | 'cleanup' | 'optimization' | 'security' | 'monitoring' | 'custom';
  status: 'scheduled' | 'running' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'critical';
  schedule: {
    type: 'once' | 'daily' | 'weekly' | 'monthly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  nextRun: string;
  lastRun?: string;
  duration?: number; // minutes
  progress?: number; // percentage
  createdBy: string;
  createdAt: string;
  log?: string[];
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  activeConnections: number;
  databaseSize: number;
  cacheHitRate: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  source: string;
  message: string;
  details?: any;
}

const MaintenanceTools: React.FC = () => {
  const { toast } = useToast();
  const { t, msg, formatNumber } = useTranslation();
  
  // State management
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [loading, setLoading] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // نموذج مهمة جديدة
  const [newTaskForm, setNewTaskForm] = useState({
    name: '',
    description: '',
    type: 'backup' as const,
    priority: 'medium' as const,
    scheduleType: 'once' as const,
    scheduleTime: '',
    dayOfWeek: 1,
    dayOfMonth: 1
  });

  // بيانات المهام التجريبية
  const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([
    {
      id: '1',
      name: 'نسخ احتياطي يومي',
      description: 'نسخ احتياطي للبيانات الأساسية',
      type: 'backup',
      status: 'scheduled',
      priority: 'high',
      schedule: {
        type: 'daily',
        time: '02:00'
      },
      nextRun: '2024-01-16T02:00:00Z',
      lastRun: '2024-01-15T02:00:00Z',
      duration: 45,
      createdBy: 'مدير النظام',
      createdAt: '2024-01-10T09:00:00Z',
      log: ['بدء النسخ الاحتياطي', 'نسخ قاعدة البيانات', 'نسخ الملفات', 'اكتمل بنجاح']
    },
    {
      id: '2',
      name: 'تنظيف الملفات المؤقتة',
      description: 'حذف الملفات المؤقتة والذاكرة التخزينية',
      type: 'cleanup',
      status: 'running',
      priority: 'medium',
      schedule: {
        type: 'weekly',
        time: '01:00',
        dayOfWeek: 0
      },
      nextRun: '2024-01-21T01:00:00Z',
      lastRun: '2024-01-14T01:00:00Z',
      duration: 15,
      progress: 65,
      createdBy: 'مدير النظام',
      createdAt: '2024-01-10T09:00:00Z',
      log: ['بدء التنظيف', 'حذف الملفات المؤقتة', 'تنظيف الذاكرة التخزينية']
    }
  ]);

  // تحميل النظام والسجلات
  useEffect(() => {
    loadSystemMetrics();
    loadSystemLogs();
  }, []);

  const loadSystemMetrics = () => {
    // محاكاة تحميل إحصائيات النظام
    setSystemMetrics({
      cpu: 45,
      memory: 67,
      disk: 78,
      network: 23,
      uptime: 168, // hours
      activeConnections: 234,
      databaseSize: 2.3, // GB
      cacheHitRate: 95.2
    });
  };

  const loadSystemLogs = () => {
    // محاكاة تحميل السجلات
    setLogs([
      {
        id: '1',
        timestamp: '2024-01-15T14:30:00Z',
        level: 'info',
        source: 'النظام',
        message: 'تم تسجيل دخول مدير جديد',
        details: { userId: 'admin-123', ip: '192.168.1.100' }
      },
      {
        id: '2',
        timestamp: '2024-01-15T14:25:00Z',
        level: 'warning',
        source: 'قاعدة البيانات',
        message: 'استعلام بطيء تم اكتشافه',
        details: { query: 'SELECT * FROM contracts', duration: '3.2s' }
      },
      {
        id: '3',
        timestamp: '2024-01-15T14:20:00Z',
        level: 'error',
        source: 'API',
        message: 'فشل في الاتصال بخدمة خارجية',
        details: { service: 'payment-gateway', error: 'timeout' }
      }
    ]);
  };

  // تعريف أعمدة جدول المهام
  const taskColumns = [
    {
      key: 'name',
      title: 'اسم المهمة',
      sortable: true,
      render: (value: string, row: MaintenanceTask) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            row.type === 'backup' ? 'bg-blue-100' :
            row.type === 'cleanup' ? 'bg-orange-100' :
            row.type === 'security' ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            {row.type === 'backup' ? <Database className="w-4 h-4 text-blue-600" /> :
             row.type === 'cleanup' ? <Trash2 className="w-4 h-4 text-orange-600" /> :
             row.type === 'security' ? <Shield className="w-4 h-4 text-red-600" /> :
             <Settings className="w-4 h-4 text-gray-600" />}
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">{row.description}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'الحالة',
      align: 'center' as const,
      render: (status: string, row: MaintenanceTask) => {
        const statusConfig = {
          scheduled: { label: 'مجدولة', variant: 'secondary' as const, icon: Clock },
          running: { label: 'قيد التشغيل', variant: 'default' as const, icon: Play },
          completed: { label: 'مكتملة', variant: 'outline' as const, icon: CheckCircle },
          failed: { label: 'فشلت', variant: 'destructive' as const, icon: AlertTriangle },
          paused: { label: 'متوقفة', variant: 'secondary' as const, icon: Pause }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig];
        const Icon = config.icon;
        
        return (
          <div className="flex items-center gap-2">
            <Badge variant={config.variant}>
              <Icon className="w-3 h-3 mr-1" />
              {config.label}
            </Badge>
            {row.progress && (
              <div className="w-16">
                <Progress value={row.progress} className="h-2" />
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'priority',
      title: 'الأولوية',
      align: 'center' as const,
      render: (priority: string) => {
        const priorityColors = {
          critical: 'bg-red-100 text-red-800',
          high: 'bg-orange-100 text-orange-800',
          medium: 'bg-yellow-100 text-yellow-800',
          low: 'bg-green-100 text-green-800'
        };
        const priorityLabels = {
          critical: 'حرجة',
          high: 'مرتفعة',
          medium: 'متوسطة',
          low: 'منخفضة'
        };
        return (
          <Badge className={priorityColors[priority as keyof typeof priorityColors]}>
            {priorityLabels[priority as keyof typeof priorityLabels]}
          </Badge>
        );
      }
    },
    {
      key: 'nextRun',
      title: 'التشغيل التالي',
      render: (date: string) => (
        <span className="text-sm text-muted-foreground">
          {new Date(date).toLocaleString('ar-SA')}
        </span>
      )
    },
    {
      key: 'schedule.type',
      title: 'التكرار',
      render: (_, row: MaintenanceTask) => {
        const scheduleLabels = {
          once: 'مرة واحدة',
          daily: 'يومياً',
          weekly: 'أسبوعياً',
          monthly: 'شهرياً'
        };
        return (
          <span className="text-sm">
            {scheduleLabels[row.schedule.type]}
          </span>
        );
      }
    }
  ];

  // تعريف إجراءات المهام
  const taskActions = [
    {
      label: 'عرض التفاصيل',
      icon: <Eye className="w-4 h-4" />,
      onClick: (task: MaintenanceTask) => {
        setSelectedTask(task);
        setShowTaskDetails(true);
      }
    },
    {
      label: 'تشغيل الآن',
      icon: <Play className="w-4 h-4" />,
      onClick: (task: MaintenanceTask) => {
        runTaskNow(task);
      },
      disabled: (task: MaintenanceTask) => task.status === 'running'
    },
    {
      label: 'تحرير',
      icon: <Edit className="w-4 h-4" />,
      onClick: (task: MaintenanceTask) => {
        setSelectedTask(task);
        setNewTaskForm({
          name: task.name,
          description: task.description,
          type: task.type,
          priority: task.priority,
          scheduleType: task.schedule.type,
          scheduleTime: task.schedule.time,
          dayOfWeek: task.schedule.dayOfWeek || 1,
          dayOfMonth: task.schedule.dayOfMonth || 1
        });
        setShowCreateTask(true);
      }
    },
    {
      label: task => task.status === 'running' ? 'إيقاف' : 'إيقاف مؤقت',
      icon: <Pause className="w-4 h-4" />,
      onClick: (task: MaintenanceTask) => {
        pauseTask(task);
      },
      variant: 'secondary' as const
    },
    {
      label: 'حذف',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (task: MaintenanceTask) => {
        deleteTask(task);
      },
      variant: 'destructive' as const,
      separator: true,
      disabled: (task: MaintenanceTask) => task.status === 'running'
    }
  ];

  // معالجات الأحداث
  const handleCreateTask = async () => {
    setLoading(true);
    try {
      const newTask: MaintenanceTask = {
        id: Date.now().toString(),
        name: newTaskForm.name,
        description: newTaskForm.description,
        type: newTaskForm.type,
        status: 'scheduled',
        priority: newTaskForm.priority,
        schedule: {
          type: newTaskForm.scheduleType,
          time: newTaskForm.scheduleTime,
          dayOfWeek: newTaskForm.dayOfWeek,
          dayOfMonth: newTaskForm.dayOfMonth
        },
        nextRun: calculateNextRun(newTaskForm),
        createdBy: 'مدير النظام',
        createdAt: new Date().toISOString()
      };

      if (selectedTask) {
        // تحديث مهمة موجودة
        setMaintenanceTasks(prev => 
          prev.map(task => task.id === selectedTask.id ? { ...task, ...newTask, id: selectedTask.id } : task)
        );
        toast({
          title: 'تم التحديث بنجاح',
          description: `تم تحديث المهمة ${newTaskForm.name} بنجاح`
        });
      } else {
        // إنشاء مهمة جديدة
        setMaintenanceTasks(prev => [...prev, newTask]);
        toast({
          title: 'تم إنشاء المهمة بنجاح',
          description: `تم جدولة المهمة ${newTaskForm.name} بنجاح`
        });
      }
      
      setShowCreateTask(false);
      setSelectedTask(null);
      resetForm();
    } catch (error) {
      toast({
        title: 'خطأ في إنشاء المهمة',
        description: 'حدث خطأ أثناء إنشاء المهمة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const runTaskNow = async (task: MaintenanceTask) => {
    try {
      // تحديث حالة المهمة إلى قيد التشغيل
      setMaintenanceTasks(prev =>
        prev.map(t => t.id === task.id ? { ...t, status: 'running', progress: 0 } : t)
      );

      toast({
        title: 'تم بدء المهمة',
        description: `تم بدء تشغيل المهمة ${task.name}`
      });

      // محاكاة تقدم المهمة
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setMaintenanceTasks(prev =>
          prev.map(t => t.id === task.id ? { ...t, progress } : t)
        );

        if (progress >= 100) {
          clearInterval(interval);
          setMaintenanceTasks(prev =>
            prev.map(t => t.id === task.id ? { 
              ...t, 
              status: 'completed', 
              progress: 100,
              lastRun: new Date().toISOString(),
              nextRun: calculateNextRun({ ...newTaskForm, scheduleType: task.schedule.type })
            } : t)
          );
          toast({
            title: 'اكتملت المهمة',
            description: `تم إكمال المهمة ${task.name} بنجاح`
          });
        }
      }, 500);
    } catch (error) {
      toast({
        title: 'خطأ في تشغيل المهمة',
        description: 'حدث خطأ أثناء تشغيل المهمة',
        variant: 'destructive'
      });
    }
  };

  const pauseTask = (task: MaintenanceTask) => {
    setMaintenanceTasks(prev =>
      prev.map(t => t.id === task.id ? { ...t, status: 'paused' } : t)
    );
    toast({
      title: 'تم إيقاف المهمة',
      description: `تم إيقاف المهمة ${task.name} مؤقتاً`
    });
  };

  const deleteTask = (task: MaintenanceTask) => {
    setMaintenanceTasks(prev => prev.filter(t => t.id !== task.id));
    toast({
      title: 'تم حذف المهمة',
      description: `تم حذف المهمة ${task.name} بنجاح`
    });
  };

  const calculateNextRun = (form: typeof newTaskForm): string => {
    const now = new Date();
    const [hours, minutes] = form.scheduleTime.split(':').map(Number);
    
    const nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);
    
    switch (form.scheduleType) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay() + form.dayOfWeek) % 7);
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;
      case 'monthly':
        nextRun.setDate(form.dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }
    
    return nextRun.toISOString();
  };

  const resetForm = () => {
    setNewTaskForm({
      name: '',
      description: '',
      type: 'backup',
      priority: 'medium',
      scheduleType: 'once',
      scheduleTime: '',
      dayOfWeek: 1,
      dayOfMonth: 1
    });
  };

  // إحصائيات المهام
  const taskStats = {
    total: maintenanceTasks.length,
    scheduled: maintenanceTasks.filter(t => t.status === 'scheduled').length,
    running: maintenanceTasks.filter(t => t.status === 'running').length,
    completed: maintenanceTasks.filter(t => t.status === 'completed').length
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">أدوات الصيانة</h2>
            <p className="text-muted-foreground">
              إدارة مهام الصيانة ومراقبة النظام
            </p>
          </div>
          <div className="flex gap-2">
            <EnhancedButton
              onClick={() => {
                loadSystemMetrics();
                loadSystemLogs();
              }}
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
              loadingText="جاري التحديث..."
            >
              تحديث
            </EnhancedButton>
            <ActionButton
              action="create"
              itemName="مهمة جديدة"
              onClick={() => {
                setSelectedTask(null);
                resetForm();
                setShowCreateTask(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              جدولة مهمة جديدة
            </ActionButton>
          </div>
        </div>

        {/* System Metrics */}
        {systemMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground text-right">المعالج</p>
                    <p className="text-2xl font-bold text-right">{systemMetrics.cpu}%</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <Progress value={systemMetrics.cpu} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground text-right">الذاكرة</p>
                    <p className="text-2xl font-bold text-right">{systemMetrics.memory}%</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <MemoryStick className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <Progress value={systemMetrics.memory} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground text-right">القرص الصلب</p>
                    <p className="text-2xl font-bold text-right">{systemMetrics.disk}%</p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <HardDrive className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <Progress value={systemMetrics.disk} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground text-right">الشبكة</p>
                    <p className="text-2xl font-bold text-right">{systemMetrics.network}%</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Network className="w-4 h-4 text-purple-600" />
                  </div>
                </div>
                <Progress value={systemMetrics.network} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tasks">المهام المجدولة</TabsTrigger>
            <TabsTrigger value="monitoring">مراقبة النظام</TabsTrigger>
            <TabsTrigger value="logs">السجلات</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <LoadingState
              loading={false}
              isEmpty={maintenanceTasks.length === 0}
              emptyMessage="لا توجد مهام مجدولة"
            >
              <EnhancedTable
                data={maintenanceTasks}
                columns={taskColumns}
                actions={taskActions}
                searchable
                searchPlaceholder="البحث في المهام..."
                onRefresh={() => window.location.reload()}
                emptyMessage="لا توجد مهام مجدولة"
                maxHeight="600px"
                stickyHeader
              />
            </LoadingState>
          </TabsContent>

          <TabsContent value="monitoring">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات النظام</CardTitle>
                </CardHeader>
                <CardContent>
                  {systemMetrics && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>وقت التشغيل</span>
                        <span className="font-medium">{systemMetrics.uptime} ساعة</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>الاتصالات النشطة</span>
                        <span className="font-medium">{formatNumber(systemMetrics.activeConnections)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>حجم قاعدة البيانات</span>
                        <span className="font-medium">{systemMetrics.databaseSize} GB</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>معدل إصابة الذاكرة التخزينية</span>
                        <span className="font-medium">{systemMetrics.cacheHitRate}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات المهام</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>إجمالي المهام</span>
                      <span className="font-medium">{formatNumber(taskStats.total)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>مجدولة</span>
                      <span className="font-medium text-blue-600">{formatNumber(taskStats.scheduled)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>قيد التشغيل</span>
                      <span className="font-medium text-orange-600">{formatNumber(taskStats.running)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>مكتملة</span>
                      <span className="font-medium text-green-600">{formatNumber(taskStats.completed)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>سجلات النظام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        log.level === 'error' ? 'bg-red-500' :
                        log.level === 'warning' ? 'bg-yellow-500' :
                        log.level === 'info' ? 'bg-blue-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm">{log.message}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.timestamp).toLocaleString('ar-SA')}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {log.source} - {log.level}
                        </div>
                        {log.details && (
                          <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Task Dialog */}
        <EnhancedDialog
          open={showCreateTask}
          onOpenChange={setShowCreateTask}
          title={selectedTask ? 'تحرير المهمة' : 'جدولة مهمة جديدة'}
          description={selectedTask ? 'تحديث إعدادات المهمة' : 'إنشاء مهمة صيانة جديدة'}
          size="lg"
          showCloseButton
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-name">اسم المهمة</Label>
                <Input
                  id="task-name"
                  value={newTaskForm.name}
                  onChange={(e) => setNewTaskForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: نسخ احتياطي يومي"
                />
              </div>
              <div>
                <Label htmlFor="task-type">نوع المهمة</Label>
                <Select
                  value={newTaskForm.type}
                  onValueChange={(value) => setNewTaskForm(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع المهمة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backup">نسخ احتياطي</SelectItem>
                    <SelectItem value="cleanup">تنظيف</SelectItem>
                    <SelectItem value="optimization">تحسين</SelectItem>
                    <SelectItem value="security">أمان</SelectItem>
                    <SelectItem value="monitoring">مراقبة</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-priority">الأولوية</Label>
                <Select
                  value={newTaskForm.priority}
                  onValueChange={(value) => setNewTaskForm(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">مرتفعة</SelectItem>
                    <SelectItem value="critical">حرجة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-schedule">تكرار التنفيذ</Label>
                <Select
                  value={newTaskForm.scheduleType}
                  onValueChange={(value) => setNewTaskForm(prev => ({ ...prev, scheduleType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر التكرار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">مرة واحدة</SelectItem>
                    <SelectItem value="daily">يومياً</SelectItem>
                    <SelectItem value="weekly">أسبوعياً</SelectItem>
                    <SelectItem value="monthly">شهرياً</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="task-time">وقت التنفيذ</Label>
                <Input
                  id="task-time"
                  type="time"
                  value={newTaskForm.scheduleTime}
                  onChange={(e) => setNewTaskForm(prev => ({ ...prev, scheduleTime: e.target.value }))}
                />
              </div>
              {newTaskForm.scheduleType === 'weekly' && (
                <div>
                  <Label htmlFor="task-day-week">يوم الأسبوع</Label>
                  <Select
                    value={newTaskForm.dayOfWeek.toString()}
                    onValueChange={(value) => setNewTaskForm(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">الأحد</SelectItem>
                      <SelectItem value="1">الاثنين</SelectItem>
                      <SelectItem value="2">الثلاثاء</SelectItem>
                      <SelectItem value="3">الأربعاء</SelectItem>
                      <SelectItem value="4">الخميس</SelectItem>
                      <SelectItem value="5">الجمعة</SelectItem>
                      <SelectItem value="6">السبت</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {newTaskForm.scheduleType === 'monthly' && (
                <div>
                  <Label htmlFor="task-day-month">يوم الشهر</Label>
                  <Input
                    id="task-day-month"
                    type="number"
                    min="1"
                    max="31"
                    value={newTaskForm.dayOfMonth}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="task-description">وصف المهمة</Label>
              <Textarea
                id="task-description"
                value={newTaskForm.description}
                onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="اكتب وصفاً مفصلاً للمهمة..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateTask(false);
                  setSelectedTask(null);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <ActionButton
                action={selectedTask ? "update" : "create"}
                itemName="المهمة"
                onClick={handleCreateTask}
                loading={loading}
              >
                {selectedTask ? 'تحديث المهمة' : 'جدولة المهمة'}
              </ActionButton>
            </div>
          </div>
        </EnhancedDialog>

        {/* Task Details Dialog */}
        <EnhancedDialog
          open={showTaskDetails}
          onOpenChange={setShowTaskDetails}
          title={selectedTask ? `تفاصيل المهمة: ${selectedTask.name}` : ''}
          description="عرض تفاصيل المهمة وسجل التنفيذ"
          size="lg"
          showCloseButton
        >
          {selectedTask && (
            <div className="space-y-6">
              {/* معلومات المهمة */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>اسم المهمة</Label>
                  <div className="mt-1 text-sm">{selectedTask.name}</div>
                </div>
                <div>
                  <Label>النوع</Label>
                  <div className="mt-1 text-sm">{selectedTask.type}</div>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <div className="mt-1">
                    <Badge variant={selectedTask.status === 'running' ? 'default' : 'secondary'}>
                      {selectedTask.status === 'scheduled' ? 'مجدولة' :
                       selectedTask.status === 'running' ? 'قيد التشغيل' :
                       selectedTask.status === 'completed' ? 'مكتملة' : 'متوقفة'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>الأولوية</Label>
                  <div className="mt-1">
                    <Badge variant={selectedTask.priority === 'critical' ? 'destructive' : 'default'}>
                      {selectedTask.priority === 'critical' ? 'حرجة' :
                       selectedTask.priority === 'high' ? 'مرتفعة' :
                       selectedTask.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* تفاصيل الجدولة */}
              <div>
                <Label>تفاصيل الجدولة</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <div className="text-sm space-y-1">
                    <div>التكرار: {
                      selectedTask.schedule.type === 'once' ? 'مرة واحدة' :
                      selectedTask.schedule.type === 'daily' ? 'يومياً' :
                      selectedTask.schedule.type === 'weekly' ? 'أسبوعياً' : 'شهرياً'
                    }</div>
                    <div>الوقت: {selectedTask.schedule.time}</div>
                    <div>التشغيل التالي: {new Date(selectedTask.nextRun).toLocaleString('ar-SA')}</div>
                    {selectedTask.lastRun && (
                      <div>آخر تشغيل: {new Date(selectedTask.lastRun).toLocaleString('ar-SA')}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* الوصف */}
              <div>
                <Label>الوصف</Label>
                <div className="mt-1 text-sm text-muted-foreground">
                  {selectedTask.description}
                </div>
              </div>

              {/* سجل التنفيذ */}
              {selectedTask.log && selectedTask.log.length > 0 && (
                <div>
                  <Label>سجل التنفيذ</Label>
                  <div className="mt-2 space-y-2">
                    {selectedTask.log.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {entry}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* شريط التقدم */}
              {selectedTask.progress !== undefined && (
                <div>
                  <Label>التقدم</Label>
                  <div className="mt-2">
                    <Progress value={selectedTask.progress} className="w-full" />
                    <div className="text-xs text-muted-foreground mt-1 text-center">
                      {selectedTask.progress}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </EnhancedDialog>
      </div>
    </ErrorBoundary>
  );
};

export default MaintenanceTools;