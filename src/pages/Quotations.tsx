
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Quotations: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة عروض الأسعار</h1>
        <p className="text-muted-foreground">
          إنشاء وإدارة عروض الأسعار للعملاء
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة عروض الأسعار</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            لا توجد عروض أسعار مسجلة حالياً
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Quotations;
