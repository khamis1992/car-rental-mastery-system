
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Employees: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إدارة الموظفين</h1>
        <p className="text-muted-foreground">
          إدارة بيانات الموظفين والمستخدمين
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الموظفين</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            لا يوجد موظفون مسجلون حالياً
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Employees;
