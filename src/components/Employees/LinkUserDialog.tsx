import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';
import { User, UserPlus, AlertCircle, Mail, Calendar, Shield, UserCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface LinkUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onEmployeeUpdated: (employee: Employee) => void;
}

export const LinkUserDialog: React.FC<LinkUserDialogProps> = ({
  open,
  onOpenChange,
  employee,
  onEmployeeUpdated
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [createNewUser, setCreateNewUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('receptionist');

  useEffect(() => {
    if (open) {
      fetchAvailableProfiles();
      if (employee?.email) {
        setNewUserEmail(employee.email);
      }
    }
  }, [open, employee]);

  const fetchAvailableProfiles = async () => {
    try {
      // Get profiles that are not linked to any employee
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Filter out profiles that are already linked to employees
      const { data: linkedEmployees, error: empError } = await supabase
        .from('employees')
        .select('user_id')
        .not('user_id', 'is', null);

      if (empError) throw empError;

      const linkedUserIds = linkedEmployees?.map(emp => emp.user_id) || [];
      const availableProfiles = (data || []).filter(profile => 
        !linkedUserIds.includes(profile.user_id)
      );

      setProfiles(availableProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل قائمة المستخدمين',
        variant: 'destructive'
      });
    }
  };

  const handleLinkExistingUser = async () => {
    if (!selectedUserId || !employee) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({ user_id: selectedUserId })
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: 'تم ربط المستخدم بنجاح',
        description: `تم ربط الموظف ${employee.first_name} ${employee.last_name} بالمستخدم`,
      });

      onEmployeeUpdated({ ...employee, user_id: selectedUserId });
      onOpenChange(false);
    } catch (error) {
      console.error('Error linking user:', error);
      toast({
        title: 'خطأ في ربط المستخدم',
        description: 'حدث خطأ أثناء ربط المستخدم بالموظف',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewUser = async () => {
    if (!newUserEmail || !newUserPassword || !employee) return;

    setLoading(true);
    try {
      // Create new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: `${employee.first_name} ${employee.last_name}`,
            role: newUserRole
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update employee with user_id
        const { error: updateError } = await supabase
          .from('employees')
          .update({ user_id: authData.user.id })
          .eq('id', employee.id);

        if (updateError) throw updateError;

        toast({
          title: 'تم إنشاء المستخدم بنجاح',
          description: `تم إنشاء حساب جديد للموظف ${employee.first_name} ${employee.last_name}`,
        });

        onEmployeeUpdated({ ...employee, user_id: authData.user.id });
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      let errorMessage = 'حدث خطأ أثناء إنشاء حساب المستخدم';
      
      if (error.message?.includes('User already registered')) {
        errorMessage = 'هذا البريد الإلكتروني مسجل بالفعل';
      }
      
      toast({
        title: 'خطأ في إنشاء المستخدم',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkUser = async () => {
    if (!employee || !employee.user_id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({ user_id: null })
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: 'تم إلغاء ربط المستخدم',
        description: `تم إلغاء ربط المستخدم من الموظف ${employee.first_name} ${employee.last_name}`,
      });

      onEmployeeUpdated({ ...employee, user_id: undefined });
      onOpenChange(false);
    } catch (error) {
      console.error('Error unlinking user:', error);
      toast({
        title: 'خطأ في إلغاء الربط',
        description: 'حدث خطأ أثناء إلغاء ربط المستخدم',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-xl font-bold text-right flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            ربط حساب مستخدم - {employee.first_name} {employee.last_name}
          </DialogTitle>
          <DialogDescription className="text-right text-muted-foreground">
            ربط الموظف بحساب مستخدم ليتمكن من الدخول إلى النظام
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 p-1">
          {/* Employee Info */}
          <Card className="border-2 border-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-lg">معلومات الموظف</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">الرقم الوظيفي:</span> {employee.employee_number}
                </div>
                <div>
                  <span className="font-medium">المنصب:</span> {employee.position}
                </div>
                <div>
                  <span className="font-medium">القسم:</span> {(() => {
                    if (employee.department_id && typeof (employee as any).department === 'object' && (employee as any).department?.department_name) {
                      return (employee as any).department.department_name;
                    }
                    return employee.department || 'غير محدد';
                  })()}
                </div>
                {employee.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span className="font-medium">البريد:</span> {employee.email}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          {employee.user_id ? (
            <Card className="border-2 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      هذا الموظف مرتبط بحساب مستخدم
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnlinkUser}
                    disabled={loading}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    إلغاء الربط
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Link Options */}
              <div className="space-y-4">
                <Label className="text-base font-medium">خيارات الربط</Label>
                
                {/* Link to Existing User */}
                <Card className="border-2 border-blue-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        ربط بحساب موجود
                      </h4>
                      
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مستخدم من القائمة" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.user_id} value={profile.user_id}>
                              <div className="flex items-center gap-2">
                                <span>{profile.full_name}</span>
                                <Badge variant="secondary">{profile.role}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Button
                        onClick={handleLinkExistingUser}
                        disabled={!selectedUserId || loading}
                        className="w-full"
                      >
                        ربط بالمستخدم المحدد
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Create New User */}
                <Card className="border-2 border-green-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        إنشاء حساب مستخدم جديد
                      </h4>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="email">البريد الإلكتروني</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="أدخل البريد الإلكتروني"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="password">كلمة المرور</Label>
                          <Input
                            id="password"
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="أدخل كلمة مرور قوية"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="role">دور المستخدم</Label>
                          <Select value={newUserRole} onValueChange={setNewUserRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">مدير</SelectItem>
                              <SelectItem value="manager">مدير تنفيذي</SelectItem>
                              <SelectItem value="accountant">محاسب</SelectItem>
                              <SelectItem value="technician">فني</SelectItem>
                              <SelectItem value="receptionist">موظف استقبال</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleCreateNewUser}
                        disabled={!newUserEmail || !newUserPassword || loading}
                        className="w-full"
                        variant="default"
                      >
                        إنشاء الحساب وربطه
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Warning */}
              <Card className="border-2 border-orange-200 bg-orange-50/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-1">ملاحظات مهمة:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>ربط الموظف بحساب مستخدم يمنحه إمكانية الدخول إلى النظام</li>
                        <li>صلاحيات المستخدم تحدد ما يمكنه الوصول إليه في النظام</li>
                        <li>يمكن إلغاء الربط في أي وقت</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <DialogFooter className="gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};