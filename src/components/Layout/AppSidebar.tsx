import React, { useState } from "react";
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
  Calendar,
  Building2,
  DollarSign,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Crown,
  CreditCard,
  Activity,
  Star,
  Zap,
  Shield,
  Brain,
  Package,
  Eye,
  TrendingUp
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
import { useTenant } from "@/contexts/TenantContext";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// الأعمال الأساسية
const coreBusinessItems = [
  { 
    title: "الرئيسية", 
    url: "/dashboard", 
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
];

// المالية المتقدمة - النظام الجديد
const advancedFinancialItems = [
  { 
    title: "النظام المالي الجديد", 
    url: "/financial/new-dashboard", 
    icon: Star,
    badge: "جديد",
    badgeColor: "bg-green-500"
  },
  { 
    title: "إدارة خطط الاشتراك", 
    url: "/financial/subscriptions", 
    icon: Package,
    badge: "4 خطط",
    badgeColor: "bg-blue-500"
  },
  { 
    title: "إدارة الأدوار المتقدمة", 
    url: "/financial/advanced-roles", 
    icon: Shield,
    badge: "32 إذن",
    badgeColor: "bg-purple-500"
  },
  { 
    title: "نظام CRM المتطور", 
    url: "/financial/crm-dashboard", 
    icon: Users,
    badge: "متطور",
    badgeColor: "bg-orange-500"
  },
  { 
    title: "Event Bus Monitor", 
    url: "/financial/event-bus", 
    icon: Activity,
    badge: "مباشر",
    badgeColor: "bg-red-500"
  },
  { 
    title: "التحليلات المالية المتقدمة", 
    url: "/financial/analytics", 
    icon: Brain,
    badge: "AI",
    badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500"
  },
  { 
    title: "إدارة المستأجرين", 
    url: "/financial/tenant-management", 
    icon: Building2,
    badge: "شامل",
    badgeColor: "bg-indigo-500"
  },
];

// المالية التقليدية
const financialItems = [
  { 
    title: "المحاسبة", 
    url: "/accounting", 
    icon: Calculator 
  },
  { 
    title: "التقارير المحاسبية", 
    url: "/accounting-reports", 
    icon: BarChart3 
  },
  { 
    title: "مراكز التكلفة", 
    url: "/cost-centers", 
    icon: Building2 
  },
  { 
    title: "الفوترة", 
    url: "/billing", 
    icon: CreditCard 
  }
];

// إدارة الأسطول
const fleetManagementItems = [
  { 
    title: "صيانة المركبات", 
    url: "/maintenance", 
    icon: Wrench 
  },
  { 
    title: "المخالفات المرورية", 
    url: "/violations", 
    icon: AlertTriangle 
  }
];

// الموارد البشرية
const hrItems = [
  { 
    title: "الموظفون", 
    url: "/employees", 
    icon: Users 
  },
  { 
    title: "الحضور والانصراف", 
    url: "/attendance", 
    icon: Clock 
  },
  { 
    title: "كشوف المرتبات", 
    url: "/payroll", 
    icon: DollarSign 
  },
  { 
    title: "طلبات الإجازات", 
    url: "/leaves", 
    icon: Calendar 
  }
];

// النظام
const systemItems = [
  { 
    title: "الإشعارات", 
    url: "/notifications", 
    icon: Bell 
  },
  { 
    title: "التواصل", 
    url: "/communications", 
    icon: MessageCircle 
  },
  { 
    title: "الإعدادات", 
    url: "/settings", 
    icon: Settings 
  }
];

// إدارة النظام العام (لمديري النظام العام فقط)
const superAdminItems = [
  { 
    title: "لوحة التحكم الرئيسية", 
    url: "/super-admin/main-dashboard", 
    icon: BarChart3 
  },
  { 
    title: "إدارة المؤسسات", 
    url: "/super-admin/tenant-management", 
    icon: Building2 
  },
  { 
    title: "إدارة المستخدمين والصلاحيات", 
    url: "/super-admin/users-permissions", 
    icon: Users 
  },
  { 
    title: "إدارة الفوترة والاشتراكات", 
    url: "/super-admin/billing-subscriptions", 
    icon: DollarSign 
  },
  { 
    title: "إدارة مدفوعات SADAD", 
    url: "/super-admin/sadad-payments", 
    icon: CreditCard 
  },
  { 
    title: "مراقبة النظام والأداء", 
    url: "/super-admin/system-monitoring", 
    icon: Activity 
  },
  { 
    title: "أدوات الصيانة", 
    url: "/super-admin/maintenance-tools", 
    icon: Settings 
  },
  { 
    title: "إدارة الدعم الفني", 
    url: "/super-admin/technical-support", 
    icon: MessageCircle 
  },
  { 
    title: "محرر الصفحة الرئيسية", 
    url: "/super-admin/landing-editor", 
    icon: FileText 
  },
  { 
    title: "الإعدادات العامة", 
    url: "/super-admin/global-settings", 
    icon: Settings 
  },
];

export function AppSidebar() {
  const { user, profile, isSaasAdmin } = useAuth();
  const { settings } = useSettings();
  const { currentTenant } = useTenant();
  const { state } = useSidebar();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    core: true,
    advancedFinancial: true,
    financial: false,
    fleet: false,
    hr: false,
    system: false,
    superadmin: false
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const currentUserRole = profile?.role || 'user';

  // Filter HR items based on user role
  const filteredHrItems = hrItems.filter(item => {
    if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
      return true; // Admin can see all HR items
    }
    if (currentUserRole === 'manager') {
      return ['attendance', 'leaves'].some(allowed => item.url.includes(allowed));
    }
    return false; // Other roles can't see HR items
  });

  const getRoleColor = (role: string) => {
    const roleColors = {
      'admin': 'bg-gradient-to-r from-purple-500 to-blue-500',
      'manager': 'bg-gradient-to-r from-blue-500 to-green-500',
      'employee': 'bg-gradient-to-r from-green-500 to-yellow-500',
      'accountant': 'bg-gradient-to-r from-yellow-500 to-orange-500',
      'user': 'bg-gradient-to-r from-gray-500 to-gray-600'
    };
    return roleColors[role as keyof typeof roleColors] || 'bg-gray-500';
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      'admin': 'مدير',
      'manager': 'مدير فرع',
      'employee': 'موظف',
      'accountant': 'محاسب',
      'user': 'مستخدم'
    };
    return roleLabels[role as keyof typeof roleLabels] || 'مستخدم';
  };

  const renderMenuGroup = (
    items: Array<{ title: string; url: string; icon: any; badge?: string; badgeColor?: string }>, 
    groupId: string, 
    groupLabel: string, 
    groupIcon: any
  ) => {
    const isExpanded = expandedGroups[groupId];
    
    return (
      <SidebarGroup key={groupId}>
        <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(groupId)}>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer">
              <div className="flex items-center gap-2 flex-1">
                {React.createElement(groupIcon, { className: "w-4 h-4" })}
                {state === "expanded" && (
                  <>
                    <span>{groupLabel}</span>
                    <div className="ml-auto">
                      {isExpanded ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                    </div>
                  </>
                )}
              </div>
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={location.pathname === item.url}
                      className="w-full"
                    >
                      <NavLink to={item.url}>
                        <item.icon className="w-4 h-4" />
                        {state === "expanded" && (
                          <div className="flex items-center justify-between flex-1">
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge 
                                className={`text-white text-xs px-2 py-0.5 ${item.badgeColor}`}
                                style={item.badgeColor?.includes('gradient') ? 
                                  { background: item.badgeColor.replace('bg-', '') } : {}
                                }
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
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
              <h2 className="text-lg font-bold text-foreground">{currentTenant?.name || 'النظام'}</h2>
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
        {isSaasAdmin ? (
          // عرض قسم إدارة النظام العام فقط لـ admin@admin.com
          renderMenuGroup(superAdminItems, "superadmin", "إدارة النظام العام", Crown)
        ) : (
          // عرض جميع الأقسام للمستخدمين العاديين
          <>
            {renderMenuGroup(coreBusinessItems, "core", "الأعمال الأساسية", Building2)}
            {renderMenuGroup(advancedFinancialItems, "advancedFinancial", "النظام المالي الجديد", Star)}
            {renderMenuGroup(financialItems, "financial", "المالية التقليدية", Calculator)}
            {renderMenuGroup(fleetManagementItems, "fleet", "إدارة الأسطول", Car)}
            {filteredHrItems.length > 0 && renderMenuGroup(filteredHrItems, "hr", "الموارد البشرية", UserCheck)}
            {renderMenuGroup(systemItems, "system", "النظام", Settings)}
            {currentUserRole === 'super_admin' && renderMenuGroup(superAdminItems, "superadmin", "إدارة النظام العام", Crown)}
          </>
        )}

        {/* New System Alert */}
        {state === "expanded" && !isSaasAdmin && (
          <div className="p-4 mx-4 mt-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">النظام المالي الجديد</span>
            </div>
            <p className="text-xs text-green-700 mb-3">
              استكشف الميزات المتقدمة الجديدة مع 145 جدول و 408 فهرس!
            </p>
            <NavLink to="/financial/new-dashboard">
              <Badge className="bg-green-500 text-white hover:bg-green-600 cursor-pointer w-full justify-center">
                <TrendingUp className="w-3 h-3 ml-1" />
                استكشف الآن
              </Badge>
            </NavLink>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}