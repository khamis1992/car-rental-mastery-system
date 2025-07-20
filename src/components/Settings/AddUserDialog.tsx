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
      console.log('Creating user invitation for email:', formData.email);
      
      // استخدام دالة إنشاء الدعوة الجديدة
      const { data: invitationResult, error: invitationError } = await supabase
        .rpc('create_user_invitation', {
          email_param: formData.email,
          role_param: formData.role
        });

      if (invitationError) {
        console.error('Error creating invitation:', invitationError);
        toast({
          title: "خطأ في إنشاء الدعوة",
          description: invitationError.message,
          variant: "destructive",
        });
        return;
      }

      const invitationData = invitationResult as { success: boolean; error?: string; invitation_id?: string; invitation_token?: string };

      if (!invitationData.success) {
        toast({
          title: "خطأ في الدعوة",
          description: invitationData.error || "فشل في إنشاء الدعوة",
          variant: "destructive",
        });
        return;
      }

      // تسجيل نشاط إضافة المستخدم
      await supabase.rpc('log_user_activity', {
        action_type_param: 'user_invitation_created',
        action_description_param: `دعوة مستخدم جديد: ${formData.email} بدور: ${formData.role}`
      });

      toast({
        title: "تم بنجاح",
        description: `تم إرسال دعوة للمستخدم ${formData.email} بنجاح`,
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
        description: error.message || "حدث خطأ أثناء إنشاء الدعوة",
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
          <DialogTitle className="rtl-title">دعوة مستخدم جديد</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="rtl-label">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="rtl-label">الدور</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant_admin">مدير المؤسسة</SelectItem>
                <SelectItem value="manager">مدير</SelectItem>
                <SelectItem value="accountant">محاسب</SelectItem>
                <SelectItem value="receptionist">موظف استقبال</SelectItem>
                <SelectItem value="user">مستخدم عادي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 text-right">
              <strong>ملاحظة:</strong> سيتم إرسال دعوة إلى البريد الإلكتروني المحدد. يمكن للمستخدم قبول الدعوة وإنشاء حسابه بنفسه.
            </p>
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
              إرسال دعوة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;