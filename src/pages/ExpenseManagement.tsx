
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { ModernExpenseManagement } from '@/components/Financial/ModernExpenseManagement';

export default function ExpenseManagement() {
  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <ModernExpenseManagement />
      </div>
    </Layout>
  );
}
