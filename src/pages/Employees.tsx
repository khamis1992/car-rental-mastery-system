import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Users, UserCheck, UserX, Link, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AddEmployeeForm } from '@/components/Employees/AddEmployeeForm';
import { LinkUserDialog } from '@/components/Employees/LinkUserDialog';
import { EmployeeDetailsDialog } from '@/components/Employees/EmployeeDetailsDialog';
import { DepartmentsList } from '@/components/Departments/DepartmentsList';
import { Employee } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Employees = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:department_id (
            department_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees((data || []) as Employee[]);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل بيانات الموظفين',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, department_name')
        .eq('is_active', true)
        .order('department_name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleEmployeeAdded = (newEmployee: Employee) => {
    setEmployees(prev => [newEmployee, ...prev]);
  };

  const handleEmployeeUpdated = (updatedEmployee: Employee) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === updatedEmployee.id ? updatedEmployee : emp
    ));
  };

  const handleLinkUser = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowLinkDialog(true);
  };

  const getUserLinkingBadge = (employee: Employee) => {
    if (employee.user_id) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <UserCheck className="w-3 h-3 mr-1" />
          مرتبط بحساب
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
        <UserX className="w-3 h-3 mr-1" />
        غير مرتبط
      </Badge>
    );
  };

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

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchTerm === '' || 
      employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDepartment = departmentFilter === '' || departmentFilter === 'all' || employee.department_id === departmentFilter;
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
        <Button onClick={() => setShowAddForm(true)}>
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
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.department_name}
                      </SelectItem>
                    ))}
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
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  جاري تحميل البيانات...
                </div>
              ) : (
                <div className="grid gap-6">
                  {filteredEmployees.map((employee) => (
                    <div key={employee.id} className="bg-gradient-to-r from-background to-accent/5 border border-border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/20">
                      {/* الهيدر - الاسم ورقم الموظف */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleLinkUser(employee)}
                            className="flex items-center gap-2 bg-success text-success-foreground border-success"
                          >
                            <Link className="w-3 h-3" />
                            ربط حساب
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-warning text-warning-foreground border-warning"
                          >
                            تعديل
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setShowDetailsDialog(true);
                            }}
                            className="bg-primary text-primary-foreground border-primary"
                          >
                            عرض
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <h2 className="text-2xl font-bold text-foreground mb-1">
                              {employee.first_name} {employee.last_name}
                            </h2>
                            <div className="flex items-center gap-3 justify-end">
                              {getStatusBadge(employee.status)}
                              {getUserLinkingBadge(employee)}
                              <Badge 
                                variant="outline" 
                                className="bg-primary/10 text-primary border-primary/20 font-medium"
                              >
                                {employee.employee_number}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* تفاصيل الموظف */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-card/50 rounded-lg p-4 border border-muted">
                          <div className="text-sm text-muted-foreground mb-1">الراتب:</div>
                          <div className="font-bold text-primary text-lg">
                            {formatCurrency(employee.salary)}
                          </div>
                        </div>
                        
                        <div className="bg-card/50 rounded-lg p-4 border border-muted">
                          <div className="text-sm text-muted-foreground mb-1">البريد:</div>
                          <div className="font-semibold text-foreground text-sm break-all">
                            {employee.email || 'غير محدد'}
                          </div>
                        </div>
                        
                        <div className="bg-card/50 rounded-lg p-4 border border-muted">
                          <div className="text-sm text-muted-foreground mb-1">القسم:</div>
                          <div className="font-semibold text-foreground">
                            {(employee as any).department?.department_name || employee.department || 'تقنية المعلومات'}
                          </div>
                        </div>
                        
                        <div className="bg-card/50 rounded-lg p-4 border border-muted">
                          <div className="text-sm text-muted-foreground mb-1">المنصب:</div>
                          <div className="font-semibold text-foreground">{employee.position}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredEmployees.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">لا توجد نتائج</h3>
                      <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة لبحثك</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsList />
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

      <AddEmployeeForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onEmployeeAdded={handleEmployeeAdded}
      />

      <LinkUserDialog
        open={showLinkDialog}
        onOpenChange={setShowLinkDialog}
        employee={selectedEmployee}
        onEmployeeUpdated={handleEmployeeUpdated}
      />

      <EmployeeDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        employee={selectedEmployee}
        onLinkUserClick={handleLinkUser}
      />
    </div>
  );
};

export default Employees;