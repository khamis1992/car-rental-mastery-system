
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Branches: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة الفروع</h1>
        <p className="text-muted-foreground">
          إدارة فروع الشركة ومراكز التكلفة
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>قائمة الفروع</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">لا توجد فروع مسجلة حالياً</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Branches;
