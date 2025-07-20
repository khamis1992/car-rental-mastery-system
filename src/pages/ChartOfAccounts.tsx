
import React, { useState } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Settings,
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';

const ChartOfAccounts = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const accounts = [
    {
      code: "1000",
      name: "النقدية في الصندوق",
      type: "أصول متداولة",
      balance: "15,000.000",
      currency: "د.ك",
      isActive: true
    },
    {
      code: "1100", 
      name: "البنك الأهلي الكويتي",
      type: "أصول متداولة",
      balance: "250,000.000",
      currency: "د.ك",
      isActive: true
    },
    {
      code: "1200",
      name: "العملاء والذمم المدينة",
      type: "أصول متداولة", 
      balance: "85,000.000",
      currency: "د.ك",
      isActive: true
    },
    {
      code: "1500",
      name: "أسطول السيارات",
      type: "أصول ثابتة",
      balance: "500,000.000",
      currency: "د.ك",
      isActive: true
    },
    {
      code: "2000",
      name: "الموردين والذمم الدائنة",
      type: "التزامات متداولة",
      balance: "45,000.000",
      currency: "د.ك",
      isActive: true
    },
    {
      code: "3000",
      name: "رأس المال",
      type: "حقوق الملكية",
      balance: "400,000.000", 
      currency: "د.ك",
      isActive: true
    },
    {
      code: "4000",
      name: "إيرادات الإيجار",
      type: "إيرادات",
      balance: "150,000.000",
      currency: "د.ك",
      isActive: true
    },
    {
      code: "5000",
      name: "مصاريف الصيانة",
      type: "مصاريف",
      balance: "25,000.000",
      currency: "د.ك",
      isActive: true
    }
  ];

  const accountTypeStats = [
    {
      type: "الأصول",
      count: 4,
      totalBalance: "850,000.000",
      icon: <TrendingUp className="w-5 h-5 text-green-500" />
    },
    {
      type: "الالتزامات",
      count: 1,
      totalBalance: "45,000.000",
      icon: <TrendingDown className="w-5 h-5 text-red-500" />
    },
    {
      type: "حقوق الملكية",
      count: 1, 
      totalBalance: "400,000.000",
      icon: <Building className="w-5 h-5 text-blue-500" />
    },
    {
      type: "الإيرادات والمصاريف",
      count: 2,
      totalBalance: "175,000.000",
      icon: <DollarSign className="w-5 h-5 text-purple-500" />
    }
  ];

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.code.includes(searchTerm) ||
    account.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">دليل الحسابات</h1>
            <p className="text-muted-foreground">إدارة الحسابات المحاسبية والأرصدة</p>
          </div>
          <div className="flex items-center gap-2 flex-row-reverse">
            <Button className="btn-primary rtl-flex">
              <Plus className="w-4 h-4" />
              حساب جديد
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/chart-of-accounts-setup')}
              className="rtl-flex"
            >
              <Settings className="w-4 h-4" />
              إعداد الدليل
            </Button>
          </div>
        </div>

        {/* Account Type Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accountTypeStats.map((stat, index) => (
            <Card key={index} className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.type}</p>
                    <p className="text-lg font-bold">{stat.count} حساب</p>
                    <p className="text-sm text-muted-foreground">{stat.totalBalance} د.ك</p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الحسابات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Accounts Table */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title flex items-center gap-2 flex-row-reverse">
              <Calculator className="w-5 h-5" />
              قائمة الحسابات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الحساب</TableHead>
                  <TableHead className="text-right">اسم الحساب</TableHead>
                  <TableHead className="text-right">نوع الحساب</TableHead>
                  <TableHead className="text-right">الرصيد</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.code}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {account.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {account.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-left">
                      {account.balance} {account.currency}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={account.isActive ? 'default' : 'secondary'}
                      >
                        {account.isActive ? 'نشط' : 'معطل'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <Button variant="ghost" size="sm">
                          عرض
                        </Button>
                        <Button variant="ghost" size="sm">
                          تعديل
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ChartOfAccounts;
