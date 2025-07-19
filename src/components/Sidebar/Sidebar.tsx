
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Users, 
  Car, 
  FileText, 
  Receipt, 
  Calculator,
  BarChart3,
  CreditCard,
  Settings,
  LogOut
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  className?: string;
}

const Sidebar = ({ className }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const menuItems = [
    {
      title: 'لوحة المعلومات',
      icon: Home,
      path: '/dashboard'
    },
    {
      title: 'العملاء',
      icon: Users,
      path: '/customers'
    },
    {
      title: 'الأسطول',
      icon: Car,
      path: '/fleet'
    },
    {
      title: 'العقود',
      icon: FileText,
      path: '/contracts'
    },
    {
      title: 'الفواتير',
      icon: Receipt,
      path: '/invoices'
    },
    {
      title: 'الإدارة المالية',
      icon: Calculator,
      path: '/financial',
      children: [
        {
          title: 'دليل الحسابات',
          icon: BarChart3,
          path: '/chart-of-accounts'
        },
        {
          title: 'القيود المحاسبية',
          icon: FileText,
          path: '/journal-entries'
        },
        {
          title: 'إدارة المصروفات',
          icon: CreditCard,
          path: '/expense-management'
        },
        {
          title: 'التقارير المالية',
          icon: BarChart3,
          path: '/financial-reports'
        }
      ]
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className={cn("pb-12 min-h-screen", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              
              return (
                <div key={index}>
                  <Button
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start rtl-flex",
                      isActive(item.path) && "bg-secondary text-secondary-foreground"
                    )}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="ml-2 h-4 w-4" />
                    {item.title}
                  </Button>
                  
                  {item.children && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children.map((child, childIndex) => {
                        const ChildIcon = child.icon;
                        return (
                          <Button
                            key={childIndex}
                            variant={isActive(child.path) ? "secondary" : "ghost"}
                            size="sm"
                            className={cn(
                              "w-full justify-start rtl-flex text-sm",
                              isActive(child.path) && "bg-secondary text-secondary-foreground"
                            )}
                            onClick={() => navigate(child.path)}
                          >
                            <ChildIcon className="ml-2 h-3 w-3" />
                            {child.title}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="px-3 py-2 border-t">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start rtl-flex"
              onClick={() => navigate('/settings')}
            >
              <Settings className="ml-2 h-4 w-4" />
              الإعدادات
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start rtl-flex text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
