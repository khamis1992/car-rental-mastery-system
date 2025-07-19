
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Vehicles: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة المركبات</h1>
        <p className="text-muted-foreground">
          إدارة أسطول المركبات المتاحة للتأجير
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المركبات</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            لا توجد مركبات مسجلة حالياً
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Vehicles;
