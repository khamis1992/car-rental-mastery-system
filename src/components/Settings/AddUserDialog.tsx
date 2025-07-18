import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2 } from 'lucide-react';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ open, onOpenChange, onUserAdded }) => {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    position: '',
    department: '',
    salary: '',
    role: 'receptionist' as 'admin' | 'manager' | 'accountant' | 'technician' | 'receptionist'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true
      });

      if (authError) throw authError;

      // Generate employee number first
      const { data: employeeNumber, error: numberError } = await supabase
        .rpc('generate_employee_number');

      if (numberError) throw numberError;

      // Create employee record
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          employee_number: employeeNumber,
          user_id: authData.user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          department: formData.department,
          salary: parseFloat(formData.salary),
          hire_date: new Date().toISOString().split('T')[0],
          status: 'active',
          tenant_id: currentTenant?.id || ''
        });

      if (employeeError) throw employeeError;

      // Update user role in profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: formData.role })
        .eq('user_id', authData.user.id);

      if (profileError) throw profileError;

      toast({
        title: "تم إنشاء المستخدم بنجاح",
        description: "تم إضافة المستخدم الجديد إلى النظام",
      });

      // Reset form and close dialog
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        position: '',
        department: '',
        salary: '',
        role: 'receptionist'
      });
      onOpenChange(false);
      onUserAdded();

    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء المستخدم",
        description: error.message || "حدث خطأ أثناء إنشاء المستخدم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="rtl-title">إضافة مستخدم جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="rtl-label">الاسم الأول</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="rtl-label">الاسم الأخير</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="rtl-label">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="rtl-label">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="rtl-label">رقم الهاتف</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position" className="rtl-label">المنصب</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="rtl-label">القسم</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => handleInputChange('department', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary" className="rtl-label">الراتب</Label>
            <Input
              id="salary"
              type="number"
              value={formData.salary}
              onChange={(e) => handleInputChange('salary', e.target.value)}
              required
              min="0"
              step="0.001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="rtl-label">الدور</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">مدير النظام</SelectItem>
                <SelectItem value="manager">مدير</SelectItem>
                <SelectItem value="accountant">محاسب</SelectItem>
                <SelectItem value="technician">فني</SelectItem>
                <SelectItem value="receptionist">موظف استقبال</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              إضافة المستخدم
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;