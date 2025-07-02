import { useState } from "react";
import { 
  Home, 
  Users, 
  Car, 
  FileText, 
  Calculator, 
  BarChart3, 
  Wrench,
  AlertTriangle,
  MessageCircle,
  Bell,
  Settings,
  Clock,
  Calendar
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Badge } from "@/components/ui/badge";

const mainItems = [
  { 
    title: "الرئيسية", 
    url: "/", 
    icon: Home 
  },
  { 
    title: "العملاء", 
    url: "/customers", 
    icon: Users 
  },
  { 
    title: "الأسطول", 
    url: "/fleet", 
    icon: Car 
  },
  { 
    title: "عروض الأسعار", 
    url: "/quotations", 
    icon: FileText 
  },
  { 
    title: "العقود", 
    url: "/contracts", 
    icon: FileText 
  },
  { 
    title: "المحاسبة", 
    url: "/accounting", 
    icon: Calculator 
  },
  { 
    title: "التحليلات", 
    url: "/analytics", 
    icon: BarChart3 
  },
  { 
    title: "الصيانة", 
    url: "/maintenance", 
    icon: Wrench 
  },
  { 
    title: "المخالفات المرورية", 
    url: "/violations", 
    icon: AlertTriangle 
  },
  { 
    title: "الموظفين", 
    url: "/employees", 
    icon: Users 
  },
  { 
    title: "الحضور والغياب", 
    url: "/attendance", 
    icon: Clock 
  },
  { 
    title: "الإجازات", 
    url: "/leaves", 
    icon: Calendar 
  },
  { 
    title: "الرواتب", 
    url: "/payroll", 
    icon: Calculator 
  },
];

const otherItems = [
  { 
    title: "التواصل", 
    url: "/communications", 
    icon: MessageCircle 
  },
  { 
    title: "الإشعارات", 
    url: "/notifications", 
    icon: Bell 
  },
  { 
    title: "الإعدادات", 
    url: "/settings", 
    icon: Settings 
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile } = useAuth();
  const currentPath = location.pathname;
  
  // محاولة الحصول على الإعدادات مع قيمة افتراضية
  let attendanceEnabled = true;
  try {
    const { systemSettings } = useSettings();
    attendanceEnabled = systemSettings.attendanceEnabled;
  } catch (error) {
    // في حالة عدم توفر السياق، استخدم القيمة الافتراضية
    console.warn('Settings context not available, using default values');
  }
  
  // فلترة العناصر بناءً على الإعدادات
  const filteredMainItems = mainItems.filter(item => {
    if (item.url === "/attendance" && !attendanceEnabled) {
      return false;
    }
    return true;
  });

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'مدير النظام',
      manager: 'مدير',
      accountant: 'محاسب',
      technician: 'فني',
      receptionist: 'موظف استقبال'
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: 'bg-red-500',
      manager: 'bg-blue-500',
      accountant: 'bg-green-500',
      technician: 'bg-orange-500',
      receptionist: 'bg-gray-500'
    };
    return roleColors[role] || 'bg-gray-500';
  };

  return (
    <Sidebar className="border-l" side="right">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-primary p-2 rounded-lg shadow-glow">
            <div className="text-primary-foreground font-bold text-lg">🚗</div>
          </div>
          {state === "expanded" && (
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">نظام إدارة تأجير السيارات</h2>
              {profile && (
                <Badge className={`text-white text-xs ${getRoleColor(profile.role)}`}>
                  {getRoleLabel(profile.role)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>القوائم الرئيسية</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"}
                      className={getNavClassName(item.url)}
                    >
                      <item.icon className="w-4 h-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>أخرى</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      className={getNavClassName(item.url)}
                    >
                      <item.icon className="w-4 h-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}