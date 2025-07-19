import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, BarChart3, TrendingUp, CheckCircle } from 'lucide-react';
import { MonthlyReport } from './MonthlyReport';
import { BalanceAnalysisReport } from './BalanceAnalysisReport';
import { PerformanceReport } from './PerformanceReport';
import { AuditReport } from './AuditReport';

export const ReportsContainer: React.FC = () => {
  const [activeReport, setActiveReport] = useState('monthly');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            التقارير والتحليلات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeReport} onValueChange={setActiveReport} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="monthly" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                تقرير شهري
              </TabsTrigger>
              <TabsTrigger value="balance" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                تحليل الأرصدة
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                تقرير الأداء
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                تقرير المراجعة
              </TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="mt-6">
              <MonthlyReport />
            </TabsContent>

            <TabsContent value="balance" className="mt-6">
              <BalanceAnalysisReport />
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <PerformanceReport />
            </TabsContent>

            <TabsContent value="audit" className="mt-6">
              <AuditReport />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};