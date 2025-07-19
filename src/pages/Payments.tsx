
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Payments: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة المدفوعات</h1>
        <p className="text-muted-foreground">
          تتبع وإدارة مدفوعات العملاء
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المدفوعات</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            لا توجد مدفوعات مسجلة حالياً
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
