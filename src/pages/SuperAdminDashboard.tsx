import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Crown
} from "lucide-react";
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';

const SuperAdminDashboard: React.FC = () => {
  const { currentUserRole } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();

  // إعادة التوجيه التلقائي إلى الصفحة الرئيسية الجديدة
  useEffect(() => {
    if (currentUserRole === 'super_admin') {
      navigate('/super-admin/main-dashboard', { replace: true });
    }
  }, [currentUserRole, navigate]);

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

  // عرض شاشة التحميل أثناء إعادة التوجيه
  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center" dir="rtl">
      <Card className="w-full max-w-md border-primary/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Crown className="w-16 h-16 text-primary mb-4 animate-pulse" />
          <h3 className="text-lg font-medium mb-2 text-primary">جاري التحميل...</h3>
          <p className="text-muted-foreground text-center">
            يتم إعادة توجيهك إلى لوحة التحكم الرئيسية
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;