import React from 'react';
import { AdminOnly } from '@/components/PermissionGuard';
import AdvancedPermissions from '@/components/SuperAdmin/AdvancedPermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * صفحة إدارة الصلاحيات المتقدمة
 * متاحة للمشرفين العامين فقط
 */
const PermissionsManagement: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      {/* حماية الصفحة للمشرفين العامين فقط */}
      <AdminOnly 
        level="super"
        fallback={
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <Shield className="w-5 h-5" />
                إدارة الصلاحيات المتقدمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  هذه الصفحة متاحة للمشرفين العامين فقط. يرجى التواصل مع الإدارة للحصول على الصلاحيات المناسبة.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        }
      >
        <AdvancedPermissions />
      </AdminOnly>
    </div>
  );
};

export default PermissionsManagement; 