import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Employee } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EmployeeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}

interface EmployeeFormData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  position: string;
  department: string;
  status: string;
  hire_date: string;
  salary: number;
  
}

export const EmployeeEditDialog: React.FC<EmployeeEditDialogProps> = ({
  isOpen,
  onClose,
  employee,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EmployeeFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    position: '',
    department: '',
    status: 'active',
    hire_date: '',
    salary: 0,
  });

  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        phone: employee.phone || '',
        email: employee.email || '',
        position: employee.position || '',
        department: employee.department || '',
        status: employee.status || 'active',
        hire_date: employee.hire_date || '',
        salary: employee.salary || 0,
        
      });
    }
  }, [employee, isOpen]);

  const handleSubmit = async () => {
    if (!employee) return;

    // Validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast({
        title: 'خطأ في التحقق',
        description: 'الاسم الأول والأخير مطلوبان',
        variant: 'destructive'
      });
      return;
    }

    if (formData.email && !formData.email.includes('@')) {
      toast({
        title: 'خطأ في التحقق',
        description: 'البريد الإلكتروني غير صحيح',
        variant: 'destructive'
      });
      return;
    }

    if (formData.salary < 0) {
      toast({
        title: 'خطأ في التحقق',
        description: 'الراتب لا يمكن أن يكون سالباً',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات الموظف بنجاح'
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast({
        title: 'خطأ في التحديث',
        description: error.message || 'حدث خطأ أثناء تحديث بيانات الموظف',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form after dialog closes
    setTimeout(() => {
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        position: '',
        department: '',
        status: 'active',
        hire_date: '',
        salary: 0,
      });
    }, 200);
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="rtl-title">
            تعديل بيانات الموظف - {employee.first_name} {employee.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">الاسم الأول *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              placeholder="أدخل الاسم الأول"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">الاسم الأخير *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              placeholder="أدخل الاسم الأخير"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="أدخل رقم الهاتف"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="أدخل البريد الإلكتروني"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">المنصب</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              placeholder="أدخل المنصب"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">القسم</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر القسم" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operations">العمليات</SelectItem>
                <SelectItem value="sales">المبيعات</SelectItem>
                <SelectItem value="maintenance">الصيانة</SelectItem>
                <SelectItem value="finance">المالية</SelectItem>
                <SelectItem value="hr">الموارد البشرية</SelectItem>
                <SelectItem value="customer_service">خدمة العملاء</SelectItem>
                <SelectItem value="administration">الإدارة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">الحالة</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="terminated">منتهي الخدمة</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hire_date">تاريخ التوظيف</Label>
            <Input
              id="hire_date"
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">الراتب (د.ك)</Label>
            <Input
              id="salary"
              type="number"
              min="0"
              step="0.001"
              value={formData.salary}
              onChange={(e) => setFormData(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
              placeholder="أدخل الراتب"
            />
          </div>
        </div>


        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};