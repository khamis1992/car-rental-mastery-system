
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
import { EmployeeEditDialog } from '@/components/Employees/EmployeeEditDialog';
import { Employee } from '@/types/hr';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useUnifiedErrorHandling } from '@/hooks/useUnifiedErrorHandling';
import { UnifiedErrorDisplay } from '@/components/common/UnifiedErrorDisplay';
import { supabase } from '@/integrations/supabase/client';

const EmployeesPage: React.FC = () => {
  const { useSecureEmployees } = useSecureTenantData();
  const { data: employees = [], isLoading, error, refetch } = useSecureEmployees();
  const { execute, handleError } = useUnifiedErrorHandling({
    context: 'employees',
    showToast: true,
    loadingKey: 'employees-operations'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
    execute(async () => {
      console.log('🔍 EmployeesPage: عرض تفاصيل الموظف:', employee.id, employee.first_name, employee.last_name);
      
      // التحقق من وجود البيانات المطلوبة
      if (!employee.id) {
        throw new Error('معرف الموظف مفقود');
      }

      setSelectedEmployee(employee);
      setIsDetailsDialogOpen(true);
    });
  };

  const handleEditEmployee = (employee: Employee) => {
    console.log('🔧 EmployeesPage: تعديل الموظف:', employee.id);
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    execute(async () => {
      console.log('🗑️ EmployeesPage: حذف الموظف:', employee.id);
      
      const confirmed = window.confirm(
        `هل أنت متأكد من حذف الموظف "${employee.first_name} ${employee.last_name}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`
      );

      if (!confirmed) return;

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      if (error) throw error;

      // Refresh the data
      refetch();
    });
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
        <UnifiedErrorDisplay
          error={error}
          title="خطأ في تحميل الموظفين"
          onRetry={() => refetch()}
          showRetry={true}
          showDetails={true}
          context="employees"
        />
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
                      onClick={() => handleViewDetails(employee as Employee)}
                      className="flex-1 rtl-flex"
                    >
                      <Eye className="w-4 h-4" />
                      عرض
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditEmployee(employee as Employee)}
                      className="flex-1 rtl-flex"
                    >
                      <Edit className="w-4 h-4" />
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteEmployee(employee as Employee)}
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

      {/* Employee Edit Dialog */}
      {selectedEmployee && (
        <EmployeeEditDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          employee={selectedEmployee}
          onSuccess={() => {
            refetch();
            setIsEditDialogOpen(false);
            setSelectedEmployee(null);
          }}
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
