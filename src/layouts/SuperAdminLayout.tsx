import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/SuperAdmin/SuperAdminSidebar";
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Crown, Menu } from "lucide-react";

const SuperAdminLayout: React.FC = () => {
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
    <SidebarProvider dir="rtl">
      <div className="flex min-h-screen w-full" dir="rtl">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b border-border/50 px-4 z-50">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="p-2 hover:bg-muted/50 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </SidebarTrigger>
            <div className="text-sm text-muted-foreground">
              مرحباً، {user?.email}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Crown className="w-4 h-4" />
            <span>مدير النظام العام</span>
          </div>
        </header>

        <SuperAdminSidebar />
        
        <main className="flex-1 pt-14 bg-gradient-soft">
          <div className="h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminLayout;