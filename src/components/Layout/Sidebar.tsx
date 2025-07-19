import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLocation, Link } from 'react-router-dom';
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  ShoppingCart,
  Bell,
  Settings,
  HelpCircle,
  Calculator,
  FileText,
  Truck,
  Coins,
  Percent,
  Landmark,
  File,
  Zap,
  Shield
} from "lucide-react"

interface SidebarProps {
  isOpen: boolean;
  onToggle: (value: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const location = useLocation();

  const menuItems = [
    {
      key: 'dashboard',
      label: 'لوحة التحكم',
      path: '/',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      key: 'contracts',
      label: 'العقود',
      icon: <FileText className="w-4 h-4" />,
      children: [
        {
          key: 'new-contract',
          label: 'إنشاء عقد جديد',
          path: '/contracts/new',
          icon: <FileText className="w-4 h-4" />
        },
        {
          key: 'manage-contracts',
          label: 'إدارة العقود',
          path: '/contracts',
          icon: <FileText className="w-4 h-4" />
        },
        {
          key: 'contract-templates',
          label: 'نماذج العقود',
          path: '/contract-templates',
          icon: <File className="w-4 h-4" />
        }
      ]
    },
    {
      key: 'customers',
      label: 'العملاء',
      path: '/customers',
      icon: <Users className="w-4 h-4" />
    },
    {
      key: 'vehicles',
      label: 'المركبات',
      icon: <Truck className="w-4 h-4" />,
      children: [
        {
          key: 'new-vehicle',
          label: 'إضافة مركبة جديدة',
          path: '/vehicles/new',
          icon: <Truck className="w-4 h-4" />
        },
        {
          key: 'manage-vehicles',
          label: 'إدارة المركبات',
          path: '/vehicles',
          icon: <Truck className="w-4 h-4" />
        },
        {
          key: 'vehicle-types',
          label: 'أنواع المركبات',
          path: '/vehicle-types',
          icon: <Truck className="w-4 h-4" />
        }
      ]
    },
    {
      key: 'rentals',
      label: 'الإيجارات',
      icon: <Calendar className="w-4 h-4" />,
      children: [
        {
          key: 'new-rental',
          label: 'تسجيل إيجار جديد',
          path: '/rentals/new',
          icon: <Calendar className="w-4 h-4" />
        },
        {
          key: 'manage-rentals',
          label: 'إدارة الإيجارات',
          path: '/rentals',
          icon: <Calendar className="w-4 h-4" />
        },
        {
          key: 'rental-products',
          label: 'المنتجات الإيجارية',
          path: '/rental-products',
          icon: <ShoppingCart className="w-4 h-4" />
        }
      ]
    },
    {
      key: 'accounting',
      label: 'المحاسبة',
      icon: <Calculator className="w-4 h-4" />,
      children: [
        {
          key: 'chart-of-accounts',
          label: 'دليل الحسابات',
          path: '/accounting/chart-of-accounts',
          icon: <FileText className="w-4 h-4" />
        },
        {
          key: 'journal-entries',
          label: 'القيود اليومية',
          path: '/accounting/journal-entries',
          icon: <FileText className="w-4 h-4" />
        },
        {
          key: 'trial-balance',
          label: 'ميزان المراجعة',
          path: '/accounting/trial-balance-report',
          icon: <FileText className="w-4 h-4" />
        },
        {
          key: 'income-statement',
          label: 'قائمة الدخل',
          path: '/accounting/income-statement-report',
          icon: <FileText className="w-4 h-4" />
        },
        {
          key: 'balance-sheet',
          label: 'الميزانية العمومية',
          path: '/accounting/balance-sheet-report',
          icon: <FileText className="w-4 h-4" />
        },
        {
          key: 'fixed-assets',
          label: 'الأصول الثابتة',
          path: '/accounting/fixed-assets',
          icon: <Landmark className="w-4 h-4" />
        },
        {
          key: 'advanced-automation',
          label: 'المحاسبة المتقدمة',
          path: '/advanced-accounting',
          icon: <Zap className="w-4 h-4" />
        },
      ]
    },
    {
      key: 'reports',
      label: 'التقارير',
      icon: <FileText className="w-4 h-4" />,
      children: [
        {
          key: 'rental-reports',
          label: 'تقارير الإيجارات',
          path: '/rental-reports',
          icon: <FileText className="w-4 h-4" />
        },
        {
          key: 'financial-reports',
          label: 'تقارير مالية',
          path: '/financial-reports',
          icon: <FileText className="w-4 h-4" />
        }
      ]
    },
    {
      key: 'settings',
      label: 'الإعدادات',
      icon: <Settings className="w-4 h-4" />,
      children: [
        {
          key: 'general-settings',
          label: 'إعدادات عامة',
          path: '/settings/general',
          icon: <Settings className="w-4 h-4" />
        },
        {
          key: 'company-profile',
          label: 'بيانات الشركة',
          path: '/settings/company-profile',
          icon: <FileText className="w-4 h-4" />
        },
        {
          key: 'user-management',
          label: 'إدارة المستخدمين',
          path: '/settings/user-management',
          icon: <Users className="w-4 h-4" />
        },
        {
          key: 'roles-permissions',
          label: 'الأدوار والصلاحيات',
          path: '/settings/roles-permissions',
          icon: <Shield className="w-4 h-4" />
        },
        {
          key: 'notifications',
          label: 'الإشعارات',
          path: '/settings/notifications',
          icon: <Bell className="w-4 h-4" />
        }
      ]
    },
    {
      key: 'help',
      label: 'المساعدة',
      path: '/help',
      icon: <HelpCircle className="w-4 h-4" />
    }
  ];

  const toggleMenu = (key: string) => {
    setOpenMenus(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onToggle}>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle>القائمة</SheetTitle>
          <SheetDescription>
            تصفح الخيارات المتاحة وابدأ عملك.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="py-4">
            {menuItems.map(item => (
              item.children ? (
                <Accordion type="single" collapsible key={item.key}>
                  <AccordionItem value={item.key}>
                    <AccordionTrigger onClick={() => toggleMenu(item.key)} className="data-[state=open]:bg-secondary hover:bg-secondary flex items-center justify-between py-2 px-3 rounded-md">
                      <div className="flex items-center">
                        {item.icon}
                        <span className="mr-2">{item.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="py-2">
                        {item.children.map(child => (
                          <Link to={child.path} key={child.key} className={cn("flex items-center py-2 px-4 rounded-md hover:bg-muted", location.pathname === child.path ? "bg-muted font-medium" : "")}>
                            {child.icon}
                            <span className="mr-2">{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <Link to={item.path} key={item.key} className={cn("flex items-center py-2 px-3 rounded-md hover:bg-muted", location.pathname === item.path ? "bg-muted font-medium" : "")}>
                  {item.icon}
                  <span className="mr-2">{item.label}</span>
                </Link>
              )
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
