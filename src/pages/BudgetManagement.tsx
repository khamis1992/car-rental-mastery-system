import React from 'react';
import { EnhancedBudgetManagement } from '@/components/Accounting/EnhancedBudgetManagement';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus, TrendingUp, PieChart, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BudgetManagement = () => {
  const budgetStats = [
    {
      title: "إجمالي الميزانية",
      value: "500,000 د.ك",
      change: "+5.2%",
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />
    },
    {
      title: "المنفق حتى الآن",
      value: "285,000 د.ك",
      change: "57%",
      icon: <PieChart className="w-5 h-5 text-orange-500" />
    },
    {
      title: "المتبقي",
      value: "215,000 د.ك",
      change: "43%",
      icon: <TrendingUp className="w-5 h-5 text-green-500" />
    },
    {
      title: "توقع نهاية العام",
      value: "480,000 د.ك",
      change: "-4%",
      icon: <Calendar className="w-5 h-5 text-purple-500" />
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة الميزانية</h1>
          <p className="text-muted-foreground">تخطيط ومراقبة الميزانيات السنوية والشهرية</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            تصدير الميزانية
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            تقرير التباين
          </Button>
          <Button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            ميزانية جديدة
          </Button>
        </div>
      </div>

      {/* Budget Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {budgetStats.map((stat, index) => (
          <Card key={index} className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-green-500">{stat.change}</p>
                </div>
                {stat.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Budget Management Interface */}
      <EnhancedBudgetManagement />
    </div>
  );
};

export default BudgetManagement;