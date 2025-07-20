
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useSecureTenantData } from '@/hooks/useSecureTenantData';
import { EmployeeDetailsDialog } from '@/components/Employees/EmployeeDetailsDialog';
import { Employee } from '@/types/hr';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';

const EmployeesPage: React.FC = () => {
  const { useSecureEmployees } = useSecureTenantData();
  const { data: employees = [], isLoading, error, refetch } = useSecureEmployees();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  console.log('🔍 EmployeesPage: تم تحميل', employees?.length || 0, 'موظف');

  // تصفية الموظفين بناءً على البحث
  const filteredEmployees = employees.filter(employee => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      employee.first_name?.toLowerCase().includes(searchLower) ||
      employee.last_name?.toLowerCase().includes(searchLower) ||
      employee.employee_number?.toLowerCase().includes(searchLower) ||
      employee.position?.toLowerCase().includes(searchLower) ||
      employee.department?.toLowerCase().includes(searchLower)
    );
  });

  const handleViewDetails = (employee: Employee) => {
    try {
      console.log('🔍 EmployeesPage: عرض تفاصيل الموظف:', employee.id, employee.first_name, employee.last_name);
      
      // التحقق من وجود البيانات المطلوبة
      if (!employee.id) {
        console.error('❌ EmployeesPage: معرف الموظف مفقود');
        toast({
          title: "خطأ",
          description: "معرف الموظف مفقود",
          variant: "destructive",
        });
        return;
      }

      setSelectedEmployee(employee);
      setIsDetailsDialogOpen(true);
    } catch (error) {
      console.error('❌ EmployeesPage: خطأ في عرض تفاصيل الموظف:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء عرض تفاصيل الموظف",
        variant: "destructive",
      });
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    try {
      console.log('🔧 EmployeesPage: تعديل الموظف:', employee.id);
      // TODO: تنفيذ منطق التعديل
      toast({
        title: "قيد التطوير",
        description: "خاصية تعديل الموظف قيد التطوير",
        variant: "default",
      });
    } catch (error) {
      console.error('❌ EmployeesPage: خطأ في تعديل الموظف:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعديل الموظف",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmployee = (employee: Employee) => {
    try {
      console.log('🗑️ EmployeesPage: حذف الموظف:', employee.id);
      // TODO: تنفيذ منطق الحذف
      toast({
        title: "قيد التطوير",
        description: "خاصية حذف الموظف قيد التطوير",
        variant: "default",
      });
    } catch (error) {
      console.error('❌ EmployeesPage: خطأ في حذف الموظف:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الموظف",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>;
      case 'inactive':
        return <Badge variant="destructive">غير نشط</Badge>;
      case 'terminated':
        return <Badge className="bg-red-100 text-red-800">منتهي الخدمة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (error) {
    console.error('❌ EmployeesPage: خطأ في تحميل الموظفين:', error);
    return (
      <div className="p-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="rtl-title flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              خطأ في تحميل الموظفين
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'حدث خطأ غير متوقع'}
            </p>
            <Button 
              onClick={() => refetch()} 
              variant="outline"
              className="rtl-flex"
            >
              <Search className="w-4 h-4" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">إدارة الموظفين</h1>
            <p className="text-muted-foreground">
              إجمالي الموظفين: {employees.length}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button className="rtl-flex">
            <Plus className="w-4 h-4" />
            إضافة موظف جديد
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث عن الموظفين..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Button variant="outline" className="rtl-flex">
              <Filter className="w-4 h-4" />
              تصفية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل بيانات الموظفين...</p>
          </CardContent>
        </Card>
      )}

      {/* Employees Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Employee Info */}
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">
                      {employee.first_name} {employee.last_name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {employee.position || 'غير محدد'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      رقم الموظف: {employee.employee_number}
                    </p>
                  </div>

                  {/* Status and Department */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">الحالة:</span>
                      {getStatusBadge(employee.status)}
                    </div>
                    {employee.department && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">القسم:</span>
                        <span className="text-sm">{employee.department}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(employee)}
                      className="flex-1 rtl-flex"
                    >
                      <Eye className="w-4 h-4" />
                      عرض
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditEmployee(employee)}
                      className="flex-1 rtl-flex"
                    >
                      <Edit className="w-4 h-4" />
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteEmployee(employee)}
                      className="text-destructive hover:text-destructive rtl-flex"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'لا توجد نتائج للبحث المحدد' : 'لا توجد موظفين مسجلين'}
            </p>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => setSearchTerm('')}
                className="mt-4"
              >
                مسح البحث
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Employee Details Dialog */}
      {selectedEmployee && (
        <EmployeeDetailsDialog
          employee={selectedEmployee}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onEditClick={handleEditEmployee}
          onDeleteClick={handleDeleteEmployee}
        />
      )}
    </div>
  );
};

export default function Employees() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                خطأ في صفحة الموظفين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                حدث خطأ أثناء تحميل صفحة الموظفين
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="rtl-flex"
              >
                إعادة تحميل الصفحة
              </Button>
            </CardContent>
          </Card>
        </div>
      }
    >
      <EmployeesPage />
    </ErrorBoundary>
  );
}
