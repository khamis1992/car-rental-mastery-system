
import React from 'react';
import { ChartOfAccountsTab } from '@/components/Accounting/ChartOfAccountsTab';
import { ChartOfAccountsSetup } from '@/components/Accounting/ChartOfAccountsSetup';
import { GeneralLedgerReport } from '@/components/Accounting/GeneralLedgerReport';
import { AccountingDashboard } from '@/components/Accounting/AccountingDashboard';
import { ModernChartOfAccountsTree } from '@/components/Accounting/ModernChartOfAccountsTree';
import { FinancialBreadcrumb } from '@/components/Financial/FinancialBreadcrumb';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, Upload, Download, BarChart3, Settings, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ChartOfAccounts = () => {
  // Mock data with comprehensive account structure
  const mockAccounts = [
    {
      id: '1',
      account_code: '1000',
      account_name: 'الأصول',
      account_type: 'asset' as const,
      current_balance: 875000,
      level: 1,
      allow_posting: false,
      is_active: true,
      children: [
        {
          id: '2',
          account_code: '1100',
          account_name: 'الأصول المتداولة',
          account_type: 'asset' as const,
          current_balance: 485000,
          level: 2,
          parent_account_id: '1',
          allow_posting: false,
          is_active: true,
          children: [
            {
              id: '3',
              account_code: '1110',
              account_name: 'النقدية والبنوك',
              account_type: 'asset' as const,
              current_balance: 125000,
              level: 3,
              parent_account_id: '2',
              allow_posting: false,
              is_active: true,
              children: [
                {
                  id: '4',
                  account_code: '1111',
                  account_name: 'صندوق النقدية',
                  account_type: 'asset' as const,
                  current_balance: 15000,
                  level: 4,
                  parent_account_id: '3',
                  allow_posting: true,
                  is_active: true
                },
                {
                  id: '5',
                  account_code: '1112',
                  account_name: 'البنك التجاري الكويتي',
                  account_type: 'asset' as const,
                  current_balance: 85000,
                  level: 4,
                  parent_account_id: '3',
                  allow_posting: true,
                  is_active: true
                },
                {
                  id: '6',
                  account_code: '1113',
                  account_name: 'بنك الكويت الوطني',
                  account_type: 'asset' as const,
                  current_balance: 25000,
                  level: 4,
                  parent_account_id: '3',
                  allow_posting: true,
                  is_active: true
                }
              ]
            },
            {
              id: '7',
              account_code: '1120',
              account_name: 'العملاء والمدينون',
              account_type: 'asset' as const,
              current_balance: 180000,
              level: 3,
              parent_account_id: '2',
              allow_posting: false,
              is_active: true,
              children: [
                {
                  id: '8',
                  account_code: '1121',
                  account_name: 'حسابات العملاء',
                  account_type: 'asset' as const,
                  current_balance: 150000,
                  level: 4,
                  parent_account_id: '7',
                  allow_posting: true,
                  is_active: true
                },
                {
                  id: '9',
                  account_code: '1122',
                  account_name: 'أوراق القبض',
                  account_type: 'asset' as const,
                  current_balance: 30000,
                  level: 4,
                  parent_account_id: '7',
                  allow_posting: true,
                  is_active: true
                }
              ]
            },
            {
              id: '10',
              account_code: '1130',
              account_name: 'المخزون',
              account_type: 'asset' as const,
              current_balance: 180000,
              level: 3,
              parent_account_id: '2',
              allow_posting: false,
              is_active: true,
              children: [
                {
                  id: '11',
                  account_code: '1131',
                  account_name: 'مخزون قطع الغيار',
                  account_type: 'asset' as const,
                  current_balance: 120000,
                  level: 4,
                  parent_account_id: '10',
                  allow_posting: true,
                  is_active: true
                },
                {
                  id: '12',
                  account_code: '1132',
                  account_name: 'مخزون الوقود',
                  account_type: 'asset' as const,
                  current_balance: 60000,
                  level: 4,
                  parent_account_id: '10',
                  allow_posting: true,
                  is_active: true
                }
              ]
            }
          ]
        },
        {
          id: '13',
          account_code: '1200',
          account_name: 'الأصول الثابتة',
          account_type: 'asset' as const,
          current_balance: 390000,
          level: 2,
          parent_account_id: '1',
          allow_posting: false,
          is_active: true,
          children: [
            {
              id: '14',
              account_code: '1210',
              account_name: 'المركبات والمعدات',
              account_type: 'asset' as const,
              current_balance: 300000,
              level: 3,
              parent_account_id: '13',
              allow_posting: false,
              is_active: true,
              children: [
                {
                  id: '15',
                  account_code: '1211',
                  account_name: 'السيارات',
                  account_type: 'asset' as const,
                  current_balance: 250000,
                  level: 4,
                  parent_account_id: '14',
                  allow_posting: true,
                  is_active: true
                },
                {
                  id: '16',
                  account_code: '1212',
                  account_name: 'الحافلات',
                  account_type: 'asset' as const,
                  current_balance: 50000,
                  level: 4,
                  parent_account_id: '14',
                  allow_posting: true,
                  is_active: true
                }
              ]
            },
            {
              id: '17',
              account_code: '1220',
              account_name: 'المباني والمنشآت',
              account_type: 'asset' as const,
              current_balance: 90000,
              level: 3,
              parent_account_id: '13',
              allow_posting: true,
              is_active: true
            }
          ]
        }
      ]
    },
    {
      id: '18',
      account_code: '2000',
      account_name: 'الخصوم',
      account_type: 'liability' as const,
      current_balance: 285000,
      level: 1,
      allow_posting: false,
      is_active: true,
      children: [
        {
          id: '19',
          account_code: '2100',
          account_name: 'الخصوم المتداولة',
          account_type: 'liability' as const,
          current_balance: 185000,
          level: 2,
          parent_account_id: '18',
          allow_posting: false,
          is_active: true,
          children: [
            {
              id: '20',
              account_code: '2110',
              account_name: 'الموردون والدائنون',
              account_type: 'liability' as const,
              current_balance: 95000,
              level: 3,
              parent_account_id: '19',
              allow_posting: true,
              is_active: true
            },
            {
              id: '21',
              account_code: '2120',
              account_name: 'المصروفات المستحقة',
              account_type: 'liability' as const,
              current_balance: 45000,
              level: 3,
              parent_account_id: '19',
              allow_posting: true,
              is_active: true
            },
            {
              id: '22',
              account_code: '2130',
              account_name: 'رواتب الموظفين المستحقة',
              account_type: 'liability' as const,
              current_balance: 45000,
              level: 3,
              parent_account_id: '19',
              allow_posting: true,
              is_active: true
            }
          ]
        },
        {
          id: '23',
          account_code: '2200',
          account_name: 'الخصوم طويلة الأجل',
          account_type: 'liability' as const,
          current_balance: 100000,
          level: 2,
          parent_account_id: '18',
          allow_posting: false,
          is_active: true,
          children: [
            {
              id: '24',
              account_code: '2210',
              account_name: 'قروض بنكية طويلة الأجل',
              account_type: 'liability' as const,
              current_balance: 100000,
              level: 3,
              parent_account_id: '23',
              allow_posting: true,
              is_active: true
            }
          ]
        }
      ]
    },
    {
      id: '25',
      account_code: '3000',
      account_name: 'حقوق الملكية',
      account_type: 'equity' as const,
      current_balance: 350000,
      level: 1,
      allow_posting: false,
      is_active: true,
      children: [
        {
          id: '26',
          account_code: '3100',
          account_name: 'رأس المال',
          account_type: 'equity' as const,
          current_balance: 300000,
          level: 2,
          parent_account_id: '25',
          allow_posting: true,
          is_active: true
        },
        {
          id: '27',
          account_code: '3200',
          account_name: 'الأرباح المحتجزة',
          account_type: 'equity' as const,
          current_balance: 50000,
          level: 2,
          parent_account_id: '25',
          allow_posting: true,
          is_active: true
        }
      ]
    },
    {
      id: '28',
      account_code: '4000',
      account_name: 'الإيرادات',
      account_type: 'revenue' as const,
      current_balance: 240000,
      level: 1,
      allow_posting: false,
      is_active: true,
      children: [
        {
          id: '29',
          account_code: '4100',
          account_name: 'إيرادات التأجير',
          account_type: 'revenue' as const,
          current_balance: 200000,
          level: 2,
          parent_account_id: '28',
          allow_posting: false,
          is_active: true,
          children: [
            {
              id: '30',
              account_code: '4110',
              account_name: 'إيرادات تأجير السيارات',
              account_type: 'revenue' as const,
              current_balance: 150000,
              level: 3,
              parent_account_id: '29',
              allow_posting: true,
              is_active: true
            },
            {
              id: '31',
              account_code: '4120',
              account_name: 'إيرادات تأجير الحافلات',
              account_type: 'revenue' as const,
              current_balance: 50000,
              level: 3,
              parent_account_id: '29',
              allow_posting: true,
              is_active: true
            }
          ]
        },
        {
          id: '32',
          account_code: '4200',
          account_name: 'إيرادات أخرى',
          account_type: 'revenue' as const,
          current_balance: 40000,
          level: 2,
          parent_account_id: '28',
          allow_posting: false,
          is_active: true,
          children: [
            {
              id: '33',
              account_code: '4210',
              account_name: 'إيرادات الصيانة',
              account_type: 'revenue' as const,
              current_balance: 25000,
              level: 3,
              parent_account_id: '32',
              allow_posting: true,
              is_active: true
            },
            {
              id: '34',
              account_code: '4220',
              account_name: 'إيرادات التأمين',
              account_type: 'revenue' as const,
              current_balance: 15000,
              level: 3,
              parent_account_id: '32',
              allow_posting: true,
              is_active: true
            }
          ]
        }
      ]
    },
    {
      id: '35',
      account_code: '5000',
      account_name: 'المصروفات',
      account_type: 'expense' as const,
      current_balance: 175000,
      level: 1,
      allow_posting: false,
      is_active: true,
      children: [
        {
          id: '36',
          account_code: '5100',
          account_name: 'المصروفات التشغيلية',
          account_type: 'expense' as const,
          current_balance: 125000,
          level: 2,
          parent_account_id: '35',
          allow_posting: false,
          is_active: true,
          children: [
            {
              id: '37',
              account_code: '5110',
              account_name: 'الرواتب والأجور',
              account_type: 'expense' as const,
              current_balance: 75000,
              level: 3,
              parent_account_id: '36',
              allow_posting: true,
              is_active: true
            },
            {
              id: '38',
              account_code: '5120',
              account_name: 'مصروفات الوقود',
              account_type: 'expense' as const,
              current_balance: 30000,
              level: 3,
              parent_account_id: '36',
              allow_posting: true,
              is_active: true
            },
            {
              id: '39',
              account_code: '5130',
              account_name: 'مصروفات الصيانة',
              account_type: 'expense' as const,
              current_balance: 20000,
              level: 3,
              parent_account_id: '36',
              allow_posting: true,
              is_active: true
            }
          ]
        },
        {
          id: '40',
          account_code: '5200',
          account_name: 'المصروفات الإدارية',
          account_type: 'expense' as const,
          current_balance: 50000,
          level: 2,
          parent_account_id: '35',
          allow_posting: false,
          is_active: true,
          children: [
            {
              id: '41',
              account_code: '5210',
              account_name: 'إيجار المكاتب',
              account_type: 'expense' as const,
              current_balance: 25000,
              level: 3,
              parent_account_id: '40',
              allow_posting: true,
              is_active: true
            },
            {
              id: '42',
              account_code: '5220',
              account_name: 'مصروفات الكهرباء والماء',
              account_type: 'expense' as const,
              current_balance: 15000,
              level: 3,
              parent_account_id: '40',
              allow_posting: true,
              is_active: true
            },
            {
              id: '43',
              account_code: '5230',
              account_name: 'مصروفات الاتصالات',
              account_type: 'expense' as const,
              current_balance: 10000,
              level: 3,
              parent_account_id: '40',
              allow_posting: true,
              is_active: true
            }
          ]
        }
      ]
    }
  ];

  const handleAddAccount = (parentId?: string) => {
    console.log('Add account', parentId);
    // Navigate to add account form
  };

  const handleEditAccount = (account: any) => {
    console.log('Edit account', account);
    // Navigate to edit account form
  };

  const handleViewLedger = (account: any) => {
    console.log('View ledger', account);
    // Navigate to ledger view
  };

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Navigation */}
      <FinancialBreadcrumb />
      
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 rtl-title">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            دليل الحسابات
          </h1>
          <p className="text-muted-foreground mt-2">إدارة وتنظيم دليل الحسابات المحاسبي بطريقة حديثة وسهلة</p>
        </div>
        
        <div className="flex items-center gap-2 rtl-flex">
          <Button variant="outline" className="flex items-center gap-2 rtl-flex">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button variant="outline" className="flex items-center gap-2 rtl-flex">
            <Upload className="w-4 h-4" />
            استيراد
          </Button>
          <Button variant="outline" className="flex items-center gap-2 rtl-flex">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
          <Button className="btn-primary flex items-center gap-2 rtl-flex" onClick={() => handleAddAccount()}>
            <Plus className="w-4 h-4" />
            حساب جديد
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 rtl-flex">
              <div className="p-2 bg-green-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">43</p>
                <p className="text-sm text-muted-foreground">إجمالي الحسابات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 rtl-flex">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">26</p>
                <p className="text-sm text-muted-foreground">حسابات قابلة للترحيل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 rtl-flex">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">17</p>
                <p className="text-sm text-muted-foreground">حسابات رئيسية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 rtl-flex">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Upload className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">4</p>
                <p className="text-sm text-muted-foreground">مستويات</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tree" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tree">عرض شجري حديث</TabsTrigger>
          <TabsTrigger value="dashboard">لوحة المعلومات</TabsTrigger>
          <TabsTrigger value="accounts">دليل الحسابات</TabsTrigger>
          <TabsTrigger value="ledger">دفتر الأستاذ</TabsTrigger>
          <TabsTrigger value="setup">إعداد الحسابات</TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="space-y-4">
          <ModernChartOfAccountsTree
            accounts={mockAccounts}
            onAddAccount={handleAddAccount}
            onEditAccount={handleEditAccount}
            onViewLedger={handleViewLedger}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <AccountingDashboard />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <ChartOfAccountsTab />
        </TabsContent>

        <TabsContent value="ledger" className="space-y-4">
          <GeneralLedgerReport />
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <ChartOfAccountsSetup />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChartOfAccounts;
