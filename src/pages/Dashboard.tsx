
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Car, FileText, DollarSign } from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'إجمالي العملاء',
      value: '150',
      description: 'عميل نشط',
      icon: Users,
    },
    {
      title: 'المركبات المتاحة',
      value: '45',
      description: 'مركبة جاهزة للتأجير',
      icon: Car,
    },
    {
      title: 'العقود النشطة',
      value: '28',
      description: 'عقد تأجير نشط',
      icon: FileText,
    },
    {
      title: 'الإيرادات الشهرية',
      value: '12,500 د.ك',
      description: 'إيرادات هذا الشهر',
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground">
          نظرة عامة على أداء النظام
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>العمليات الأخيرة</CardTitle>
            <CardDescription>
              آخر العمليات المسجلة في النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">لا توجد عمليات حديثة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>التقارير السريعة</CardTitle>
            <CardDescription>
              معلومات سريعة عن الأداء
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">جاري تحميل التقارير...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
