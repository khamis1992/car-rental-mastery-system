
import React from 'react';
import { Card } from '@/components/ui/card';

const BankTransactions: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">المعاملات البنكية</h1>
      <Card className="p-6"><p>إدارة المعاملات البنكية</p></Card>
    </div>
  );
};

export default BankTransactions;
