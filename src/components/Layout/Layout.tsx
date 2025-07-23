
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { SearchDialog } from "@/components/Search/SearchDialog";

export function Layout() {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full" dir="rtl">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Navbar />
          <main className="flex-1 overflow-auto p-4">
            <ErrorBoundary
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-destructive mb-4">
                      حدث خطأ غير متوقع
                    </h1>
                    <p className="text-muted-foreground">
                      يرجى إعادة تحميل الصفحة أو الاتصال بالدعم الفني
                    </p>
                  </div>
                </div>
              }
            >
              <Outlet />
            </ErrorBoundary>
          </main>
        </SidebarInset>
        <SearchDialog />
      </div>
    </SidebarProvider>
  );
}
