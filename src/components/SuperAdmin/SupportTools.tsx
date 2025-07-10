import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [showCreateNotification, setShowCreateNotification] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

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
    },
    {
      id: '3',
      ticketNumber: 'T-2024-003',
      subject: 'خطأ في حساب الفاتورة',
      description: 'الفاتورة رقم INV-001 تحتوي على خطأ في المبلغ',
      status: 'resolved',
      priority: 'high',
      category: 'billing',
      tenantId: 'tenant-1',
      tenantName: 'شركة الخليج للنقل',
      userEmail: 'accounting@gulf-transport.com',
      userName: 'محمد علي',
      assignedTo: 'فريق المحاسبة',
      createdAt: '2024-01-13T16:45:00Z',
      updatedAt: '2024-01-14T11:30:00Z',
      lastResponse: '2024-01-14T11:30:00Z',
      tags: ['billing', 'resolved'],
      responseTime: 1,
      resolutionTime: 18
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
    },
    {
      id: '2',
      title: 'ميزة جديدة متاحة',
      message: 'تم إضافة ميزة التقارير المتقدمة للحسابات المميزة',
      type: 'success',
      targetType: 'role',
      targetValue: 'premium',
      isActive: true,
      startDate: '2024-01-14T00:00:00Z',
      createdBy: 'فريق التطوير',
      createdAt: '2024-01-14T12:00:00Z'
    }
  ]);

  const getStatusBadge = (status: string) => {
    const variants = {
      open: { text: 'مفتوح', color: 'bg-blue-100 text-blue-800' },
      in_progress: { text: 'قيد المعالجة', color: 'bg-yellow-100 text-yellow-800' },
      resolved: { text: 'تم الحل', color: 'bg-green-100 text-green-800' },
      closed: { text: 'مغلق', color: 'bg-gray-100 text-gray-800' }
    };
    
    const statusInfo = variants[status as keyof typeof variants] || variants.open;
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: { text: 'منخفض', color: 'bg-gray-100 text-gray-800' },
      medium: { text: 'متوسط', color: 'bg-blue-100 text-blue-800' },
      high: { text: 'عالي', color: 'bg-orange-100 text-orange-800' },
      urgent: { text: 'عاجل', color: 'bg-red-100 text-red-800' }
    };
    
    const priorityInfo = variants[priority as keyof typeof variants] || variants.medium;
    return (
      <Badge className={priorityInfo.color}>
        {priorityInfo.text}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      technical: Zap,
      billing: FileText,
      feature_request: MessageSquare,
      bug_report: AlertTriangle,
      general: MessageCircle
    };
    
    const Icon = icons[category as keyof typeof icons] || MessageCircle;
    return <Icon className="w-4 h-4" />;
  };

  const getNotificationTypeBadge = (type: string) => {
    const variants = {
      info: { text: 'معلومات', color: 'bg-blue-100 text-blue-800' },
      warning: { text: 'تحذير', color: 'bg-yellow-100 text-yellow-800' },
      error: { text: 'خطأ', color: 'bg-red-100 text-red-800' },
      success: { text: 'نجح', color: 'bg-green-100 text-green-800' }
    };
    
    const typeInfo = variants[type as keyof typeof variants] || variants.info;
    return (
      <Badge className={typeInfo.color}>
        {typeInfo.text}
      </Badge>
    );
  };

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const TicketDetailsDialog = ({ ticket }: { ticket: SupportTicket }) => (
    <Dialog open={showTicketDetails} onOpenChange={setShowTicketDetails}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getCategoryIcon(ticket.category)}
            التذكرة #{ticket.ticketNumber}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
            <span>•</span>
            <span>{ticket.tenantName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">تفاصيل التذكرة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الموضوع:</span>
                  <span>{ticket.subject}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الفئة:</span>
                  <span>
                    {ticket.category === 'technical' && 'تقني'}
                    {ticket.category === 'billing' && 'فوترة'}
                    {ticket.category === 'feature_request' && 'طلب ميزة'}
                    {ticket.category === 'bug_report' && 'تقرير خطأ'}
                    {ticket.category === 'general' && 'عام'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">مُسند إلى:</span>
                  <span>{ticket.assignedTo || 'غير مُسند'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <span>{new Date(ticket.createdAt).toLocaleString('ar-SA')}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">معلومات المستخدم</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الاسم:</span>
                  <span>{ticket.userName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">البريد:</span>
                  <span>{ticket.userEmail}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المؤسسة:</span>
                  <span>{ticket.tenantName}</span>
                </div>
                {ticket.responseTime && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">وقت الرد:</span>
                    <span>{ticket.responseTime} ساعة</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">الوصف</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{ticket.description}</p>
            </CardContent>
          </Card>

          {ticket.tags.length > 0 && (
            <div>
              <Label className="text-sm font-medium">العلامات</Label>
              <div className="flex gap-2 mt-2">
                {ticket.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 ml-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {ticket.attachments && ticket.attachments.length > 0 && (
            <div>
              <Label className="text-sm font-medium">المرفقات</Label>
              <div className="space-y-2 mt-2">
                {ticket.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <Paperclip className="w-4 h-4" />
                    <span className="text-sm">{attachment}</span>
                    <Button size="sm" variant="ghost">تحميل</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">الرد على التذكرة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="اكتب ردك هنا..."
                className="min-h-[100px]"
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Paperclip className="w-4 h-4" />
                    إرفاق ملف
                  </Button>
                  <Select>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="تغيير الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">مفتوح</SelectItem>
                      <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                      <SelectItem value="resolved">تم الحل</SelectItem>
                      <SelectItem value="closed">مغلق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button>
                  <Send className="w-4 h-4 ml-2" />
                  إرسال الرد
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">أدوات الدعم الفني</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCreateNotification(true)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            إشعار جديد
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tickets">تذاكر الدعم</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          <TabsTrigger value="analytics">تحليلات الدعم</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <HeadphonesIcon className="w-5 h-5" />
                  تذاكر الدعم الفني
                </span>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث في التذاكر..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      <SelectItem value="open">مفتوح</SelectItem>
                      <SelectItem value="in_progress">قيد المعالجة</SelectItem>
                      <SelectItem value="resolved">تم الحل</SelectItem>
                      <SelectItem value="closed">مغلق</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأولويات</SelectItem>
                      <SelectItem value="urgent">عاجل</SelectItem>
                      <SelectItem value="high">عالي</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="low">منخفض</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم التذكرة</TableHead>
                    <TableHead className="text-right">الموضوع</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الأولوية</TableHead>
                    <TableHead className="text-right">المؤسسة</TableHead>
                    <TableHead className="text-right">المستخدم</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(ticket.category)}
                          <span className="font-medium">{ticket.subject}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {ticket.tenantName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ticket.userName}</div>
                          <div className="text-sm text-muted-foreground">{ticket.userEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(ticket.createdAt).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setShowTicketDetails(true);
                              }}
                            >
                              <Eye className="w-4 h-4 ml-2" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageCircle className="w-4 h-4 ml-2" />
                              الرد
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <User className="w-4 h-4 ml-2" />
                              إسناد
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  إشعارات النظام
                </span>
                <Button
                  onClick={() => setShowCreateNotification(true)}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  إشعار جديد
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemNotifications.map((notification) => (
                  <Card key={notification.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{notification.title}</h4>
                            {getNotificationTypeBadge(notification.type)}
                            {notification.isActive && (
                              <Badge className="bg-green-100 text-green-800">نشط</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>الهدف: {notification.targetType === 'all' ? 'جميع المستخدمين' : notification.targetValue}</span>
                            <span>•</span>
                            <span>بواسطة: {notification.createdBy}</span>
                            <span>•</span>
                            <span>{new Date(notification.createdAt).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>تحرير</DropdownMenuItem>
                            <DropdownMenuItem>تعطيل</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">حذف</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">إجمالي التذاكر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">124</div>
                <p className="text-xs text-muted-foreground">+12% من الشهر الماضي</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">متوسط وقت الرد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.5 ساعة</div>
                <p className="text-xs text-muted-foreground">-15% تحسن</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">معدل الحل</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94%</div>
                <p className="text-xs text-muted-foreground">+3% تحسن</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>تحليلات مفصلة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                سيتم تطوير التحليلات المفصلة قريباً
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedTicket && <TicketDetailsDialog ticket={selectedTicket} />}
    </div>
  );
};

export default SupportTools;