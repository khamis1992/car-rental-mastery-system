import React, { useState } from 'react';
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
import { 
  HeadphonesIcon, 
  MessageSquare,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Building2,
  Search,
  MoreHorizontal,
  Eye,
  MessageCircle,
  FileText,
  Zap,
  Calendar,
  Tag,
  Filter,
  Send,
  Paperclip,
  BarChart3,
  Plus,
  RefreshCw,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// استيراد المكونات المحسنة
import { EnhancedDialog } from '@/components/ui/enhanced-dialog';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { ActionButton, EnhancedButton } from '@/components/ui/enhanced-button';
import { LoadingState, ErrorBoundary } from '@/components/ui/enhanced-error-handling';
import { useTranslation, formatStatus } from '@/utils/translationUtils';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'feature_request' | 'bug_report' | 'general';
  tenantId: string;
  tenantName: string;
  userEmail: string;
  userName: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  lastResponse?: string;
  responseTime?: number; // hours
  resolutionTime?: number; // hours
  tags: string[];
  attachments?: string[];
}

interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  targetType: 'all' | 'tenant' | 'role';
  targetValue?: string;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdBy: string;
  createdAt: string;
}

const SupportTools: React.FC = () => {
  const { toast } = useToast();
  const { t, msg, formatNumber } = useTranslation();
  
  // State management
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showCreateNotification, setShowCreateNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // نموذج تذكرة جديدة
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'medium' as const,
    category: 'general' as const,
    tenantId: '',
    assignedTo: ''
  });

  // نموذج إشعار جديد
  const [newNotificationForm, setNewNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info' as const,
    targetType: 'all' as const,
    targetValue: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  const [supportTickets] = useState<SupportTicket[]>([
    {
      id: '1',
      ticketNumber: 'T-2024-001',
      subject: 'مشكلة في تسجيل الدخول',
      description: 'لا أستطيع تسجيل الدخول إلى النظام منذ أمس',
      status: 'open',
      priority: 'high',
      category: 'technical',
      tenantId: 'tenant-1',
      tenantName: 'شركة الخليج للنقل',
      userEmail: 'admin@gulf-transport.com',
      userName: 'أحمد محمد',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      tags: ['login', 'urgent'],
      responseTime: 2,
      attachments: ['screenshot.png']
    },
    {
      id: '2',
      ticketNumber: 'T-2024-002',
      subject: 'طلب ميزة جديدة',
      description: 'نحتاج إلى إضافة تقارير مخصصة للعقود',
      status: 'in_progress',
      priority: 'medium',
      category: 'feature_request',
      tenantId: 'tenant-2',
      tenantName: 'مؤسسة الكويت للسيارات',
      userEmail: 'manager@kuwait-cars.com',
      userName: 'سارة أحمد',
      assignedTo: 'فريق التطوير',
      createdAt: '2024-01-14T14:20:00Z',
      updatedAt: '2024-01-15T09:15:00Z',
      lastResponse: '2024-01-15T09:15:00Z',
      tags: ['enhancement', 'reports'],
      responseTime: 4,
      resolutionTime: 24
    }
  ]);

  const [systemNotifications] = useState<SystemNotification[]>([
    {
      id: '1',
      title: 'صيانة مجدولة',
      message: 'سيتم إجراء صيانة للنظام يوم الجمعة من 2:00 إلى 4:00 صباحاً',
      type: 'warning',
      targetType: 'all',
      isActive: true,
      startDate: '2024-01-15T00:00:00Z',
      endDate: '2024-01-20T00:00:00Z',
      createdBy: 'مدير النظام',
      createdAt: '2024-01-15T08:00:00Z'
    }
  ]);

  // تعريف أعمدة جدول التذاكر
  const ticketColumns = [
    {
      key: 'ticketNumber',
      title: 'رقم التذكرة',
      sortable: true,
      render: (value: string, row: SupportTicket) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <HeadphonesIcon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-xs text-muted-foreground">{row.subject}</div>
          </div>
        </div>
      )
    },
    {
      key: 'priority',
      title: 'الأولوية',
      align: 'center' as const,
      render: (priority: string) => {
        const priorityColors = {
          urgent: 'bg-red-100 text-red-800',
          high: 'bg-orange-100 text-orange-800',
          medium: 'bg-yellow-100 text-yellow-800',
          low: 'bg-green-100 text-green-800'
        };
        const priorityLabels = {
          urgent: 'عاجل',
          high: 'مرتفع',
          medium: 'متوسط',
          low: 'منخفض'
        };
        return (
          <Badge className={priorityColors[priority as keyof typeof priorityColors]}>
            {priorityLabels[priority as keyof typeof priorityLabels]}
          </Badge>
        );
      }
    },
    {
      key: 'status',
      title: 'الحالة',
      align: 'center' as const,
      render: (status: string) => {
        const statusInfo = formatStatus(status);
        return (
          <Badge variant={statusInfo.variant as any}>
            {statusInfo.text}
          </Badge>
        );
      }
    },
    {
      key: 'tenantName',
      title: 'المؤسسة',
      render: (tenantName: string) => (
        <span className="text-sm text-muted-foreground">{tenantName}</span>
      )
    },
    {
      key: 'createdAt',
      title: 'تاريخ الإنشاء',
      render: (date: string) => (
        <span className="text-sm text-muted-foreground">
          {new Date(date).toLocaleDateString('ar-SA')}
        </span>
      )
    }
  ];

  // تعريف إجراءات التذاكر
  const ticketActions = [
    {
      label: 'عرض التفاصيل',
      icon: <Eye className="w-4 h-4" />,
      onClick: (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setShowTicketDetails(true);
      }
    },
    {
      label: 'الرد',
      icon: <MessageCircle className="w-4 h-4" />,
      onClick: (ticket: SupportTicket) => {
        toast({
          title: 'فتح نافذة الرد',
          description: `سيتم فتح نافذة الرد على التذكرة ${ticket.ticketNumber}`
        });
      }
    },
    {
      label: 'تعيين',
      icon: <User className="w-4 h-4" />,
      onClick: (ticket: SupportTicket) => {
        toast({
          title: 'تعيين التذكرة',
          description: 'ميزة التعيين ستكون متاحة قريباً'
        });
      }
    }
  ];

  // معالجات الأحداث
  const handleCreateTicket = async () => {
    setLoading(true);
    try {
      // منطق إنشاء التذكرة
      await new Promise(resolve => setTimeout(resolve, 1000)); // محاكاة API
      
      toast({
        title: 'تم إنشاء التذكرة بنجاح',
        description: `تم إنشاء التذكرة ${newTicketForm.subject} بنجاح`
      });
      
      setShowCreateTicket(false);
      setNewTicketForm({
        subject: '',
        description: '',
        priority: 'medium',
        category: 'general',
        tenantId: '',
        assignedTo: ''
      });
    } catch (error) {
      toast({
        title: 'خطأ في إنشاء التذكرة',
        description: 'حدث خطأ أثناء إنشاء التذكرة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async () => {
    setLoading(true);
    try {
      // منطق إنشاء الإشعار
      await new Promise(resolve => setTimeout(resolve, 1000)); // محاكاة API
      
      toast({
        title: 'تم إنشاء الإشعار بنجاح',
        description: `تم إنشاء الإشعار ${newNotificationForm.title} بنجاح`
      });
      
      setShowCreateNotification(false);
      setNewNotificationForm({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        targetValue: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
      });
    } catch (error) {
      toast({
        title: 'خطأ في إنشاء الإشعار',
        description: 'حدث خطأ أثناء إنشاء الإشعار',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // إحصائيات الدعم
  const supportStats = {
    total: supportTickets.length,
    open: supportTickets.filter(t => t.status === 'open').length,
    in_progress: supportTickets.filter(t => t.status === 'in_progress').length,
    resolved: supportTickets.filter(t => t.status === 'resolved').length
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">أدوات الدعم الفني</h2>
            <p className="text-muted-foreground">
              إدارة طلبات الدعم الفني والإشعارات
            </p>
          </div>
          <div className="flex gap-2">
            <EnhancedButton
              onClick={() => window.location.reload()}
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
              loadingText="جاري التحديث..."
            >
              تحديث
            </EnhancedButton>
            <ActionButton
              action="create"
              itemName="تذكرة جديدة"
              onClick={() => setShowCreateTicket(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              تذكرة جديدة
            </ActionButton>
            <ActionButton
              action="create"
              itemName="إشعار جديد"
              onClick={() => setShowCreateNotification(true)}
              icon={<MessageSquare className="w-4 h-4" />}
              variant="outline"
            >
              إشعار جديد
            </ActionButton>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">المجموع</p>
                  <p className="text-2xl font-bold text-right">{formatNumber(supportStats.total)}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <HeadphonesIcon className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">مفتوحة</p>
                  <p className="text-2xl font-bold text-red-600 text-right">{formatNumber(supportStats.open)}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">قيد المعالجة</p>
                  <p className="text-2xl font-bold text-orange-600 text-right">{formatNumber(supportStats.in_progress)}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground text-right">محلولة</p>
                  <p className="text-2xl font-bold text-green-600 text-right">{formatNumber(supportStats.resolved)}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tickets">تذاكر الدعم</TabsTrigger>
            <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
            <TabsTrigger value="analytics">التحليلات</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets">
            <LoadingState
              loading={false}
              isEmpty={supportTickets.length === 0}
              emptyMessage="لا توجد تذاكر دعم"
            >
              <EnhancedTable
                data={supportTickets}
                columns={ticketColumns}
                actions={ticketActions}
                searchable
                searchPlaceholder="البحث في التذاكر..."
                onRefresh={() => window.location.reload()}
                emptyMessage="لا توجد تذاكر دعم"
                maxHeight="600px"
                stickyHeader
              />
            </LoadingState>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-4">
              {systemNotifications.map((notification) => (
                <Card key={notification.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={notification.type === 'warning' ? 'destructive' : 'default'}>
                            {notification.type === 'warning' ? 'تحذير' : 'معلومات'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        <h3 className="font-medium text-lg mb-2">{notification.title}</h3>
                        <p className="text-muted-foreground">{notification.message}</p>
                        <div className="mt-3 text-xs text-muted-foreground">
                          <span>بواسطة: {notification.createdBy}</span>
                          {notification.endDate && (
                            <span className="mr-4">
                              ينتهي: {new Date(notification.endDate).toLocaleDateString('ar-SA')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات الأداء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>متوسط وقت الاستجابة</span>
                      <span className="font-medium">2.5 ساعة</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>معدل الحل</span>
                      <span className="font-medium">85%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>رضا العملاء</span>
                      <span className="font-medium">4.2/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>التذاكر حسب الفئة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>تقنية</span>
                      <span className="font-medium">45%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>فوترة</span>
                      <span className="font-medium">25%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>طلبات ميزات</span>
                      <span className="font-medium">20%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>عامة</span>
                      <span className="font-medium">10%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Ticket Dialog */}
        <EnhancedDialog
          open={showCreateTicket}
          onOpenChange={setShowCreateTicket}
          title="إنشاء تذكرة دعم جديدة"
          description="قم بملء المعلومات لإنشاء تذكرة دعم جديدة"
          size="lg"
          showCloseButton
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ticket-subject">موضوع التذكرة</Label>
                <Input
                  id="ticket-subject"
                  value={newTicketForm.subject}
                  onChange={(e) => setNewTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="اكتب موضوع التذكرة..."
                />
              </div>
              <div>
                <Label htmlFor="ticket-priority">الأولوية</Label>
                <Select
                  value={newTicketForm.priority}
                  onValueChange={(value) => setNewTicketForm(prev => ({ ...prev, priority: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الأولوية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">مرتفعة</SelectItem>
                    <SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ticket-category">الفئة</Label>
                <Select
                  value={newTicketForm.category}
                  onValueChange={(value) => setNewTicketForm(prev => ({ ...prev, category: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">تقنية</SelectItem>
                    <SelectItem value="billing">فوترة</SelectItem>
                    <SelectItem value="feature_request">طلب ميزة</SelectItem>
                    <SelectItem value="bug_report">بلاغ خطأ</SelectItem>
                    <SelectItem value="general">عامة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ticket-assigned">المعين إليه</Label>
                <Input
                  id="ticket-assigned"
                  value={newTicketForm.assignedTo}
                  onChange={(e) => setNewTicketForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                  placeholder="اسم الموظف المسؤول (اختياري)"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ticket-description">وصف المشكلة</Label>
              <Textarea
                id="ticket-description"
                value={newTicketForm.description}
                onChange={(e) => setNewTicketForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="اكتب وصفاً مفصلاً للمشكلة..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateTicket(false)}
              >
                إلغاء
              </Button>
              <ActionButton
                action="create"
                itemName="التذكرة"
                onClick={handleCreateTicket}
                loading={loading}
              >
                إنشاء التذكرة
              </ActionButton>
            </div>
          </div>
        </EnhancedDialog>

        {/* Create Notification Dialog */}
        <EnhancedDialog
          open={showCreateNotification}
          onOpenChange={setShowCreateNotification}
          title="إنشاء إشعار جديد"
          description="قم بإنشاء إشعار للمستخدمين في النظام"
          size="lg"
          showCloseButton
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="notification-title">عنوان الإشعار</Label>
                <Input
                  id="notification-title"
                  value={newNotificationForm.title}
                  onChange={(e) => setNewNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="اكتب عنوان الإشعار..."
                />
              </div>
              <div>
                <Label htmlFor="notification-type">نوع الإشعار</Label>
                <Select
                  value={newNotificationForm.type}
                  onValueChange={(value) => setNewNotificationForm(prev => ({ ...prev, type: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">معلومات</SelectItem>
                    <SelectItem value="warning">تحذير</SelectItem>
                    <SelectItem value="error">خطأ</SelectItem>
                    <SelectItem value="success">نجاح</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="notification-target">الجمهور المستهدف</Label>
                <Select
                  value={newNotificationForm.targetType}
                  onValueChange={(value) => setNewNotificationForm(prev => ({ ...prev, targetType: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الجمهور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المستخدمين</SelectItem>
                    <SelectItem value="tenant">مؤسسة محددة</SelectItem>
                    <SelectItem value="role">دور محدد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notification-start">تاريخ البداية</Label>
                <Input
                  id="notification-start"
                  type="date"
                  value={newNotificationForm.startDate}
                  onChange={(e) => setNewNotificationForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notification-message">محتوى الإشعار</Label>
              <Textarea
                id="notification-message"
                value={newNotificationForm.message}
                onChange={(e) => setNewNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="اكتب محتوى الإشعار..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateNotification(false)}
              >
                إلغاء
              </Button>
              <ActionButton
                action="create"
                itemName="الإشعار"
                onClick={handleCreateNotification}
                loading={loading}
              >
                إنشاء الإشعار
              </ActionButton>
            </div>
          </div>
        </EnhancedDialog>

        {/* Ticket Details Dialog */}
        <EnhancedDialog
          open={showTicketDetails}
          onOpenChange={setShowTicketDetails}
          title={selectedTicket ? `تفاصيل التذكرة ${selectedTicket.ticketNumber}` : ''}
          description="عرض تفاصيل التذكرة والردود"
          size="xl"
          showCloseButton
        >
          {selectedTicket && (
            <div className="space-y-6">
              {/* معلومات التذكرة */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>رقم التذكرة</Label>
                  <div className="mt-1 text-sm">{selectedTicket.ticketNumber}</div>
                </div>
                <div>
                  <Label>الحالة</Label>
                  <div className="mt-1">
                    <Badge variant={selectedTicket.status === 'open' ? 'destructive' : 'default'}>
                      {selectedTicket.status === 'open' ? 'مفتوحة' : 
                       selectedTicket.status === 'in_progress' ? 'قيد المعالجة' : 'محلولة'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>الأولوية</Label>
                  <div className="mt-1">
                    <Badge variant={selectedTicket.priority === 'urgent' ? 'destructive' : 'default'}>
                      {selectedTicket.priority === 'urgent' ? 'عاجل' : 
                       selectedTicket.priority === 'high' ? 'مرتفع' : 'متوسط'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>المؤسسة</Label>
                  <div className="mt-1 text-sm">{selectedTicket.tenantName}</div>
                </div>
              </div>

              {/* موضوع ووصف التذكرة */}
              <div>
                <Label>الموضوع</Label>
                <div className="mt-1 text-sm font-medium">{selectedTicket.subject}</div>
              </div>

              <div>
                <Label>الوصف</Label>
                <div className="mt-1 text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                  {selectedTicket.description}
                </div>
              </div>

              {/* المرفقات */}
              {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                <div>
                  <Label>المرفقات</Label>
                  <div className="mt-2 flex gap-2">
                    {selectedTicket.attachments.map((attachment, index) => (
                      <Badge key={index} variant="outline" className="cursor-pointer">
                        <Paperclip className="w-3 h-3 mr-1" />
                        {attachment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* إجراءات */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 ml-2" />
                  إضافة رد
                </Button>
                <Button variant="outline">
                  <User className="w-4 h-4 ml-2" />
                  تعيين
                </Button>
                <Button>
                  <CheckCircle className="w-4 h-4 ml-2" />
                  حل التذكرة
                </Button>
              </div>
            </div>
          )}
        </EnhancedDialog>
      </div>
    </ErrorBoundary>
  );
};

export default SupportTools;