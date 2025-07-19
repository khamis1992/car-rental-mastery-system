
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Invoices: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة الفواتير</h1>
        <p className="text-muted-foreground">
          إنشاء وإدارة فواتير العملاء
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الفواتير</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            لا توجد فواتير مسجلة حالياً
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;
