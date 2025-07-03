import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Employee } from '@/types/hr';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  CreditCard, 
  MapPin, 
  Shield, 
  UserCheck, 
  UserX,
  Edit,
  Link,
  Clock
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface EmployeeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onEditClick?: (employee: Employee) => void;
  onLinkUserClick?: (employee: Employee) => void;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export const EmployeeDetailsDialog: React.FC<EmployeeDetailsDialogProps> = ({
  open,
  onOpenChange,
  employee,
  onEditClick,
  onLinkUserClick
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (open && employee?.user_id) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [open, employee]);

  const fetchUserProfile = async () => {
    if (!employee?.user_id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', employee.user_id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'نشط', variant: 'default' as const, color: 'bg-green-100 text-green-800 border-green-200' },
      inactive: { label: 'غير نشط', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800 border-gray-200' },
      terminated: { label: 'منتهي الخدمة', variant: 'destructive' as const, color: 'bg-red-100 text-red-800 border-red-200' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'مدير', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      manager: { label: 'مدير تنفيذي', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      accountant: { label: 'محاسب', color: 'bg-green-100 text-green-800 border-green-200' },
      technician: { label: 'فني', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      receptionist: { label: 'موظف استقبال', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || { label: role, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return `د.ك ${amount.toFixed(3)}`;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: ar });
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-right flex items-center gap-2">
              <User className="w-6 h-6 text-primary" />
              تفاصيل الموظف
            </DialogTitle>
            <div className="flex gap-2">
              {onEditClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditClick(employee)}
                  className="flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  تعديل
                </Button>
              )}
              {onLinkUserClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onLinkUserClick(employee)}
                  className="flex items-center gap-1"
                >
                  <Link className="w-3 h-3" />
                  {employee.user_id ? 'إدارة الحساب' : 'ربط حساب'}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-1">
          {/* Basic Information */}
          <Card className="border-2 border-primary/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-primary flex items-center gap-2">
                <User className="w-5 h-5" />
                المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold">
                  {employee.first_name} {employee.last_name}
                </h2>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {employee.employee_number}
                </Badge>
                {getStatusBadge(employee.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employee.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">البريد:</span>
                    <span>{employee.email}</span>
                  </div>
                )}
                
                {employee.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">الهاتف:</span>
                    <span>{employee.phone}</span>
                  </div>
                )}

                {employee.national_id && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">الرقم المدني:</span>
                    <span>{employee.national_id}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">تاريخ التوظيف:</span>
                  <span>{formatDate(employee.hire_date)}</span>
                </div>
              </div>

              {employee.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                  <span className="font-medium">العنوان:</span>
                  <span className="flex-1">{employee.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-blue-700 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                معلومات العمل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium">المنصب:</span> {employee.position}
                </div>
                <div>
                  <span className="font-medium">القسم:</span> {employee.department}
                </div>
                <div>
                  <span className="font-medium">الراتب:</span> {formatCurrency(employee.salary)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Account Information */}
          <Card className={`border-2 ${employee.user_id ? 'border-green-200' : 'border-orange-200'}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-lg flex items-center gap-2 ${employee.user_id ? 'text-green-700' : 'text-orange-700'}`}>
                {employee.user_id ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                حساب المستخدم
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employee.user_id ? (
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-4 text-muted-foreground">
                      جاري تحميل بيانات الحساب...
                    </div>
                  ) : userProfile ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <UserCheck className="w-3 h-3 mr-1" />
                          مرتبط بحساب مستخدم
                        </Badge>
                        {getRoleBadge(userProfile.role)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">اسم المستخدم:</span> {userProfile.full_name}
                        </div>
                        <div>
                          <span className="font-medium">الدور:</span> {getRoleBadge(userProfile.role)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">تاريخ إنشاء الحساب:</span>
                          <span>{formatDate(userProfile.created_at)}</span>
                        </div>
                        <div>
                          <span className="font-medium">حالة الحساب:</span>
                          <Badge className={userProfile.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                            {userProfile.is_active ? 'نشط' : 'معطل'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      لم يتم العثور على بيانات الحساب
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 text-orange-600 mb-2">
                    <UserX className="w-5 h-5" />
                    <span className="font-medium">لا يوجد حساب مستخدم مرتبط</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    هذا الموظف لا يملك حساب مستخدم للدخول إلى النظام
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {(employee.emergency_contact_name || employee.emergency_contact_phone) && (
            <Card className="border-2 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  جهة الاتصال الطارئ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.emergency_contact_name && (
                    <div>
                      <span className="font-medium">الاسم:</span> {employee.emergency_contact_name}
                    </div>
                  )}
                  {employee.emergency_contact_phone && (
                    <div>
                      <span className="font-medium">رقم الهاتف:</span> {employee.emergency_contact_phone}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bank Information */}
          {(employee.bank_name || employee.bank_account_number) && (
            <Card className="border-2 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-700 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  المعلومات البنكية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.bank_name && (
                    <div>
                      <span className="font-medium">اسم البنك:</span> {employee.bank_name}
                    </div>
                  )}
                  {employee.bank_account_number && (
                    <div>
                      <span className="font-medium">رقم الحساب:</span> {employee.bank_account_number}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};