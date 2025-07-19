
import React from 'react';
import { Card } from '@/components/ui/card';

const CashFlowStatementReport: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">قائمة التدفقات النقدية</h1>
      <Card className="p-6"><p>تقرير التدفقات النقدية</p></Card>
    </div>
  );
};

export default CashFlowStatementReport;
