import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Calculator, FileText, Download, Eye, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Payroll = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const mockPayrollData = [
    {
      id: '1',
      employee_name: 'أحمد محمد',
      employee_number: 'EMP0001',
      pay_period_start: '2024-01-01',
      pay_period_end: '2024-01-31',
      basic_salary: 1200.000,
      overtime_amount: 150.000,
      allowances: 100.000,
      bonuses: 0,
      deductions: 50.000,
      tax_deduction: 60.000,
      social_insurance: 72.000,
      gross_salary: 1450.000,
      net_salary: 1268.000,
      status: 'paid',
      paid_at: '2024-02-01'
    },
    {
      id: '2',
      employee_name: 'فاطمة أحمد',
      employee_number: 'EMP0002',
      pay_period_start: '2024-01-01',
      pay_period_end: '2024-01-31',
      basic_salary: 1000.000,
      overtime_amount: 75.000,
      allowances: 80.000,
      bonuses: 50.000,
      deductions: 0,
      tax_deduction: 50.000,
      social_insurance: 60.000,
      gross_salary: 1205.000,
      net_salary: 1095.000,
      status: 'approved',
      approved_at: '2024-01-30'
    },
    {
      id: '3',
      employee_name: 'محمد علي',
      employee_number: 'EMP0003',
      pay_period_start: '2024-01-01',
      pay_period_end: '2024-01-31',
      basic_salary: 800.000,
      overtime_amount: 0,
      allowances: 60.000,
      bonuses: 0,
      deductions: 25.000,
      tax_deduction: 40.000,
      social_insurance: 48.000,
      gross_salary: 860.000,
      net_salary: 747.000,
      status: 'draft'
    }
  ];

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
    return `${amount.toFixed(3)} د.ك`;
  };

  const filteredPayroll = mockPayrollData.filter(payroll => {
    const matchesSearch = searchTerm === '' || 
      payroll.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.employee_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || statusFilter === 'all' || payroll.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalGrossSalary = filteredPayroll.reduce((sum, p) => sum + p.gross_salary, 0);
  const totalNetSalary = filteredPayroll.reduce((sum, p) => sum + p.net_salary, 0);
  const totalDeductions = filteredPayroll.reduce((sum, p) => sum + p.deductions + p.tax_deduction + p.social_insurance, 0);

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان والإجراءات */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الرواتب</h1>
          <p className="text-muted-foreground">حساب ومعالجة رواتب الموظفين</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calculator className="w-4 h-4 ml-2" />
            حساب الرواتب
          </Button>
          <Button>
            <FileText className="w-4 h-4 ml-2" />
            إنشاء كشف راتب
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
                <p className="text-2xl font-bold">{formatCurrency(totalGrossSalary)}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(totalNetSalary)}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(totalDeductions)}</p>
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
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">من أصل {filteredPayroll.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">الشهر الحالي</TabsTrigger>
          <TabsTrigger value="history">سجل الرواتب</TabsTrigger>
          <TabsTrigger value="reports">التقارير</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>رواتب الشهر الحالي</CardTitle>
              
              {/* فلاتر البحث */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="البحث باسم الموظف أو الرقم..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
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
                      <TableHead>الموظف</TableHead>
                      <TableHead>الراتب الأساسي</TableHead>
                      <TableHead>الإضافات</TableHead>
                      <TableHead>الخصومات</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>الصافي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayroll.map((payroll) => (
                      <TableRow key={payroll.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payroll.employee_name}</div>
                            <div className="text-sm text-muted-foreground">{payroll.employee_number}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(payroll.basic_salary)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>إضافي: {formatCurrency(payroll.overtime_amount)}</div>
                            <div>بدلات: {formatCurrency(payroll.allowances)}</div>
                            {payroll.bonuses > 0 && <div>مكافآت: {formatCurrency(payroll.bonuses)}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {payroll.deductions > 0 && <div>خصومات: {formatCurrency(payroll.deductions)}</div>}
                            <div>ضريبة: {formatCurrency(payroll.tax_deduction)}</div>
                            <div>تأمين: {formatCurrency(payroll.social_insurance)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(payroll.gross_salary)}</TableCell>
                        <TableCell className="font-medium text-green-600">{formatCurrency(payroll.net_salary)}</TableCell>
                        <TableCell>{getStatusBadge(payroll.status)}</TableCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredPayroll.length === 0 && (
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
              <CardTitle>سجل الرواتب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                سجل الرواتب السابقة - قريباً
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