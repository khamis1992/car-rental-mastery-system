import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  Book,
  BookOpen,
  BarChart,
  Calendar,
  CheckSquare,
  FileText,
  Home,
  ListChecks,
  Settings,
  User,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@supabase/auth-helpers-react";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { signOut } from "@/services/authService";

interface NavItem {
  name: string;
  href: string;
  icon: React.LucideIcon;
}

const generalItems: NavItem[] = [
  { name: "الرئيسية", href: "/", icon: Home },
  { name: "المستخدمون", href: "/users", icon: Users },
  { name: "الملف الشخصي", href: "/profile", icon: User },
];

const accountingItems = [
  { name: "دليل الحسابات", href: "/chart-of-accounts", icon: BookOpen },
  { name: "إدخال القيود", href: "/journal-entries", icon: FileText },
  { name: "دفتر الأستاذ العام", href: "/general-ledger", icon: Book },
  { name: "التقارير المالية", href: "/financial-reports", icon: BarChart },
  { name: "طلبات تعديل الحسابات", href: "/account-modification-requests", icon: Settings },
];

const inventoryItems: NavItem[] = [
  { name: "إدارة المخزون", href: "/inventory", icon: ListChecks },
  { name: "الموردون", href: "/suppliers", icon: Users },
  { name: "العملاء", href: "/customers", icon: Users },
];

const taskItems: NavItem[] = [
  { name: "إدارة المهام", href: "/tasks", icon: CheckSquare },
  { name: "التقويم", href: "/calendar", icon: Calendar },
];

const settingsItems: NavItem[] = [
  { name: "إعدادات النظام", href: "/settings", icon: Settings },
];

const Sidebar = () => {
  const pathname = usePathname();
  const user = useUser();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">Open</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-sm rtl">
        <SheetHeader className="space-y-2.5">
          <SheetTitle className="rtl-title">قائمة التنقل</SheetTitle>
          <SheetDescription>
            تصفح بسهولة بين أقسام النظام المختلفة.
          </SheetDescription>
        </SheetHeader>
        <NavigationMenu>
          <NavigationMenuList>
            {generalItems.map((item) => (
              <NavigationMenuItem key={item.name}>
                <Link href={item.href} legacyBehavior passHref>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="justify-start rtl-flex"
                    asChild
                  >
                    <item.icon className="h-4 w-4 ml-2" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <Separator className="my-4" />
        <h4 className="mb-1 mt-4 rounded-md px-2 py-1 text-sm font-semibold">
          المحاسبة
        </h4>
        <NavigationMenu>
          <NavigationMenuList>
            {accountingItems.map((item) => (
              <NavigationMenuItem key={item.name}>
                <Link href={item.href} legacyBehavior passHref>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="justify-start rtl-flex"
                    asChild
                  >
                    <item.icon className="h-4 w-4 ml-2" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <Separator className="my-4" />
        <h4 className="mb-1 mt-4 rounded-md px-2 py-1 text-sm font-semibold">
          المخزون
        </h4>
        <NavigationMenu>
          <NavigationMenuList>
            {inventoryItems.map((item) => (
              <NavigationMenuItem key={item.name}>
                <Link href={item.href} legacyBehavior passHref>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="justify-start rtl-flex"
                    asChild
                  >
                    <item.icon className="h-4 w-4 ml-2" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <Separator className="my-4" />
        <h4 className="mb-1 mt-4 rounded-md px-2 py-1 text-sm font-semibold">
          المهام
        </h4>
        <NavigationMenu>
          <NavigationMenuList>
            {taskItems.map((item) => (
              <NavigationMenuItem key={item.name}>
                <Link href={item.href} legacyBehavior passHref>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="justify-start rtl-flex"
                    asChild
                  >
                    <item.icon className="h-4 w-4 ml-2" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <Separator className="my-4" />
        <h4 className="mb-1 mt-4 rounded-md px-2 py-1 text-sm font-semibold">
          الإعدادات
        </h4>
        <NavigationMenu>
          <NavigationMenuList>
            {settingsItems.map((item) => (
              <NavigationMenuItem key={item.name}>
                <Link href={item.href} legacyBehavior passHref>
                  <Button
                    variant={pathname === item.href ? "secondary" : "ghost"}
                    className="justify-start rtl-flex"
                    asChild
                  >
                    <item.icon className="h-4 w-4 ml-2" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <Separator className="my-4" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-auto justify-start rtl-flex">
              <Avatar className="mr-2 h-8 w-8">
                <AvatarImage src="/images/avatars/01.png" alt="Avatar" />
                <AvatarFallback>OM</AvatarFallback>
              </Avatar>
              <span className="font-normal">
                {user?.email ? user.email : "حسابي"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          {/* <DropdownMenuContent align="end" forceMount>
            <DropdownMenuItem>
              <Link href="/profile" className="w-full">
                الملف الشخصي
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings" className="w-full">
                الإعدادات
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>تسجيل الخروج</DropdownMenuItem>
          </DropdownMenuContent> */}
        </DropdownMenu>
      </SheetContent>
    </Sheet>
  );
};

function Menu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

export default Sidebar;
