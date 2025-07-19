
import React from 'react';
import { Card } from '@/components/ui/card';

const AssetCategories: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">فئات الأصول</h1>
      <Card className="p-6"><p>إدارة فئات الأصول</p></Card>
    </div>
  );
};

export default AssetCategories;
