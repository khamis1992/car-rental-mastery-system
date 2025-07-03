import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DepartmentForm } from './DepartmentForm';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Search, 
  Building2, 
  Edit, 
  Users, 
  UserCheck,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Department {
  id: string;
  department_code: string;
  department_name: string;
  department_name_en?: string;
  description?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  manager?: {
    first_name: string;
    last_name: string;
    employee_number: string;
  };
  employee_count?: number;
}

export const DepartmentsList: React.FC = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select(`
          *,
          manager:manager_id (
            first_name,
            last_name,
            employee_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get employee count for each department
      const departmentsWithCount = await Promise.all(
        (data || []).map(async (dept) => {
          const { count } = await supabase
            .from('employees')
            .select('id', { count: 'exact' })
            .eq('department_id', dept.id)
            .eq('status', 'active');

          return {
            ...dept,
            employee_count: count || 0
          };
        })
      );

      setDepartments(departmentsWithCount);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل بيانات الأقسام',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSaved = (department: Department) => {
    fetchDepartments(); // Refresh the list
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setSelectedDepartment(null);
    setShowForm(true);
  };

  const toggleDepartmentStatus = async (department: Department) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: !department.is_active })
        .eq('id', department.id);

      if (error) throw error;

      toast({
        title: 'تم تحديث حالة القسم',
        description: `تم ${department.is_active ? 'إلغاء تنشيط' : 'تنشيط'} قسم ${department.department_name}`,
      });

      fetchDepartments();
    } catch (error) {
      console.error('Error updating department status:', error);
      toast({
        title: 'خطأ في تحديث الحالة',
        description: 'حدث خطأ أثناء تحديث حالة القسم',
        variant: 'destructive'
      });
    }
  };

  const filteredDepartments = departments.filter(department => {
    const matchesSearch = searchTerm === '' || 
      department.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.department_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (department.department_name_en && department.department_name_en.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && department.is_active) ||
      (statusFilter === 'inactive' && !department.is_active);

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">نشط</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">غير نشط</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">إدارة الأقسام</h2>
          <p className="text-muted-foreground">إدارة أقسام الشركة والموظفين</p>
        </div>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إضافة قسم جديد
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>البحث والفلترة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="البحث باسم القسم أو الرمز..."
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
                <SelectItem value="">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Departments List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الأقسام</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              جاري تحميل البيانات...
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDepartments.map((department) => (
                <div key={department.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(department)}>
                            <Edit className="w-3 h-3 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleDepartmentStatus(department)}>
                            <AlertCircle className="w-3 h-3 ml-2" />
                            {department.is_active ? 'إلغاء التنشيط' : 'تنشيط'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex-1 text-right mr-4">
                      <div className="flex items-center gap-4 mb-2 justify-end">
                        {getStatusBadge(department.is_active)}
                        <Badge variant="outline">{department.department_code}</Badge>
                        <h3 className="font-medium text-lg flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {department.department_name}
                        </h3>
                      </div>
                     
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground text-right">
                        {department.department_name_en && (
                          <div>
                            <span className="font-medium">الاسم الإنجليزي:</span> {department.department_name_en}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span className="font-medium">عدد الموظفين:</span> {department.employee_count}
                        </div>
                        {department.manager && (
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            <span className="font-medium">المدير:</span> {department.manager.first_name} {department.manager.last_name}
                          </div>
                        )}
                        {department.description && (
                          <div className="md:col-span-2 lg:col-span-4">
                            <span className="font-medium">الوصف:</span> {department.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredDepartments.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm || statusFilter ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد أقسام مسجلة'}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <DepartmentForm
        open={showForm}
        onOpenChange={setShowForm}
        department={selectedDepartment}
        onDepartmentSaved={handleDepartmentSaved}
      />
    </div>
  );
};