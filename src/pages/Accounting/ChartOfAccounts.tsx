
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ChartOfAccounts: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">دليل الحسابات</h1>
        <p className="text-muted-foreground">
          إدارة وتنظيم الحسابات المحاسبية
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>شجرة الحسابات</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            لا توجد حسابات محاسبية مسجلة حالياً
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChartOfAccounts;
