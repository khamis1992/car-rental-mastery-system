
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { FinancialNavigationHub } from '@/components/Financial/FinancialNavigationHub';

const FinancialHub = () => {
  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <FinancialNavigationHub />
      </div>
    </Layout>
  );
};

export default FinancialHub;
