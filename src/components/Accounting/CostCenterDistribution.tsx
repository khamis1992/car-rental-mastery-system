
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  Calculator, 
  AlertTriangle,
  CheckCircle,
  FileText,
  Target
} from 'lucide-react';
import { CostCenterBudgetAlerts } from './CostCenterBudgetAlerts';

interface CostCenterDistributionProps {
  showOnlyAlerts?: boolean;
  maxItems?: number;
}

export const CostCenterDistribution: React.FC<CostCenterDistributionProps> = ({
  showOnlyAlerts = false,
  maxItems = 10
}) => {
  const [distributionData, setDistributionData] = useState({
    totalAllocated: 0,
    pendingAllocations: 0,
    completedAllocations: 0,
    distributionAccuracy: 95
  });

  const [recentDistributions, setRecentDistributions] = useState([
    {
      id: 1,
      entryNumber: 'JE-2025-001234',
      description: 'توزيع مصاريف الكهرباء',
      totalAmount: 1250.500,
      distributedAmount: 1250.500,
      costCenters: ['مبيعات', 'إدارة', 'صيانة'],
      status: 'completed',
      date: '2025-01-15'
    },
    {
      id: 2,
      entryNumber: 'JE-2025-001235',
      description: 'توزيع إيجار المكتب',
      totalAmount: 2000.000,
      distributedAmount: 1600.000,
      costCenters: ['مبيعات', 'إدارة'],
      status: 'partial',
      date: '2025-01-14'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-primary rtl-title flex items-center gap-2">
              <Target className="w-5 h-5" />
              توزيع القيود على مراكز التكلفة
            </h3>
            <p className="text-muted-foreground mt-2">
              عرض وإدارة توزيع القيود المحاسبية على مراكز التكلفة المختلفة مع تتبع دقة التوزيع
            </p>
          </div>
          <Badge variant="secondary" className="rtl-flex">
            <Calculator className="w-4 h-4" />
            نشط
          </Badge>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الموزع</p>
                <p className="text-2xl font-bold text-green-600">{distributionData.totalAllocated.toFixed(3)} د.ك</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">في الانتظار</p>
                <p className="text-2xl font-bold text-yellow-600">{distributionData.pendingAllocations}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مكتملة</p>
                <p className="text-2xl font-bold text-blue-600">{distributionData.completedAllocations}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">دقة التوزيع</p>
                <p className="text-2xl font-bold text-purple-600">{distributionData.distributionAccuracy}%</p>
                <Progress value={distributionData.distributionAccuracy} className="mt-2" />
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Alerts Section */}
      <CostCenterBudgetAlerts showOnlyUnread={showOnlyAlerts} maxAlerts={5} />

      {/* Recent Distributions */}
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <FileText className="w-5 h-5" />
            التوزيعات الأخيرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentDistributions.slice(0, maxItems).map((distribution) => (
              <div key={distribution.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">{distribution.entryNumber}</span>
                    <Badge variant={distribution.status === 'completed' ? 'default' : 'secondary'}>
                      {distribution.status === 'completed' ? 'مكتمل' : 'جزئي'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{distribution.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>المبلغ الإجمالي: {distribution.totalAmount.toFixed(3)} د.ك</span>
                    <span>الموزع: {distribution.distributedAmount.toFixed(3)} د.ك</span>
                    <span>عدد المراكز: {distribution.costCenters.length}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {((distribution.distributedAmount / distribution.totalAmount) * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">{distribution.date}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {recentDistributions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد توزيعات حديثة</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" className="rtl-flex">
          <PieChart className="w-4 h-4" />
          تقرير التوزيع
        </Button>
        <Button variant="outline" className="rtl-flex">
          <BarChart3 className="w-4 h-4" />
          تحليل الأداء
        </Button>
        <Button className="rtl-flex">
          <Calculator className="w-4 h-4" />
          توزيع جديد
        </Button>
      </div>
    </div>
  );
};
