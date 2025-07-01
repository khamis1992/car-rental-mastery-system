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
import { Calendar, User, Search, LogOut, Settings, Shield, Bell, Users, Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

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

  const currentDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'gregory'
  });

  return (
    <nav className="bg-card border-b border-border shadow-elegant px-6 py-4">
      <div className="flex items-center justify-between">
        {/* الشعار والعنوان */}
        <div className="flex items-center gap-4">
          <div className="bg-gradient-primary p-3 rounded-xl shadow-glow">
            <div className="text-primary-foreground font-bold text-lg">🚗</div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">نظام إدارة تأجير السيارات</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {currentDate}
            </p>
          </div>
          {profile && (
            <Badge className={`text-white ${getRoleColor(profile.role)}`}>
              {getRoleLabel(profile.role)}
            </Badge>
          )}
        </div>

        {/* شريط البحث والتنقل */}
        <div className="flex-1 max-w-md mx-8">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                type="text"
                placeholder="البحث في النظام..."
                className="w-full pr-10 pl-4 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            
            {/* أزرار التنقل السريع */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/customers')}
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                <span className="hidden md:inline">العملاء</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/fleet')}
                className="flex items-center gap-2"
              >
                <Car className="w-4 h-4" />
                <span className="hidden md:inline">الأسطول</span>
              </Button>
            </div>
          </div>
        </div>

        {/* منطقة المستخدم والإشعارات */}
        <div className="flex items-center gap-4">
          {/* زر الإشعارات */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              3
            </Badge>
          </Button>

          {/* إشعارات سريعة */}
          <div className="hidden lg:flex gap-2">
            <Badge variant="secondary" className="bg-warning text-warning-foreground">
              5 عقود تنتهي اليوم
            </Badge>
            <Badge variant="secondary" className="bg-danger text-danger-foreground">
              2 سيارة تحتاج صيانة
            </Badge>
          </div>

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
                <div className="text-right hidden md:block">
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
              
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 ml-2" />
                الإعدادات
              </DropdownMenuItem>
              
              {(profile?.role === 'admin' || profile?.role === 'manager') && (
                <DropdownMenuItem className="cursor-pointer">
                  <Shield className="w-4 h-4 ml-2" />
                  إدارة المستخدمين
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="cursor-pointer text-red-600"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;