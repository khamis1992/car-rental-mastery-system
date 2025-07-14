import React, { useState } from 'react';
import { QuickBooksNavigation } from '@/components/Accounting/QuickBooksStyle/QuickBooksNavigation';
import { SimpleDashboard } from '@/components/Accounting/QuickBooksStyle/SimpleDashboard';
import { SimpleJournalEntries } from '@/components/Accounting/QuickBooksStyle/SimpleJournalEntries';
import { AccountsTreeView } from '@/components/Accounting/QuickBooksStyle/AccountsTreeView';
import { TraditionalReports } from '@/components/Accounting/QuickBooksStyle/TraditionalReports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const QuickBooksAccounting = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SimpleDashboard />;
      case 'journal':
        return <SimpleJournalEntries />;
      case 'accounts':
        return <AccountsTreeView />;
      case 'reports':
        return <TraditionalReports />;
      case 'settings':
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات النظام المحاسبي</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">سيتم إضافة إعدادات النظام المحاسبي قريباً</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <SimpleDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* الشريط العلوي */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              النظام المحاسبي المبسط
            </div>
            <h1 className="text-2xl font-bold text-primary">
              المحاسبة - نمط كويك بوكس
            </h1>
          </div>
        </div>
      </div>

      {/* شريط التنقل */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <QuickBooksNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </div>

      {/* المحتوى */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-lg shadow-sm min-h-[70vh]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default QuickBooksAccounting;