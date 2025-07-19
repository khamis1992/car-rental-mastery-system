
import React from 'react';
import { Card } from '@/components/ui/card';

const Departments: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">إدارة الأقسام</h1>
      <Card className="p-6"><p>تنظيم وإدارة أقسام الشركة</p></Card>
    </div>
  );
};

export default Departments;
