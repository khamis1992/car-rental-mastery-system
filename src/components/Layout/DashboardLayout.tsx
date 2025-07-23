
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { SearchDialog } from '@/components/Search/SearchDialog';

const DashboardLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="transition-all duration-300 ease-in-out">
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
      <SearchDialog />
    </div>
  );
};

export default DashboardLayout;
