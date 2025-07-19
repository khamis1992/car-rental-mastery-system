import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Invoices = () => {
  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">الفواتير</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>إدارة الفواتير</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">سيتم تطوير هذه الصفحة قريباً...</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Invoices;