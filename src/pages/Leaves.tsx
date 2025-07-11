import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Calendar as CalendarIcon, Check, X, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { leavesService } from '@/services/leavesService';
import { RejectLeaveDialog } from '@/components/Leaves/RejectLeaveDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Leaves = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [leaveStats, setLeaveStats] = useState({ approved: 0, pending: 0, total: 0 });
  const [leaveBalance, setLeaveBalance] = useState({ annual: 21, sick: 14, emergency: 7 });

  const form = useForm({
    defaultValues: {
      leave_type: '',
      start_date: undefined,
      end_date: undefined,
      reason: ''
    }
  });

  // تحديث البيانات عند تحميل الصفحة
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      // جلب بيانات الموظف الحالي
      const employee = await leavesService.getCurrentUserEmployee();
      
      if (!employee) {
        toast({
          title: "تحذير",
          description: "لم يتم العثور على بيانات الموظف. يرجى التواصل مع الإدارة.",
          variant: "destructive",
        });
        return;
      }
      
      setCurrentEmployee(employee);
      
      // جلب طلبات الإجازات
      await loadLeaveRequests();
      
      // جلب الإحصائيات
      const stats = await leavesService.getLeaveStats(employee.id);
      setLeaveStats(stats);
      
      // جلب رصيد الإجازات
      const balance = await leavesService.getLeaveBalance(employee.id);
      setLeaveBalance(balance);
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات الإجازات",
        variant: "destructive",
      });
    }
  };

  const loadLeaveRequests = async () => {
    try {
      const requests = await leavesService.getLeaveRequests();
      setLeaveRequests(requests || []);
    } catch (error) {
      console.error('خطأ في تحميل طلبات الإجازات:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل طلبات الإجازات",
        variant: "destructive",
      });
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setIsLoading(true);
    try {
      await leavesService.approveLeaveRequest(requestId);
      await loadLeaveRequests();
      setViewDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم اعتماد طلب الإجازة وإرسال إشعار للموظف",
      });
    } catch (error) {
      console.error('خطأ في اعتماد الطلب:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في اعتماد طلب الإجازة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (reason: string) => {
    if (!selectedRequest) return;
    
    setIsLoading(true);
    try {
      await leavesService.rejectLeaveRequest(selectedRequest.id, reason);
      await loadLeaveRequests();
      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      toast({
        title: "تم بنجاح",
        description: "تم رفض طلب الإجازة وإرسال إشعار للموظف",
      });
    } catch (error) {
      console.error('خطأ في رفض الطلب:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في رفض طلب الإجازة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const typeConfig = {
      annual: { label: 'إجازة سنوية', variant: 'default' as const },
      sick: { label: 'إجازة مرضية', variant: 'destructive' as const },
      maternity: { label: 'إجازة أمومة', variant: 'secondary' as const },
      emergency: { label: 'ظروف طارئة', variant: 'outline' as const },
      unpaid: { label: 'إجازة بدون راتب', variant: 'outline' as const },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.annual;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'في الانتظار', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'مُوافق عليها', variant: 'default' as const, icon: Check },
      rejected: { label: 'مرفوضة', variant: 'destructive' as const, icon: X },
      cancelled: { label: 'ملغية', variant: 'outline' as const, icon: X },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const calculateDays = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const onSubmit = async (data: any) => {
    if (!currentEmployee) {
      toast({
        title: "خطأ",
        description: "لم يتم العثور على بيانات الموظف",
        variant: "destructive",
      });
      return;
    }

    if (!data.start_date || !data.end_date) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار تاريخ البداية والنهاية",
        variant: "destructive",
      });
      return;
    }

    if (!data.leave_type) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار نوع الإجازة",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const totalDays = calculateDays(data.start_date, data.end_date);
      
      const leaveRequest = {
        employee_id: currentEmployee.id,
        leave_type: data.leave_type,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: format(data.end_date, 'yyyy-MM-dd'),
        total_days: totalDays,
        reason: data.reason || '',
        status: 'pending' as const
      };

      const newRequest = await leavesService.createLeaveRequest(leaveRequest);
      
      // إضافة الطلب الجديد فوراً للقائمة
      setLeaveRequests(prev => [newRequest, ...prev]);
      
      // تحديث الإحصائيات
      setLeaveStats(prev => ({
        ...prev,
        pending: prev.pending + 1,
        total: prev.total + 1
      }));
      
      toast({
        title: "تم بنجاح",
        description: "تم إرسال طلب الإجازة بنجاح",
      });
      
      setIsDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error('خطأ في إرسال طلب الإجازة:', error);
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ في إرسال طلب الإجازة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      (request.reason && request.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === '' || statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === '' || typeFilter === 'all' || request.leave_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // التحقق من تسجيل الدخول
  if (!user) {
    return (
      <div className="container mx-auto p-6 text-center" dir="rtl">
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-4">يجب تسجيل الدخول</h2>
          <p className="text-muted-foreground">يرجى تسجيل الدخول للوصول إلى نظام الإجازات</p>
        </Card>
      </div>
    );
  }

  // التحقق من إذا كان المستخدم مديراً أو مدير موارد بشرية
  const canManageLeaves = profile?.role === 'admin' || profile?.role === 'manager';

  // عرض رسالة إذا لم يتم العثور على بيانات الموظف
  if (user && !currentEmployee) {
    return (
      <div className="container mx-auto p-6 text-center" dir="rtl">
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-4">بيانات الموظف غير موجودة</h2>
          <p className="text-muted-foreground">لم يتم العثور على بيانات الموظف. يرجى التواصل مع الإدارة لإضافة بياناتك إلى النظام.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان والإجراءات */}
      <div className="flex justify-between items-center">
        <div className="text-right">
          <h1 className="text-3xl font-bold">إدارة الإجازات</h1>
          <p className="text-muted-foreground">طلب الإجازات ومتابعة الموافقات</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              طلب إجازة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>طلب إجازة جديدة</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="leave_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الإجازة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع الإجازة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="annual">إجازة سنوية</SelectItem>
                          <SelectItem value="sick">إجازة مرضية</SelectItem>
                          <SelectItem value="maternity">إجازة أمومة</SelectItem>
                          <SelectItem value="emergency">ظروف طارئة</SelectItem>
                          <SelectItem value="unpaid">إجازة بدون راتب</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>تاريخ البداية</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-right font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ar })
                              ) : (
                                <span>اختر التاريخ</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>تاريخ النهاية</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-right font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ar })
                              ) : (
                                <span>اختر التاريخ</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>سبب الإجازة</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="اكتب سبب طلب الإجازة..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات الإجازات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <CalendarIcon className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">الرصيد المتاح</p>
                <p className="text-2xl font-bold">{leaveBalance.annual}</p>
                <p className="text-xs text-muted-foreground">يوم إجازة سنوية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Check className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">الإجازات المُوافقة</p>
                <p className="text-2xl font-bold">{leaveStats.approved}</p>
                <p className="text-xs text-muted-foreground">هذا العام</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">في الانتظار</p>
                <p className="text-2xl font-bold">{leaveStats.pending}</p>
                <p className="text-xs text-muted-foreground">طلب معلق</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <FileText className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                <p className="text-2xl font-bold">{leaveStats.total}</p>
                <p className="text-xs text-muted-foreground">هذا العام</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList className="flex justify-end w-full">
          <TabsTrigger value="calendar">التقويم</TabsTrigger>
          <TabsTrigger value="balance">رصيد الإجازات</TabsTrigger>
          <TabsTrigger value="requests">طلبات الإجازات</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              
              {/* فلاتر البحث */}
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[200px] max-w-md">
                  <Input
                    placeholder="البحث في السبب..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="pending">في الانتظار</SelectItem>
                      <SelectItem value="approved">مُوافق عليها</SelectItem>
                      <SelectItem value="rejected">مرفوضة</SelectItem>
                      <SelectItem value="cancelled">ملغية</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="نوع الإجازة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الأنواع</SelectItem>
                      <SelectItem value="annual">إجازة سنوية</SelectItem>
                      <SelectItem value="sick">إجازة مرضية</SelectItem>
                      <SelectItem value="maternity">إجازة أمومة</SelectItem>
                      <SelectItem value="emergency">ظروف طارئة</SelectItem>
                      <SelectItem value="unpaid">بدون راتب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          عرض
                        </Button>
                      </div>
                      
                      <div className="flex-1 text-right mr-4">
                        <div className="flex items-center gap-4 mb-2 justify-end">
                          {getStatusBadge(request.status)}
                          {getLeaveTypeBadge(request.leave_type)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-2 text-right">
                          <div>
                            <span className="font-medium text-muted-foreground">من:</span>
                            <span className="mr-2">{format(new Date(request.start_date), 'dd/MM/yyyy', { locale: ar })}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">إلى:</span>
                            <span className="mr-2">{format(new Date(request.end_date), 'dd/MM/yyyy', { locale: ar })}</span>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">المدة:</span>
                            <span className="mr-2">{request.total_days} يوم</span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-right">
                          <span className="font-medium text-muted-foreground">السبب:</span>
                          <span className="mr-2">{request.reason}</span>
                        </div>

                        {request.status === 'approved' && request.approved_by && (
                          <div className="text-sm text-green-600 mt-1 text-right">
                            <span className="font-medium">مُوافق من:</span>
                            <span className="mr-2">{request.approved_by}</span>
                          </div>
                        )}

                        {request.status === 'rejected' && request.rejection_reason && (
                          <div className="text-sm text-red-600 mt-1 text-right">
                            <span className="font-medium text-muted-foreground">سبب الرفض:</span>
                            <span className="mr-2">{request.rejection_reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد طلبات إجازات
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <CardTitle>رصيد الإجازات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                تفاصيل رصيد الإجازات - قريباً
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>تقويم الإجازات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                تقويم الإجازات - قريباً
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* عرض تفاصيل الطلب */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-right">تفاصيل طلب الإجازة</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6" dir="rtl">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">نوع الإجازة</label>
                    <div className="mt-1">
                      {getLeaveTypeBadge(selectedRequest.leave_type)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">حالة الطلب</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">تاريخ البداية</label>
                    <p className="mt-1">{format(new Date(selectedRequest.start_date), 'dd/MM/yyyy', { locale: ar })}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">تاريخ النهاية</label>
                    <p className="mt-1">{format(new Date(selectedRequest.end_date), 'dd/MM/yyyy', { locale: ar })}</p>
                  </div>
                </div>
              </div>

              {/* المدة */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">مدة الإجازة</label>
                <p className="mt-1 text-lg font-semibold">{selectedRequest.total_days} يوم</p>
              </div>

              {/* السبب */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">سبب الإجازة</label>
                <p className="mt-1 p-3 bg-muted rounded-lg">{selectedRequest.reason}</p>
              </div>

              {/* معلومات الموافقة أو الرفض */}
              {selectedRequest.status === 'approved' && selectedRequest.approved_by && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">تفاصيل الموافقة</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">مُوافق من:</span> {selectedRequest.approved_by}</p>
                    <p><span className="font-medium">تاريخ الموافقة:</span> {format(new Date(selectedRequest.approved_at), 'dd/MM/yyyy', { locale: ar })}</p>
                  </div>
                </div>
              )}

              {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-800 mb-2">سبب الرفض</h4>
                  <p className="text-sm text-red-700">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {/* معلومات إضافية */}
              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">تاريخ الإنشاء:</span>
                    <span className="mr-2">{format(new Date(selectedRequest.created_at), 'dd/MM/yyyy', { locale: ar })}</span>
                  </div>
                  <div>
                    <span className="font-medium">رقم الطلب:</span>
                    <span className="mr-2">#{selectedRequest.id}</span>
                  </div>
                </div>
              </div>

              {/* الإجراءات */}
              <div className="flex gap-2 pt-4">
                {selectedRequest.status === 'pending' && canManageLeaves && (
                  <>
                    <Button 
                      onClick={() => handleApproveRequest(selectedRequest.id)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? 'جاري الاعتماد...' : 'اعتماد'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => setRejectDialogOpen(true)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      رفض الطلب
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setViewDialogOpen(false)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* dialog رفض الطلب */}
      <RejectLeaveDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onConfirm={handleRejectRequest}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Leaves;