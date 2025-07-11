import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Globe,
  Crown
} from "lucide-react";
import AdvancedPermissions from "@/components/SuperAdmin/AdvancedPermissions";
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';

const UsersAndPermissions: React.FC = () => {
  const { currentUserRole } = useTenant();
  const { user } = useAuth();

  // التحقق من صلاحيات الوصول
  if (currentUserRole !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Crown className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2 text-destructive">غير مصرح بالوصول</h3>
            <p className="text-muted-foreground text-center">
              تحتاج إلى صلاحيات مدير النظام العام للوصول إلى هذه الصفحة
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
              <Users className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                إدارة المستخدمين والصلاحيات
              </h1>
              <p className="text-muted-foreground">
                إدارة المستخدمين والأدوار والصلاحيات عبر جميع المؤسسات
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground text-right">
            <Globe className="w-4 h-4" />
            <span>النظام العام</span>
          </div>
        </div>

        {/* Permissions Management Component */}
        <AdvancedPermissions />
      </div>
    </div>
  );
};

export default UsersAndPermissions; 