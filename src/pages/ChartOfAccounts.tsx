
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { ModernChartOfAccounts } from '@/components/Financial/ModernChartOfAccounts';

const ChartOfAccounts = () => {
  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <ModernChartOfAccounts />
      </div>
    </Layout>
  );
};

export default ChartOfAccounts;
