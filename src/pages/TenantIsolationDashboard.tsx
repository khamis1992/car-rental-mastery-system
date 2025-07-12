import React from 'react';
import { TenantIsolationMonitor } from '@/components/Admin/TenantIsolationMonitor';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';

export default function TenantIsolationDashboard() {
  const { user } = useAuth();
  const { currentUserRole } = useTenant();

  // التحقق من الصلاحيات - مسموح للمديرين والمشرفين فقط
  const hasAccess = user?.email === 'admin@admin.com' || 
    currentUserRole === 'tenant_admin' || 
    currentUserRole === 'manager';

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ليس لديك صلاحية للوصول إلى هذه الصفحة. يجب أن تكون مدير نظام أو مدير مؤسسة.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <TenantIsolationMonitor />
    </div>
  );
}