import React from 'react';
import { CustomerTestPanel } from '@/components/CustomerTestPanel';

const CustomerTestPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-right mb-2">اختبار نظام العملاء</h1>
        <p className="text-muted-foreground text-right">
          صفحة اختبار شاملة للتحقق من عمل جميع وظائف إدارة العملاء
        </p>
      </div>
      <CustomerTestPanel />
    </div>
  );
};

export default CustomerTestPage;