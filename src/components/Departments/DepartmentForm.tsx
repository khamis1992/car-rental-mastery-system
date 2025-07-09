import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Building2, AlertCircle } from 'lucide-react';

interface Department {
  id: string;
  department_code: string;
  department_name: string;
  department_name_en?: string;
  description?: string;
  manager_id?: string;
  is_active: boolean;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
}

interface DepartmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  onDepartmentSaved: (department: Department) => void;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  open,
  onOpenChange,
  department,
  onDepartmentSaved
}) => {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({
    department_name: '',
    department_name_en: '',
    description: '',
    manager_id: '',
    is_active: true
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      fetchEmployees();
      if (department) {
        setFormData({
          department_name: department.department_name,
          department_name_en: department.department_name_en || '',
          description: department.description || '',
          manager_id: department.manager_id || '',
          is_active: department.is_active
        });
      } else {
        resetForm();
      }
    }
  }, [open, department]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      department_name: '',
      department_name_en: '',
      description: '',
      manager_id: '',
      is_active: true
    });
    setFieldErrors({});
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, boolean> = {};
    
    if (!formData.department_name.trim()) {
      errors['department_name'] = true;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'بيانات غير مكتملة',
        description: 'يرجى تعبئة جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const departmentData = {
        department_name: formData.department_name,
        department_name_en: formData.department_name_en || null,
        description: formData.description || null,
        manager_id: formData.manager_id || null,
        is_active: formData.is_active
      };

      let result;

      if (department) {
        // Update existing department
        const { data, error } = await supabase
          .from('departments')
          .update(departmentData)
          .eq('id', department.id)
          .select()
          .single();

        if (error) throw error;
        result = data;

        toast({
          title: 'تم تحديث القسم بنجاح',
          description: `تم تحديث قسم ${formData.department_name}`,
        });
      } else {
        // Create new department
        const { data: codeData } = await supabase.rpc('generate_department_code');
        
        const { data, error } = await supabase
          .from('departments')
          .insert({
            ...departmentData,
            department_code: codeData,
            tenant_id: currentTenant?.id || ''
          })
          .select()
          .single();

        if (error) throw error;
        result = data;

        toast({
          title: 'تم إضافة القسم بنجاح',
          description: `تم إضافة قسم ${formData.department_name} إلى النظام`,
        });
      }

      onDepartmentSaved(result);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: 'خطأ في حفظ القسم',
        description: 'حدث خطأ أثناء حفظ بيانات القسم، يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = (fieldName: string) => 
    `transition-all duration-200 ${fieldErrors[fieldName] ? 'border-destructive focus-visible:ring-destructive' : ''}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-2xl font-bold text-right flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            {department ? 'تعديل القسم' : 'إضافة قسم جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department_name" className="flex items-center gap-1">
                اسم القسم (بالعربية)
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="department_name"
                value={formData.department_name}
                onChange={(e) => handleInputChange('department_name', e.target.value)}
                className={inputClassName('department_name')}
                placeholder="أدخل اسم القسم"
              />
              {fieldErrors.department_name && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  هذا الحقل مطلوب
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department_name_en">اسم القسم (بالإنجليزية)</Label>
              <Input
                id="department_name_en"
                value={formData.department_name_en}
                onChange={(e) => handleInputChange('department_name_en', e.target.value)}
                placeholder="Department Name in English"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manager_id">مدير القسم</Label>
            <Select value={formData.manager_id} onValueChange={(value) => handleInputChange('manager_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر مدير القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">بدون مدير</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name} - {employee.employee_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">وصف القسم</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              placeholder="أدخل وصف مختصر للقسم ومهامه"
            />
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="rounded border-border"
            />
            <Label htmlFor="is_active">القسم نشط</Label>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? 'جاري الحفظ...' : department ? 'تحديث القسم' : 'حفظ القسم'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};