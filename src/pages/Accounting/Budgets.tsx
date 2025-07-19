
import React from 'react';
import { Card } from '@/components/ui/card';

const Budgets: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">الميزانيات</h1>
      <Card className="p-6"><p>إدارة الميزانيات التقديرية</p></Card>
    </div>
  );
};

export default Budgets;
