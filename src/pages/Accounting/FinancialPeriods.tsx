
import React from 'react';
import { Card } from '@/components/ui/card';

const FinancialPeriods: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">الفترات المالية</h1>
      <Card className="p-6">
        <p className="text-muted-foreground">إدارة الفترات المالية</p>
      </Card>
    </div>
  );
};

export default FinancialPeriods;
