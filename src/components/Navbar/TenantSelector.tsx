import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, Users } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

const TenantSelector: React.FC = () => {
  const { currentTenant, currentUserRole, loading } = useTenant();

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      super_admin: 'مدير النظام العام',
      tenant_admin: 'مدير المؤسسة',
      manager: 'مدير',
      accountant: 'محاسب',
      receptionist: 'موظف استقبال',
      user: 'مستخدم'
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      super_admin: 'bg-red-500',
      tenant_admin: 'bg-purple-500',
      manager: 'bg-blue-500',
      accountant: 'bg-green-500',
      receptionist: 'bg-orange-500',
      user: 'bg-gray-500'
    };
    return roleColors[role] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded"></div>
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <Button variant="outline" className="rtl-flex gap-2" disabled>
        <Building2 className="w-4 h-4" />
        <span>لا توجد مؤسسة</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="rtl-flex gap-2 min-w-0">
          <ChevronDown className="w-4 h-4" />
          <div className="flex flex-col items-end min-w-0">
            <span className="text-sm font-medium truncate max-w-32">
              {currentTenant.name}
            </span>
            {currentUserRole && (
              <Badge 
                variant="secondary" 
                className={`text-xs ${getRoleColor(currentUserRole)} text-white`}
              >
                {getRoleLabel(currentUserRole)}
              </Badge>
            )}
          </div>
          <Building2 className="w-4 h-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-right">
          <div className="flex flex-col">
            <span className="font-medium">المؤسسة الحالية</span>
            <span className="text-sm text-muted-foreground">
              {currentTenant.name}
            </span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="rtl-flex gap-2">
          <Users className="w-4 h-4" />
          <div className="flex flex-col">
            <span>دورك في المؤسسة</span>
            <span className="text-sm text-muted-foreground">
              {currentUserRole ? getRoleLabel(currentUserRole) : 'غير محدد'}
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <div className="p-2">
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="block">الخطة:</span>
              <span className="font-medium">{currentTenant.subscription_plan}</span>
            </div>
            <div>
              <span className="block">الحالة:</span>
              <span className="font-medium">
                {currentTenant.subscription_status === 'active' ? 'نشط' : 
                 currentTenant.subscription_status === 'trial' ? 'تجريبي' : 
                 currentTenant.subscription_status}
              </span>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TenantSelector;