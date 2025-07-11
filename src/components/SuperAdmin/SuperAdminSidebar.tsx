import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  Users,
  CreditCard,
  Settings,
  Shield,
  Database,
  TrendingUp,
  Globe,
  Activity,
  FileText,
  AlertTriangle
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "لوحة التحكم الرئيسية",
    url: "/super-admin/main-dashboard",
    icon: BarChart3,
    description: "نظرة عامة على النظام"
  },
  {
    title: "إدارة المؤسسات",
    url: "/super-admin/tenants",
    icon: Building2,
    description: "إدارة الشركات والمؤسسات"
  },
  {
    title: "إدارة المستخدمين",
    url: "/super-admin/users",
    icon: Users,
    description: "إدارة حسابات المستخدمين"
  },
  {
    title: "الاشتراكات والفواتير",
    url: "/super-admin/billing",
    icon: CreditCard,
    description: "إدارة الاشتراكات والمدفوعات"
  },
  {
    title: "التقارير والتحليلات",
    url: "/super-admin/analytics",
    icon: TrendingUp,
    description: "تقارير شاملة وتحليلات"
  },
  {
    title: "مراقبة النظام",
    url: "/super-admin/monitoring",
    icon: Activity,
    description: "مراقبة أداء النظام"
  },
  {
    title: "إدارة قاعدة البيانات",
    url: "/super-admin/database",
    icon: Database,
    description: "إدارة وصيانة قاعدة البيانات"
  },
  {
    title: "السجلات والأمان",
    url: "/super-admin/security",
    icon: Shield,
    description: "سجلات الأمان والمراجعة"
  },
  {
    title: "التقارير المالية",
    url: "/super-admin/financial",
    icon: FileText,
    description: "التقارير المالية والمحاسبية"
  },
  {
    title: "التنبيهات والإشعارات",
    url: "/super-admin/alerts",
    icon: AlertTriangle,
    description: "إدارة التنبيهات والإشعارات"
  },
  {
    title: "الإعدادات العامة",
    url: "/super-admin/settings",
    icon: Settings,
    description: "إعدادات النظام العامة"
  }
];

export function SuperAdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" : "hover:bg-muted/50";

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-80"}
      collapsible="icon"
      side="right"
    >
      <SidebarContent className="bg-gradient-soft" dir="rtl">
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3 flex-row-reverse">
            <div className="bg-gradient-primary p-2 rounded-lg shadow-glow">
              <Globe className="w-6 h-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="text-right">
                <h2 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                  إدارة النظام العام
                </h2>
                <p className="text-xs text-muted-foreground">
                  لوحة التحكم الرئيسية
                </p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-right text-xs text-muted-foreground font-medium px-6 py-2">
            القوائم الرئيسية
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                    >
                      <div className="flex items-center gap-3 flex-row-reverse w-full p-3">
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && (
                          <div className="text-right flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </div>
                          </div>
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Status Indicator */}
        <div className="mt-auto p-6 border-t border-border/50">
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            {!collapsed && (
              <span className="text-xs text-muted-foreground">
                النظام يعمل بشكل طبيعي
              </span>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}