import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Calendar, User, Search, LogOut, Settings, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { NotificationCenter } from "@/components/Navbar/NotificationCenter";
import DailyTasksButton from "@/components/Navbar/DailyTasksButton";
import { AttendanceClock } from "@/components/Navbar/AttendanceClock";
import { useSearch } from "@/contexts/SearchContext";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { setIsOpen } = useSearch();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
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

  const currentDate = new Date().toLocaleDateString('ar-KW', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory'
  });

  return (
    <header className="bg-card border-b border-border shadow-elegant px-6 py-3">
      <div className="flex items-center justify-between">
        {/* زر الشريط الجانبي والتاريخ */}
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{currentDate}</span>
          </p>
        </div>

        {/* شريط البحث وساعة الحضور */}
        <div className="flex items-center gap-4 flex-1 max-w-2xl mx-8">
          <div className="flex-1 max-w-md">
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground h-10 px-3"
              onClick={() => setIsOpen(true)}
            >
              <Search className="w-4 h-4 mr-2" />
              البحث في النظام...
              <div className="ml-auto text-xs text-muted-foreground">
                Ctrl+K
              </div>
            </Button>
          </div>
          
          {/* ساعة الحضور */}
          <AttendanceClock />
        </div>

        {/* منطقة المستخدم والإشعارات */}
        <div className="flex items-center gap-4">
          {/* أيقونة مهام اليوم */}
          <DailyTasksButton />
          
          {/* مركز الإشعارات الموحد */}
          <NotificationCenter />

          {/* قائمة المستخدم */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">
                    {profile?.full_name || user?.email || 'المستخدم'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile ? getRoleLabel(profile.role) : 'مستخدم'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-right">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {profile?.full_name || 'المستخدم'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="cursor-pointer flex items-center gap-2"
                onClick={() => navigate('/settings')}
              >
                <Settings className="w-4 h-4" />
                الإعدادات
              </DropdownMenuItem>
              
              {(profile?.role === 'admin' || profile?.role === 'manager') && (
                <DropdownMenuItem 
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => navigate('/settings?tab=users')}
                >
                  <Shield className="w-4 h-4" />
                  إدارة المستخدمين
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 flex items-center gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  );
};

export default Navbar;