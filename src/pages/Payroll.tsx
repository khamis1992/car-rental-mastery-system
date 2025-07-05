import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Calculator, FileText, Download, Eye, Search, Plus, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { payrollService, PayrollWithDetails, PayrollFilters, PayrollSettings } from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';

const Payroll = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [payrollData, setPayrollData] = useState<PayrollWithDetails[]>([]);
  const [stats, setStats] = useState({
    totalGross: 0,
    totalNet: 0,
    totalDeductions: 0,
    paidCount: 0,
    totalCount: 0
  });
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const { toast } = useToast();

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    loadPayrollData();
    loadPayrollStats();
    loadPayrollSettings();
  }, []);

  // تحميل البيانات عند تغيير الفلاتر
  useEffect(() => {
    loadPayrollData();
  }, [searchTerm, statusFilter, monthFilter]);

  const loadPayrollData = async () => {
    try {
      setLoading(true);
      
      const filters: PayrollFilters = {
        searchTerm: searchTerm || undefined,
        status: statusFilter || undefined,
        month: monthFilter ? parseInt(monthFilter) : undefined,
        year: monthFilter ? new Date().getFullYear() : undefined
      };

      const data = await payrollService.getAllPayroll(filters);
      setPayrollData(data);
    } catch (error) {
      console.error('خطأ في تحميل بيانات الرواتب:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل بيانات الرواتب',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollStats = async () => {
    try {
      const statsData = await payrollService.getPayrollStats();
      setStats(statsData);
    } catch (error) {
      console.error('خطأ في تحميل الإحصائيات:', error);
    }
  };

  const loadPayrollSettings = async () => {
    try {
      const settingsData = await payrollService.getPayrollSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('خطأ في تحميل الإعدادات:', error);
    }
  };

  const handleCalculateMonthlyPayroll = async () => {
    try {
      setCalculating(true);
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const calculatedCount = await payrollService.calculateMonthlyPayroll(currentYear, currentMonth);
      
      toast({
        title: 'تم حساب الرواتب',
        description: `تم حساب ${calculatedCount} راتب بنجاح`
      });
      
      // إعادة تحميل البيانات
      await loadPayrollData();
      await loadPayrollStats();
    } catch (error) {
      console.error('خطأ في حساب الرواتب:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حساب الرواتب',
        variant: 'destructive'
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleApprovePayroll = async (id: string) => {
    try {
      await payrollService.approvePayroll(id);
      toast({
        title: 'تم الموافقة',
        description: 'تمت الموافقة على الراتب بنجاح'
      });
      await loadPayrollData();
      await loadPayrollStats();
    } catch (error) {
      console.error('خطأ في الموافقة على الراتب:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في الموافقة على الراتب',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await payrollService.markPayrollAsPaid(id);
      toast({
        title: 'تم التسديد',
        description: 'تم تسجيل دفع الراتب بنجاح'
      });
      await loadPayrollData();
      await loadPayrollStats();
    } catch (error) {
      console.error('خطأ في تسجيل الدفع:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تسجيل الدفع',
        variant: 'destructive'
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      await payrollService.updatePayrollSettings(settings);
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ إعدادات الرواتب بنجاح'
      });
    } catch (error) {
      console.error('خطأ في حفظ الإعدادات:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في حفظ الإعدادات',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'مسودة', variant: 'outline' as const },
      calculated: { label: 'محسوب', variant: 'secondary' as const },
      approved: { label: 'مُوافق عليه', variant: 'default' as const },
      paid: { label: 'مدفوع', variant: 'default' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const getActionButtons = (payroll: PayrollWithDetails) => {
    const buttons = [
      <Button key="view" variant="ghost" size="sm">
        <Eye className="w-4 h-4" />
      </Button>,
      <Button key="download" variant="ghost" size="sm">
        <Download className="w-4 h-4" />
      </Button>
    ];

    if (payroll.status === 'calculated') {
      buttons.push(
        <Button 
          key="approve" 
          variant="ghost" 
          size="sm"
          onClick={() => handleApprovePayroll(payroll.id)}
          className="text-green-600 hover:text-green-700"
        >
          موافقة
        </Button>
      );
    }

    if (payroll.status === 'approved') {
      buttons.push(
        <Button 
          key="paid" 
          variant="ghost" 
          size="sm"
          onClick={() => handleMarkAsPaid(payroll.id)}
          className="text-blue-600 hover:text-blue-700"
        >
          مدفوع
        </Button>
      );
    }

    return buttons;
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان والإجراءات */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الرواتب</h1>
          <p className="text-muted-foreground">حساب ومعالجة رواتب الموظفين</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCalculateMonthlyPayroll} disabled={calculating}>
            <FileText className="w-4 h-4 ml-2" />
            {calculating ? 'جاري الحساب...' : 'إنشاء كشف راتب'}
          </Button>
        </div>
      </div>

      {/* إحصائيات الرواتب */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <DollarSign className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الرواتب</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalGross)}</p>
                <p className="text-xs text-muted-foreground">هذا الشهر</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Calculator className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">صافي الرواتب</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalNet)}</p>
                <p className="text-xs text-muted-foreground">بعد الخصومات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <FileText className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalDeductions)}</p>
                <p className="text-xs text-muted-foreground">ضرائب وتأمينات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <DollarSign className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">الرواتب المدفوعة</p>
                <p className="text-2xl font-bold">{stats.paidCount}</p>
                <p className="text-xs text-muted-foreground">من أصل {stats.totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="w-fit ml-auto">
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
          <TabsTrigger value="history">سجل الرواتب</TabsTrigger>
          <TabsTrigger value="current">الشهر الحالي</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">رواتب الشهر الحالي</CardTitle>
              
              {/* فلاتر البحث */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="البحث باسم الموظف أو الرقم..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="calculated">محسوب</SelectItem>
                    <SelectItem value="approved">مُوافق عليه</SelectItem>
                    <SelectItem value="paid">مدفوع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الإجراءات</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الصافي</TableHead>
                        <TableHead>الإجمالي</TableHead>
                        <TableHead>الخصومات</TableHead>
                        <TableHead>الإضافات</TableHead>
                        <TableHead>الراتب الأساسي</TableHead>
                        <TableHead>الموظف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollData.map((payroll) => (
                        <TableRow key={payroll.id}>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                          <TableCell className="font-medium text-green-600">{formatCurrency(payroll.net_salary)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(payroll.gross_salary)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {payroll.deductions > 0 && <div>خصومات: {formatCurrency(payroll.deductions)}</div>}
                              <div>ضريبة: {formatCurrency(payroll.tax_deduction)}</div>
                              <div>تأمين: {formatCurrency(payroll.social_insurance)}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>إضافي: {formatCurrency(payroll.overtime_amount)}</div>
                              <div>بدلات: {formatCurrency(payroll.allowances)}</div>
                              {payroll.bonuses > 0 && <div>مكافآت: {formatCurrency(payroll.bonuses)}</div>}
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(payroll.basic_salary)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{payroll.employee_name}</div>
                              <div className="text-sm text-muted-foreground">{payroll.employee_number}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                {payrollData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد بيانات رواتب
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">سجل الرواتب</CardTitle>
              
              {/* فلاتر السجل التاريخي */}
              <div className="flex flex-wrap gap-4 mt-4">
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="الشهر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الشهور</SelectItem>
                    <SelectItem value="1">يناير</SelectItem>
                    <SelectItem value="2">فبراير</SelectItem>
                    <SelectItem value="3">مارس</SelectItem>
                    <SelectItem value="4">أبريل</SelectItem>
                    <SelectItem value="5">مايو</SelectItem>
                    <SelectItem value="6">يونيو</SelectItem>
                    <SelectItem value="7">يوليو</SelectItem>
                    <SelectItem value="8">أغسطس</SelectItem>
                    <SelectItem value="9">سبتمبر</SelectItem>
                    <SelectItem value="10">أكتوبر</SelectItem>
                    <SelectItem value="11">نوفمبر</SelectItem>
                    <SelectItem value="12">ديسمبر</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">جميع الحالات</SelectItem>
                    <SelectItem value="calculated">محسوب</SelectItem>
                    <SelectItem value="approved">مُوافق عليه</SelectItem>
                    <SelectItem value="paid">مدفوع</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="البحث باسم الموظف..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* إحصائيات سريعة للسجل */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{stats.totalCount}</p>
                      <p className="text-sm text-muted-foreground">إجمالي السجلات</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.paidCount}</p>
                      <p className="text-sm text-muted-foreground">الرواتب المدفوعة</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalNet)}</p>
                      <p className="text-sm text-muted-foreground">إجمالي صافي الرواتب</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* جدول البيانات التاريخية */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الإجراءات</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الصافي</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>الموظف</TableHead>
                      <TableHead>الفترة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollData.map((payroll) => (
                      <TableRow key={payroll.id}>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {payroll.created_at ? format(new Date(payroll.created_at), 'dd/MM/yyyy', { locale: ar }) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(payroll.net_salary)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payroll.gross_salary)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payroll.employee_name}</div>
                            <div className="text-sm text-muted-foreground">{payroll.employee_number}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {payroll.pay_period_start && payroll.pay_period_end ? 
                            `${format(new Date(payroll.pay_period_start), 'dd/MM', { locale: ar })} - ${format(new Date(payroll.pay_period_end), 'dd/MM/yyyy', { locale: ar })}` 
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {payrollData.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد سجلات رواتب للمعايير المحددة
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>تقارير الرواتب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <h3 className="font-medium">تقرير الرواتب الشهري</h3>
                        <p className="text-sm text-muted-foreground">تفصيل رواتب جميع الموظفين</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Calculator className="w-8 h-8 text-green-500" />
                      <div>
                        <h3 className="font-medium">تقرير الخصومات</h3>
                        <p className="text-sm text-muted-foreground">تفاصيل الضرائب والتأمينات</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-8 h-8 text-blue-500" />
                      <div>
                        <h3 className="font-medium">تقرير البدلات</h3>
                        <p className="text-sm text-muted-foreground">تفاصيل البدلات والمكافآت</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الرواتب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">إعدادات الضرائب</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">نسبة الضريبة (%)</label>
                      <Input type="number" defaultValue="5" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">الحد الأدنى للضريبة</label>
                      <Input type="number" defaultValue="0" className="mt-1" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">إعدادات التأمين الاجتماعي</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">نسبة التأمين الاجتماعي (%)</label>
                      <Input type="number" defaultValue="6" className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">الحد الأقصى للتأمين</label>
                      <Input type="number" defaultValue="2000" className="mt-1" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">إعدادات الساعات الإضافية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">معدل الساعة الإضافية</label>
                      <Select defaultValue="1.5">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1.25">1.25x</SelectItem>
                          <SelectItem value="1.5">1.5x</SelectItem>
                          <SelectItem value="2">2x</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">ساعات العمل اليومية</label>
                      <Input type="number" defaultValue="8" className="mt-1" />
                    </div>
                  </div>
                </div>

                <Button>حفظ الإعدادات</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payroll;