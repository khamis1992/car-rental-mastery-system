
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  BarChart3,
  Plus,
  AlertCircle,
  CheckCircle,
  Calendar,
  Target,
  Briefcase
} from 'lucide-react';

export const CostCenterManagement = () => {
  const [costCenters, setCostCenters] = useState([
    {
      id: 1,
      code: 'CC-001',
      name: 'قسم المبيعات',
      type: 'operational',
      budget: 50000,
      spent: 32500,
      employees: 12,
      status: 'active',
      manager: 'أحمد الكندري',
      lastUpdated: '2025-01-15'
    },
    {
      id: 2,
      code: 'CC-002', 
      name: 'قسم الإدارة',
      type: 'administrative',
      budget: 30000,
      spent: 28500,
      employees: 8,
      status: 'active',
      manager: 'فاطمة العنزي',
      lastUpdated: '2025-01-14'
    },
    {
      id: 3,
      code: 'CC-003',
      name: 'قسم الصيانة',
      type: 'operational',
      budget: 25000,
      spent: 15750,
      employees: 6,
      status: 'active',
      manager: 'محمد الشمري',
      lastUpdated: '2025-01-13'
    }
  ]);

  const totalBudget = costCenters.reduce((sum, cc) => sum + cc.budget, 0);
  const totalSpent = costCenters.reduce((sum, cc) => sum + cc.spent, 0);
  const totalEmployees = costCenters.reduce((sum, cc) => sum + cc.employees, 0);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-primary rtl-title flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              إدارة مراكز التكلفة
            </h3>
            <p className="text-muted-foreground mt-2">
              إدارة شاملة لمراكز التكلفة وميزانياتها وأداءها مع تتبع الموظفين والنفقات
            </p>
          </div>
          <Badge variant="default" className="rtl-flex">
            <Briefcase className="w-4 h-4" />
            إدارة
          </Badge>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عدد المراكز</p>
                <p className="text-2xl font-bold text-blue-600">{costCenters.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الميزانية</p>
                <p className="text-2xl font-bold text-green-600">{totalBudget.toLocaleString()} د.ك</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">المصروف</p>
                <p className="text-2xl font-bold text-orange-600">{totalSpent.toLocaleString()} د.ك</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
                <p className="text-2xl font-bold text-purple-600">{totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="centers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="centers">المراكز</TabsTrigger>
          <TabsTrigger value="budgets">الميزانيات</TabsTrigger>
          <TabsTrigger value="performance">الأداء</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="centers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold rtl-title">قائمة مراكز التكلفة</h4>
            <Button className="rtl-flex">
              <Plus className="w-4 h-4" />
              مركز تكلفة جديد
            </Button>
          </div>
          
          <div className="grid gap-4">
            {costCenters.map((center) => (
              <Card key={center.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-semibold text-lg">{center.name}</h5>
                        <Badge variant="outline">{center.code}</Badge>
                        <Badge variant={center.type === 'operational' ? 'default' : 'secondary'}>
                          {center.type === 'operational' ? 'تشغيلي' : 'إداري'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">المدير</p>
                          <p className="font-medium">{center.manager}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الموظفين</p>
                          <p className="font-medium">{center.employees} موظف</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">الميزانية</p>
                          <p className="font-medium">{center.budget.toLocaleString()} د.ك</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">المصروف</p>
                          <p className="font-medium">{center.spent.toLocaleString()} د.ك</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">استخدام الميزانية</span>
                          <span className="text-sm font-medium">
                            {((center.spent / center.budget) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={(center.spent / center.budget) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {(center.spent / center.budget) > 0.9 ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                إدارة الميزانيات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                عرض وتحديث ميزانيات مراكز التكلفة مع مراقبة الاستخدام
              </p>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Calendar className="w-4 h-4" />
                  ميزانية السنة القادمة
                </Button>
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4" />
                  تقرير الميزانية
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <Target className="w-5 h-5" />
                تحليل الأداء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                تحليل أداء مراكز التكلفة وكفاءة استخدام الموارد
              </p>
              <div className="flex gap-2">
                <Button variant="outline">
                  <TrendingUp className="w-4 h-4" />
                  تقرير الأداء الشهري
                </Button>
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4" />
                  مقارنة المراكز
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <Settings className="w-5 h-5" />
                إعدادات مراكز التكلفة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                إدارة إعدادات النظام الخاصة بمراكز التكلفة
              </p>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Settings className="w-4 h-4" />
                  الإعدادات العامة
                </Button>
                <Button variant="outline">
                  <Users className="w-4 h-4" />
                  إدارة الأذونات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
