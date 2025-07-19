import React, { useState } from 'react';
import { ChartOfAccountsTab } from '@/components/Accounting/ChartOfAccountsTab';
import { GeneralLedgerReport } from '@/components/Accounting/GeneralLedgerReport';
import { AccountingDashboard } from '@/components/Accounting/AccountingDashboard';
import { Button } from '@/components/ui/button';
import { FileText, BarChart3, Settings, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ChartOfAccounts = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const navigationItems = [
    {
      id: 'overview',
      title: 'نظرة عامة',
      description: 'إحصائيات ومؤشرات الحسابات',
      icon: BarChart3,
      component: <AccountingDashboard />
    },
    {
      id: 'accounts',
      title: 'إدارة الحسابات',
      description: 'دليل الحسابات وإدارتها',
      icon: FileText,
      component: <ChartOfAccountsTab />
    },
    {
      id: 'reports',
      title: 'التقارير المالية',
      description: 'دفتر الأستاذ والتقارير',
      icon: FileText,
      component: <GeneralLedgerReport />
    }
  ];

  const activeItem = navigationItems.find(item => item.id === activeSection);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <h1 className="text-3xl font-bold text-foreground">دليل الحسابات</h1>
              <p className="text-muted-foreground mt-1">نظام إدارة الحسابات المحاسبية المتكامل</p>
            </div>
            
            <div className="flex items-center gap-3 flex-row-reverse">
              <Button className="rtl-flex" size="sm">
                <Plus className="w-4 h-4 ml-2" />
                حساب جديد
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-120px)]">
        {/* Sidebar Navigation */}
        <div className="w-80 border-l bg-card/50">
          <div className="p-4 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground text-right mb-4">الأقسام الرئيسية</h3>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <Card 
                  key={item.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isActive ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 text-right flex-row-reverse">
                      <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1 text-right">
                        <h4 className={`font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {item.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 text-right">
              <h2 className="text-2xl font-semibold text-foreground">
                {activeItem?.title}
              </h2>
              <p className="text-muted-foreground mt-1">
                {activeItem?.description}
              </p>
            </div>
            
            <div className="animate-fade-in">
              {activeItem?.component}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartOfAccounts;