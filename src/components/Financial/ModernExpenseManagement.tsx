
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Receipt, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Settings,
  Eye,
  Edit,
  FileText
} from 'lucide-react';

interface ExpenseVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  beneficiary: string;
  amount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';
  category: string;
  description: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  budgetAmount: number;
  spentAmount: number;
  isActive: boolean;
}

export const ModernExpenseManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('vouchers');
  const [searchTerm, setSearchTerm] = useState('');

  const [vouchers] = useState<ExpenseVoucher[]>([
    {
      id: '1',
      voucherNumber: 'EXP-2025-001',
      date: '2025-01-19',
      beneficiary: 'شركة الخدمات المتقدمة',
      amount: 1250.500,
      status: 'pending',
      category: 'صيانة',
      description: 'صيانة دورية للمركبات'
    },
    {
      id: '2',
      voucherNumber: 'EXP-2025-002',
      date: '2025-01-18',
      beneficiary: 'أحمد محمد العلي',
      amount: 750.000,
      status: 'approved',
      category: 'مصروفات إدارية',
      description: 'مصروفات سفر وانتقالات'
    },
    {
      id: '3',
      voucherNumber: 'EXP-2025-003',
      date: '2025-01-17',
      beneficiary: 'مكتب المحاسبة القانونية',
      amount: 2100.000,
      status: 'rejected',
      category: 'خدمات مهنية',
      description: 'استشارات مالية ومحاسبية'
    }
  ]);

  const [categories] = useState<ExpenseCategory[]>([
    {
      id: '1',
      name: 'صيانة المركبات',
      code: 'MAINT',
      description: 'جميع مصروفات الصيانة والإصلاح',
      budgetAmount: 15000.000,
      spentAmount: 8750.500,
      isActive: true
    },
    {
      id: '2',
      name: 'مصروفات إدارية',
      code: 'ADMIN',
      description: 'المصروفات الإدارية العامة',
      budgetAmount: 12000.000,
      spentAmount: 6200.250,
      isActive: true
    },
    {
      id: '3',
      name: 'خدمات مهنية',
      code: 'PROF',
      description: 'الاستشارات والخدمات المهنية',
      budgetAmount: 8000.000,
      spentAmount: 4500.000,
      isActive: true
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'paid':
        return <Receipt className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'مسودة',
      pending: 'في انتظار الموافقة',
      approved: 'تمت الموافقة',
      rejected: 'مرفوض',
      paid: 'مدفوع'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'paid':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getBudgetUsageColor = (spent: number, budget: number) => {
    const percentage = (spent / budget) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground rtl-title">إدارة المصروفات</h1>
          <p className="text-muted-foreground mt-1">
            إدارة شاملة لسندات الصرف والفئات والموافقات
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rtl-flex">
            <BarChart3 className="w-4 h-4" />
            التقارير
          </Button>
          <Button className="rtl-flex">
            <Plus className="w-4 h-4" />
            سند صرف جديد
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">12,450.500 د.ك</p>
                <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">في انتظار الموافقة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">تمت الموافقة عليها</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">مرفوضة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">إدارة المصروفات</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="vouchers">سندات الصرف</TabsTrigger>
              <TabsTrigger value="categories">فئات المصروفات</TabsTrigger>
              <TabsTrigger value="approvals">الموافقات</TabsTrigger>
              <TabsTrigger value="reports">التقارير</TabsTrigger>
            </TabsList>

            {/* Vouchers Tab */}
            <TabsContent value="vouchers" className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="البحث في سندات الصرف..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                <Button variant="outline" className="rtl-flex">
                  <Filter className="w-4 h-4" />
                  فلتر
                </Button>
              </div>

              <div className="border rounded-lg">
                <div className="grid grid-cols-7 gap-4 p-4 font-medium border-b bg-muted/50">
                  <div>رقم السند</div>
                  <div>التاريخ</div>
                  <div>المستفيد</div>
                  <div>المبلغ</div>
                  <div>الفئة</div>
                  <div>الحالة</div>
                  <div>الإجراءات</div>
                </div>
                
                {vouchers.map((voucher) => (
                  <div key={voucher.id} className="grid grid-cols-7 gap-4 p-4 border-b hover:bg-muted/25">
                    <div className="font-medium">{voucher.voucherNumber}</div>
                    <div>{voucher.date}</div>
                    <div>{voucher.beneficiary}</div>
                    <div className="font-bold">
                      {voucher.amount.toLocaleString('ar-KW', {
                        minimumFractionDigits: 3
                      })} د.ك
                    </div>
                    <div>{voucher.category}</div>
                    <div>
                      <Badge variant={getStatusVariant(voucher.status) as any}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(voucher.status)}
                          {getStatusLabel(voucher.status)}
                        </div>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">فئات المصروفات</h3>
                <Button className="rtl-flex">
                  <Plus className="w-4 h-4" />
                  فئة جديدة
                </Button>
              </div>

              <div className="grid gap-4">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{category.name}</h4>
                            <Badge variant="outline">{category.code}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                        
                        <div className="text-left space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">المنصرف</p>
                            <p className={`font-bold ${getBudgetUsageColor(category.spentAmount, category.budgetAmount)}`}>
                              {category.spentAmount.toLocaleString('ar-KW', {
                                minimumFractionDigits: 3
                              })} د.ك
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">الميزانية</p>
                            <p className="font-bold">
                              {category.budgetAmount.toLocaleString('ar-KW', {
                                minimumFractionDigits: 3
                              })} د.ك
                            </p>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                (category.spentAmount / category.budgetAmount) >= 0.9 
                                  ? 'bg-red-500' 
                                  : (category.spentAmount / category.budgetAmount) >= 0.75 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                              }`}
                              style={{ 
                                width: `${Math.min((category.spentAmount / category.budgetAmount) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Approvals Tab */}
            <TabsContent value="approvals" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4" />
                <p>نظام الموافقات قيد التطوير</p>
                <p className="text-sm">سيتم إضافة إدارة الموافقات قريباً</p>
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                <p>تقارير المصروفات قيد التطوير</p>
                <p className="text-sm">سيتم إضافة التقارير التفصيلية قريباً</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
