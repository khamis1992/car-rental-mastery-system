
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  ChevronRight, 
  ChevronDown,
  Calculator,
  TrendingUp,
  Building,
  CreditCard,
  Users,
  Settings
} from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  children?: Account[];
  level: number;
  isExpanded?: boolean;
  allowPosting: boolean;
}

export const ModernChartOfAccounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: '1',
      code: '1',
      name: 'الأصول',
      type: 'asset',
      balance: 125000.500,
      level: 1,
      allowPosting: false,
      isExpanded: true,
      children: [
        {
          id: '11',
          code: '11',
          name: 'الأصول المتداولة',
          type: 'asset',
          balance: 85000.250,
          level: 2,
          allowPosting: false,
          isExpanded: true,
          children: [
            {
              id: '111',
              code: '111',
              name: 'النقدية والبنوك',
              type: 'asset',
              balance: 45000.000,
              level: 3,
              allowPosting: true
            },
            {
              id: '112',
              code: '112',
              name: 'المدينون',
              type: 'asset',
              balance: 25000.250,
              level: 3,
              allowPosting: true
            },
            {
              id: '113',
              code: '113',
              name: 'المخزون',
              type: 'asset',
              balance: 15000.000,
              level: 3,
              allowPosting: true
            }
          ]
        },
        {
          id: '12',
          code: '12',
          name: 'الأصول الثابتة',
          type: 'asset',
          balance: 40000.250,
          level: 2,
          allowPosting: false,
          children: [
            {
              id: '121',
              code: '121',
              name: 'السيارات والمعدات',
              type: 'asset',
              balance: 35000.000,
              level: 3,
              allowPosting: true
            },
            {
              id: '122',
              code: '122',
              name: 'مجمع استهلاك السيارات',
              type: 'asset',
              balance: -5000.000,
              level: 3,
              allowPosting: true
            }
          ]
        }
      ]
    },
    {
      id: '2',
      code: '2',
      name: 'الخصوم',
      type: 'liability',
      balance: 45000.750,
      level: 1,
      allowPosting: false,
      children: [
        {
          id: '21',
          code: '21',
          name: 'الخصوم المتداولة',
          type: 'liability',
          balance: 25000.750,
          level: 2,
          allowPosting: false,
          children: [
            {
              id: '211',
              code: '211',
              name: 'الدائنون',
              type: 'liability',
              balance: 15000.500,
              level: 3,
              allowPosting: true
            },
            {
              id: '212',
              code: '212',
              name: 'المصروفات المستحقة',
              type: 'liability',
              balance: 10000.250,
              level: 3,
              allowPosting: true
            }
          ]
        }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'asset':
        return <Building className="w-4 h-4 text-blue-600" />;
      case 'liability':
        return <CreditCard className="w-4 h-4 text-red-600" />;
      case 'equity':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'revenue':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'expense':
        return <Calculator className="w-4 h-4 text-orange-600" />;
      default:
        return <Calculator className="w-4 h-4" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      asset: 'أصول',
      liability: 'خصوم',
      equity: 'حقوق ملكية',
      revenue: 'إيرادات',
      expense: 'مصروفات'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getBalanceColor = (balance: number, type: string) => {
    if (balance === 0) return 'text-muted-foreground';
    if (type === 'asset' || type === 'expense') {
      return balance > 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return balance > 0 ? 'text-blue-600' : 'text-orange-600';
    }
  };

  const toggleAccountExpansion = (accountId: string) => {
    const updateAccounts = (accounts: Account[]): Account[] => {
      return accounts.map(account => {
        if (account.id === accountId) {
          return { ...account, isExpanded: !account.isExpanded };
        }
        if (account.children) {
          return { ...account, children: updateAccounts(account.children) };
        }
        return account;
      });
    };
    setAccounts(updateAccounts(accounts));
  };

  const renderAccount = (account: Account) => {
    const hasChildren = account.children && account.children.length > 0;
    const paddingLeft = `${account.level * 20}px`;

    return (
      <div key={account.id} className="border-b border-border/50">
        <div 
          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
          style={{ paddingRight: paddingLeft }}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-6 w-6"
                onClick={() => toggleAccountExpansion(account.id)}
              >
                {account.isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}
            
            {getAccountTypeIcon(account.type)}
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{account.code}</span>
                <span className="font-medium">{account.name}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {getAccountTypeLabel(account.type)}
                </Badge>
                {!account.allowPosting && (
                  <Badge variant="secondary" className="text-xs">
                    مجموعة
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left">
              <p className={`font-bold ${getBalanceColor(account.balance, account.type)}`}>
                {Math.abs(account.balance).toLocaleString('ar-KW', {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3
                })} د.ك
              </p>
              <p className="text-xs text-muted-foreground">
                {account.balance >= 0 ? 'مدين' : 'دائن'}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {hasChildren && account.isExpanded && account.children?.map(renderAccount)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">دليل الحسابات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة وتنظيم دليل الحسابات المحاسبي
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rtl-flex">
            <Settings className="w-4 h-4" />
            الإعدادات
          </Button>
          <Button className="rtl-flex">
            <Plus className="w-4 h-4" />
            حساب جديد
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="rtl-title">البحث والتصفية</CardTitle>
            <Badge variant="outline">
              {accounts.length} حساب رئيسي
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في الحسابات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Button variant="outline" className="rtl-flex">
              <Filter className="w-4 h-4" />
              تصفية متقدمة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">شجرة الحسابات</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {accounts.map(renderAccount)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
