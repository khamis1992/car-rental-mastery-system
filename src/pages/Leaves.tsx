import React, { useState } from 'react';
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

const Leaves = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const form = useForm({
    defaultValues: {
      leave_type: '',
      start_date: undefined,
      end_date: undefined,
      reason: ''
    }
  });

  const mockLeaveRequests = [
    {
      id: '1',
      leave_type: 'annual',
      start_date: '2024-02-01',
      end_date: '2024-02-05',
      total_days: 5,
      reason: 'إجازة سنوية',
      status: 'approved',
      approved_by: 'أحمد المدير',
      approved_at: '2024-01-25',
      created_at: '2024-01-20'
    },
    {
      id: '2',
      leave_type: 'sick',
      start_date: '2024-01-15',
      end_date: '2024-01-16',
      total_days: 2,
      reason: 'إجازة مرضية',
      status: 'pending',
      created_at: '2024-01-14'
    },
    {
      id: '3',
      leave_type: 'emergency',
      start_date: '2024-01-10',
      end_date: '2024-01-10',
      total_days: 1,
      reason: 'ظروف طارئة',
      status: 'rejected',
      rejection_reason: 'لا يمكن الموافقة في هذا التوقيت',
      created_at: '2024-01-09'
    }
  ];

  const getLeaveTypeBadge = (type: string) => {
    const typeConfig = {
      annual: { label: 'إجازة سنوية', variant: 'default' as const },
      sick: { label: 'إجازة مرضية', variant: 'secondary' as const },
      maternity: { label: 'إجازة أمومة', variant: 'outline' as const },
      emergency: { label: 'ظروف طارئة', variant: 'destructive' as const },
      unpaid: { label: 'إجازة بدون راتب', variant: 'secondary' as const },
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

  const onSubmit = (data: any) => {
    console.log('طلب إجازة جديد:', data);
    setIsDialogOpen(false);
    form.reset();
  };

  const filteredRequests = mockLeaveRequests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === '' || typeFilter === 'all' || request.leave_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان والإجراءات */}
      <div className="flex justify-between items-center">
        <div>
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
                  <Button type="submit" className="flex-1">
                    إرسال الطلب
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
                <p className="text-2xl font-bold">21</p>
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
                <p className="text-2xl font-bold">8</p>
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
                <p className="text-2xl font-bold">2</p>
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
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">هذا العام</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">طلبات الإجازات</TabsTrigger>
          <TabsTrigger value="balance">رصيد الإجازات</TabsTrigger>
          <TabsTrigger value="calendar">التقويم</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>طلبات الإجازات</CardTitle>
              
              {/* فلاتر البحث */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="البحث في السبب..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
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
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          {getLeaveTypeBadge(request.leave_type)}
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm mb-2">
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
                        
                        <div className="text-sm">
                          <span className="font-medium text-muted-foreground">السبب:</span>
                          <span className="mr-2">{request.reason}</span>
                        </div>

                        {request.status === 'approved' && request.approved_by && (
                          <div className="text-sm text-green-600 mt-1">
                            <span className="font-medium">مُوافق من:</span>
                            <span className="mr-2">{request.approved_by}</span>
                          </div>
                        )}

                        {request.status === 'rejected' && request.rejection_reason && (
                          <div className="text-sm text-red-600 mt-1">
                            <span className="font-medium">سبب الرفض:</span>
                            <span className="mr-2">{request.rejection_reason}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">عرض</Button>
                        {request.status === 'pending' && (
                          <Button variant="outline" size="sm">إلغاء</Button>
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
    </div>
  );
};

export default Leaves;