
import React from 'react';
import { Card } from '@/components/ui/card';

const ContractIncidents: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">حوادث العقود</h1>
      <Card className="p-6"><p>تسجيل وإدارة الحوادث والمشاكل</p></Card>
    </div>
  );
};

export default ContractIncidents;
