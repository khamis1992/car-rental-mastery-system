
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const JournalEntries: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">القيود اليومية</h1>
        <p className="text-muted-foreground">
          إدارة وتسجيل القيود المحاسبية اليومية
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>سجل القيود</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            لا توجد قيود محاسبية مسجلة حالياً
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalEntries;
