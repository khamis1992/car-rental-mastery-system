import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Search } from "lucide-react";

const Navbar = () => {
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
        </div>

        {/* شريط البحث */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text"
              placeholder="البحث في النظام..."
              className="w-full pr-10 pl-4 py-2 bg-muted border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* منطقة المستخدم والإشعارات */}
        <div className="flex items-center gap-4">
          {/* إشعارات سريعة */}
          <div className="flex gap-2">
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
                <div className="text-right">
                  <p className="text-sm font-medium">أحمد المدير</p>
                  <p className="text-xs text-muted-foreground">مدير النظام</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
              <DropdownMenuItem>الإعدادات</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-danger">تسجيل الخروج</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;