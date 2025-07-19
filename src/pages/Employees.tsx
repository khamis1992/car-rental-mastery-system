
import React, { useState } from 'react';
import { Plus, Search, Filter, Upload, Download, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeFormDialog } from '@/components/HR/EmployeeFormDialog';
import { EmployeeDetails } from '@/components/HR/EmployeeDetails';
import { BulkEmployeeImport } from '@/components/HR/BulkEmployeeImport';
import { useSecureTenantData } from '@/hooks/useSecureTenantData';

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // استخدام الـ hooks الآمنة
  const { useSecureEmployees, useSecureDepartments } = useSecureTenantData();
  const { data: employees = [], isLoading: employeesLoading, error: employeesError } = useSecureEmployees();
  const { data: departments = [], isLoading: departmentsLoading } = useSecureDepartments();

  // فلترة الموظفين
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchTerm === '' || 
      employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    
    const matchesDepartment = departmentFilter === 'all' || 
      (employee.department_id && employee.department_id.toString() === departmentFilter);
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // إحصائيات الموظفين
  const employeeStats = {
    total: employees.length,
    active: employees.filter(emp => emp.status === 'active').length,
    inactive: employees.filter(emp => emp.status === 'inactive').length,
    onLeave: employees.filter(emp => emp.status === 'on_leave').length,
  };

  if (employeesLoading || departmentsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل بيانات الموظفين...</p>
          </div>
        </div>
      </div>
    );
  }

  if (employeesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">خطأ في تحميل بيانات الموظفين</p>
            <p className="text-muted-foreground text-sm">{employeesError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-right">إدارة الموظفين</h1>
            <p className="text-muted-foreground text-right">إدارة بيانات الموظفين والأقسام</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowBulkImport(true)} variant="outline">
            <Upload className="h-4 w-4 ml-2" />
            استيراد موظفين
          </Button>
          <Button onClick={() => setShowAddEmployee(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة موظف
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">إجمالي الموظفين</p>
                <p className="text-2xl font-bold">{employeeStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">الموظفون النشطون</p>
                <p className="text-2xl font-bold text-green-600">{employeeStats.active}</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">نشط</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">في إجازة</p>
                <p className="text-2xl font-bold text-yellow-600">{employeeStats.onLeave}</p>
              </div>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">إجازة</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">غير نشط</p>
                <p className="text-2xl font-bold text-red-600">{employeeStats.inactive}</p>
              </div>
              <Badge variant="secondary" className="bg-red-100 text-red-800">غير نشط</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث بالاسم أو رقم الموظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="فلتر بالحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="on_leave">في إجازة</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="فلتر بالقسم" />
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
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center justify-between">
            <span>قائمة الموظفين ({filteredEmployees.length})</span>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد بيانات موظفين</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-right">
                    <th className="py-3 px-4 text-right">رقم الموظف</th>
                    <th className="py-3 px-4 text-right">الاسم</th>
                    <th className="py-3 px-4 text-right">المنصب</th>
                    <th className="py-3 px-4 text-right">القسم</th>
                    <th className="py-3 px-4 text-right">الحالة</th>
                    <th className="py-3 px-4 text-right">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => {
                    const department = departments.find(d => d.id === employee.department_id);
                    return (
                      <tr key={employee.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 text-right">{employee.employee_number}</td>
                        <td className="py-3 px-4 text-right">
                          {employee.first_name} {employee.last_name}
                        </td>
                        <td className="py-3 px-4 text-right">{employee.position}</td>
                        <td className="py-3 px-4 text-right">
                          {department ? department.department_name : 'غير محدد'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge 
                            variant={
                              employee.status === 'active' ? 'default' :
                              employee.status === 'on_leave' ? 'secondary' : 'destructive'
                            }
                          >
                            {employee.status === 'active' ? 'نشط' :
                             employee.status === 'on_leave' ? 'في إجازة' : 'غير نشط'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedEmployee(employee)}
                          >
                            عرض التفاصيل
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EmployeeFormDialog
        open={showAddEmployee}
        onOpenChange={setShowAddEmployee}
      />

      <BulkEmployeeImport
        open={showBulkImport}
        onOpenChange={setShowBulkImport}
      />

      {selectedEmployee && (
        <EmployeeDetails
          employee={selectedEmployee}
          open={!!selectedEmployee}
          onOpenChange={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
};

export default Employees;
