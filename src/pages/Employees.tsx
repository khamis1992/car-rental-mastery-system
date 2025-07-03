import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Users, UserCheck, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const mockEmployees = [
    {
      id: '1',
      employee_number: 'EMP0001',
      first_name: 'أحمد',
      last_name: 'محمد',
      email: 'ahmed@company.com',
      phone: '12345678',
      position: 'مطور',
      department: 'تقنية المعلومات',
      hire_date: '2024-01-15',
      status: 'active',
      salary: 1200.000
    },
    {
      id: '2',
      employee_number: 'EMP0002',
      first_name: 'فاطمة',
      last_name: 'أحمد',
      email: 'fatima@company.com',
      phone: '87654321',
      position: 'محاسبة',
      department: 'المالية',
      hire_date: '2024-02-01',
      status: 'active',
      salary: 1000.000
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', variant: 'default' as const },
      inactive: { label: 'غير نشط', variant: 'secondary' as const },
      terminated: { label: 'منتهي الخدمة', variant: 'destructive' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const filteredEmployees = mockEmployees.filter(employee => {
    const matchesSearch = searchTerm === '' || 
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = departmentFilter === '' || departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesStatus = statusFilter === '' || statusFilter === 'all' || employee.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان والإجراءات */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الموظفين</h1>
          <p className="text-muted-foreground">إدارة بيانات الموظفين والتعيينات</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          إضافة موظف جديد
        </Button>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <UserCheck className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">الموظفون النشطون</p>
                <p className="text-2xl font-bold">22</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <UserX className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">منتهي الخدمة</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">التعيينات الجديدة</p>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">هذا الشهر</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* التبويبات */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="locations">مواقع العمل</TabsTrigger>
          <TabsTrigger value="positions">المناصب</TabsTrigger>
          <TabsTrigger value="departments">الأقسام</TabsTrigger>
          <TabsTrigger value="list">قائمة الموظفين</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>قائمة الموظفين</CardTitle>
              
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
                
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأقسام</SelectItem>
                    <SelectItem value="تقنية المعلومات">تقنية المعلومات</SelectItem>
                    <SelectItem value="المالية">المالية</SelectItem>
                    <SelectItem value="الموارد البشرية">الموارد البشرية</SelectItem>
                    <SelectItem value="التسويق">التسويق</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="terminated">منتهي الخدمة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {filteredEmployees.map((employee) => (
                  <div key={employee.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">عرض</Button>
                        <Button variant="outline" size="sm">تعديل</Button>
                      </div>
                      
                      <div className="flex-1 text-right mr-4">
                        <div className="flex items-center gap-4 mb-2 justify-end">
                          {getStatusBadge(employee.status)}
                          <Badge variant="outline">{employee.employee_number}</Badge>
                          <h3 className="font-medium text-lg">
                            {employee.first_name} {employee.last_name}
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground text-right">
                          <div>
                            <span className="font-medium">المنصب:</span> {employee.position}
                          </div>
                          <div>
                            <span className="font-medium">القسم:</span> {employee.department}
                          </div>
                          <div>
                            <span className="font-medium">البريد:</span> {employee.email}
                          </div>
                          <div>
                            <span className="font-medium">الراتب:</span> {formatCurrency(employee.salary)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredEmployees.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد نتائج مطابقة لبحثك
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>الأقسام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                إدارة أقسام الشركة - قريباً
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>المناصب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                إدارة المناصب الوظيفية - قريباً
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle>مواقع العمل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                إدارة مواقع العمل - قريباً
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Employees;