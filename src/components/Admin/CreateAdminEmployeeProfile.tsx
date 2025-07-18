import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  UserPlus, 
  CheckCircle, 
  AlertTriangle, 
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  DollarSign
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CreateAdminEmployeeProfile: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasEmployeeProfile, setHasEmployeeProfile] = useState(false);
  const [employeeData, setEmployeeData] = useState({
    name: profile?.full_name || '',
    email: profile?.email || '',
    phone: '',
    position: 'مدير عام',
    department: 'الإدارة العامة',
    employmentType: 'دوام كامل',
    salary: '0',
    hireDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    checkEmployeeProfile();
  }, [user]);

  const checkEmployeeProfile = async () => {
    if (!user || !profile) return;

    setChecking(true);
    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setHasEmployeeProfile(!!employee);
    } catch (error) {
      console.error('خطأ في فحص ملف الموظف:', error);
      setHasEmployeeProfile(false);
    } finally {
      setChecking(false);
    }
  };

  const generateEmployeeNumber = async (tenantId: string): Promise<string> => {
    const { count } = await supabase
      .from('employees')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId);

    const nextNumber = (count || 0) + 1;
    return `EMP-${nextNumber.toString().padStart(3, '0')}`;
  };

  const createEmployeeProfile = async () => {
    if (!user || !profile?.tenant_id) {
      toast({
        title: 'خطأ',
        description: 'بيانات المستخدم أو المؤسسة غير متوفرة',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const employeeNumber = await generateEmployeeNumber(profile.tenant_id);

      const { data, error } = await supabase
        .from('employees')
        .insert({
          tenant_id: profile.tenant_id,
          user_id: user.id,
          employee_number: employeeNumber,
          name: employeeData.name,
          email: employeeData.email,
          phone: employeeData.phone,
          position: employeeData.position,
          department: employeeData.department,
          hire_date: employeeData.hireDate,
          employment_type: employeeData.employmentType,
          salary: parseFloat(employeeData.salary),
          is_active: true,
          notes: 'تم إنشاء ملف الموظف للمدير بعد تسجيل المؤسسة',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: `تم إنشاء ملف الموظف برقم ${employeeNumber}`,
      });

      setHasEmployeeProfile(true);
    } catch (error) {
      console.error('خطأ في إنشاء ملف الموظف:', error);
      toast({
        title: 'خطأ في إنشاء ملف الموظف',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setEmployeeData(prev => ({ ...prev, [field]: value }));
  };

  if (checking) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-muted-foreground">جاري فحص ملف الموظف...</p>
        </CardContent>
      </Card>
    );
  }

  if (hasEmployeeProfile) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>ملف الموظف موجود:</strong> تم إنشاء ملف موظف لحسابك مسبقاً. 
          يمكنك مراجعته وتحديثه من قسم الموظفين.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          إنشاء ملف موظف للمدير
        </CardTitle>
        <p className="text-muted-foreground">
          لم يتم إنشاء ملف موظف لحسابك تلقائياً. يمكنك إنشاؤه الآن لتفعيل ميزات الموارد البشرية.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>مهم:</strong> إنشاء ملف الموظف سيمكنك من:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>تسجيل الحضور والغياب</li>
              <li>طلب الإجازات</li>
              <li>استلام الراتب من النظام</li>
              <li>ظهورك في تقارير الموارد البشرية</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">الاسم الكامل</Label>
            <div className="relative">
              <User className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
              <Input
                id="name"
                value={employeeData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                className="pr-10"
                placeholder="الاسم الكامل"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={employeeData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className="pr-10"
                placeholder="البريد الإلكتروني"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">رقم الهاتف</Label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
              <Input
                id="phone"
                value={employeeData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                className="pr-10"
                placeholder="رقم الهاتف"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="position">المنصب</Label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
              <Input
                id="position"
                value={employeeData.position}
                onChange={(e) => updateFormData('position', e.target.value)}
                className="pr-10"
                placeholder="المنصب"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="department">القسم</Label>
            <Input
              id="department"
              value={employeeData.department}
              onChange={(e) => updateFormData('department', e.target.value)}
              placeholder="القسم"
            />
          </div>

          <div>
            <Label htmlFor="employmentType">نوع التوظيف</Label>
            <Input
              id="employmentType"
              value={employeeData.employmentType}
              onChange={(e) => updateFormData('employmentType', e.target.value)}
              placeholder="نوع التوظيف"
            />
          </div>

          <div>
            <Label htmlFor="hireDate">تاريخ التوظيف</Label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
              <Input
                id="hireDate"
                type="date"
                value={employeeData.hireDate}
                onChange={(e) => updateFormData('hireDate', e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="salary">الراتب الأساسي (ريال)</Label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
              <Input
                id="salary"
                type="number"
                value={employeeData.salary}
                onChange={(e) => updateFormData('salary', e.target.value)}
                className="pr-10"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            onClick={createEmployeeProfile}
            disabled={loading || !employeeData.name.trim()}
            className="min-w-32"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                جاري الإنشاء...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                إنشاء ملف الموظف
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateAdminEmployeeProfile; 