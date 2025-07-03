import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';

interface AddEmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeAdded: (employee: Employee) => void;
}

export const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({
  open,
  onOpenChange,
  onEmployeeAdded
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    national_id: '',
    position: '',
    department: '',
    salary: '',
    hire_date: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    bank_account_number: '',
    bank_name: '',
    address: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate employee number
      const { data: employeeNumberData } = await supabase.rpc('generate_employee_number');
      
      const employeeData = {
        employee_number: employeeNumberData,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        phone: formData.phone || null,
        national_id: formData.national_id || null,
        position: formData.position,
        department: formData.department,
        salary: parseFloat(formData.salary),
        hire_date: formData.hire_date,
        status: 'active' as const,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        bank_account_number: formData.bank_account_number || null,
        bank_name: formData.bank_name || null,
        address: formData.address || null
      };

      const { data, error } = await supabase
        .from('employees')
        .insert([employeeData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'تم إضافة الموظف بنجاح',
        description: `تم إضافة ${formData.first_name} ${formData.last_name} إلى النظام`,
      });

      onEmployeeAdded(data as Employee);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        national_id: '',
        position: '',
        department: '',
        salary: '',
        hire_date: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        bank_account_number: '',
        bank_name: '',
        address: ''
      });
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: 'خطأ في إضافة الموظف',
        description: 'حدث خطأ أثناء إضافة الموظف، يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة موظف جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">الاسم الأول *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">اسم العائلة *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="national_id">الرقم المدني</Label>
              <Input
                id="national_id"
                value={formData.national_id}
                onChange={(e) => handleInputChange('national_id', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">المنصب *</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">القسم *</Label>
              <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر القسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="تقنية المعلومات">تقنية المعلومات</SelectItem>
                  <SelectItem value="المالية">المالية</SelectItem>
                  <SelectItem value="الموارد البشرية">الموارد البشرية</SelectItem>
                  <SelectItem value="التسويق">التسويق</SelectItem>
                  <SelectItem value="العمليات">العمليات</SelectItem>
                  <SelectItem value="خدمة العملاء">خدمة العملاء</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">الراتب (د.ك) *</Label>
              <Input
                id="salary"
                type="number"
                step="0.001"
                min="0"
                value={formData.salary}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hire_date">تاريخ التوظيف *</Label>
              <Input
                id="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => handleInputChange('hire_date', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">اسم جهة الاتصال الطارئ</Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">رقم جهة الاتصال الطارئ</Label>
              <Input
                id="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_name">اسم البنك</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => handleInputChange('bank_name', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account_number">رقم الحساب البنكي</Label>
              <Input
                id="bank_account_number"
                value={formData.bank_account_number}
                onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ الموظف'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};