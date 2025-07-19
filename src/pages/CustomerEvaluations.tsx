
import React from 'react';
import { Card } from '@/components/ui/card';

const CustomerEvaluations: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">تقييمات العملاء</h1>
      <Card className="p-6"><p>إدارة تقييمات ومراجعات العملاء</p></Card>
    </div>
  );
};

export default CustomerEvaluations;
