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
    if (!currentTenant?.id) {
      toast({
        title: "خطأ",
        description: "لا يمكن تحديد المؤسسة الحالية",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Creating user with email:', formData.email);
      
      // 1. التحقق من وجود المستخدم بنفس البريد الإلكتروني
      const { data: existingUser } = await supabase
        .from('employees')
        .select('email')
        .eq('email', formData.email)
        .eq('tenant_id', currentTenant.id)
        .single();

      if (existingUser) {
        toast({
          title: "خطأ في البيانات",
          description: "يوجد موظف بنفس البريد الإلكتروني",
          variant: "destructive",
        });
        return;
      }

      // 2. توليد رقم الموظف
      const { data: employees } = await supabase
        .from('employees')
        .select('employee_number')
        .eq('tenant_id', currentTenant.id)
        .order('employee_number', { ascending: false })
        .limit(1);

      const lastNumber = employees && employees.length > 0 
        ? parseInt(employees[0].employee_number.replace(/\D/g, '')) || 0
        : 0;
      
      const employeeNumber = `EMP${(lastNumber + 1).toString().padStart(4, '0')}`;

      console.log('Generated employee number:', employeeNumber);
      
      // 3. إنشاء المستخدم في نظام الأذونات
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          tenant_id: currentTenant.id
        }
      });

      if (userError) {
        console.error('Error creating user:', userError);
        toast({
          title: "خطأ في إنشاء المستخدم",
          description: userError.message,
          variant: "destructive",
        });
        return;
      }

      console.log('User created successfully:', userData.user.id);
      
      // 4. إنشاء سجل الموظف
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .insert({
          user_id: userData.user.id,
          employee_number: employeeNumber,
          first_name: formData.firstName,
          last_name: formData.lastName,
          full_name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          department: formData.department,
          salary: parseFloat(formData.salary) || 0,
          hire_date: new Date().toISOString().split('T')[0],
          status: 'active',
          tenant_id: currentTenant.id
        })
        .select()
        .single();

      if (employeeError) {
        console.error('Error creating employee:', employeeError);
        // إذا فشل إنشاء الموظف، يجب حذف المستخدم
        try {
          await supabase.auth.admin.deleteUser(userData.user.id);
        } catch (deleteError) {
          console.error('Error deleting user after employee creation failure:', deleteError);
        }
        toast({
          title: "خطأ في إنشاء الموظف",
          description: employeeError.message,
          variant: "destructive",
        });
        return;
      }

      console.log('Employee created successfully:', employeeData.id);

      // 5. إنشاء سجل الملف الشخصي وتحديد الدور
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userData.user.id,
          user_id: userData.user.id,
          full_name: `${formData.firstName} ${formData.lastName}`,
          role: formData.role,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Error creating/updating profile:', profileError);
        toast({
          title: "تحذير",
          description: "تم إنشاء المستخدم ولكن فشل في تحديد الدور",
        });
      }

      // 6. إضافة دور المستخدم في جدول user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userData.user.id,
          role: formData.role
        });

      if (roleError) {
        console.error('Error assigning user role:', roleError);
        toast({
          title: "تحذير",
          description: "تم إنشاء المستخدم ولكن فشل في تعيين الدور",
        });
      }

      toast({
        title: "تم بنجاح",
        description: `تم إنشاء المستخدم والموظف بنجاح - رقم الموظف: ${employeeNumber}`,
      });

      // إعادة تعيين النموذج وإغلاق الحوار
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
      console.error('Unexpected error:', error);
      toast({
        title: "خطأ غير متوقع",
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