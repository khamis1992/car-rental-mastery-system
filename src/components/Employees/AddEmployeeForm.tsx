import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AddEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeAdded?: () => void;
}

const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({
  isOpen,
  onClose,
  onEmployeeAdded
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    national_id: '',
    position: '',
    department: '',
    salary: '',
    hire_date: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // إنشاء رقم الموظف تلقائياً
      const { data: employeeData, error } = await supabase.rpc('generate_employee_number');
      
      if (error) throw error;
      
      const employeeNumber = employeeData || 'EMP0001';

      const { data: newEmployee, error: insertError } = await supabase
        .from('employees')
        .insert({
          employee_number: employeeNumber,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          national_id: formData.national_id,
          position: formData.position,
          department: formData.department,
          hire_date: formData.hire_date,
          salary: parseFloat(formData.salary),
          user_id: profile?.user_id, // ربط الموظف بالمستخدم الحالي
          status: 'active'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "تم إضافة الموظف بنجاح",
        description: `تم إنشاء الموظف: ${formData.first_name} ${formData.last_name}`,
      });

      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        national_id: '',
        position: '',
        department: '',
        salary: '',
        hire_date: new Date().toISOString().split('T')[0]
      });

      onEmployeeAdded?.();
      onClose();
    } catch (error) {
      console.error('خطأ في إضافة الموظف:', error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة الموظف",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إضافة موظف جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">الاسم الأول</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">اسم العائلة</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="national_id">الرقم المدني</Label>
            <Input
              id="national_id"
              value={formData.national_id}
              onChange={(e) => handleInputChange('national_id', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="position">المنصب</Label>
            <Select onValueChange={(value) => handleInputChange('position', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المنصب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">مدير</SelectItem>
                <SelectItem value="receptionist">موظف استقبال</SelectItem>
                <SelectItem value="accountant">محاسب</SelectItem>
                <SelectItem value="driver">سائق</SelectItem>
                <SelectItem value="mechanic">فني</SelectItem>
                <SelectItem value="sales">مبيعات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="department">القسم</Label>
            <Select onValueChange={(value) => handleInputChange('department', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administration">الإدارة</SelectItem>
                <SelectItem value="operations">العمليات</SelectItem>
                <SelectItem value="finance">المالية</SelectItem>
                <SelectItem value="maintenance">الصيانة</SelectItem>
                <SelectItem value="sales">المبيعات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="salary">الراتب (د.ك)</Label>
            <Input
              id="salary"
              type="number"
              step="0.01"
              value={formData.salary}
              onChange={(e) => handleInputChange('salary', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="hire_date">تاريخ التوظيف</Label>
            <Input
              id="hire_date"
              type="date"
              value={formData.hire_date}
              onChange={(e) => handleInputChange('hire_date', e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "جاري الإضافة..." : "إضافة الموظف"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEmployeeForm;