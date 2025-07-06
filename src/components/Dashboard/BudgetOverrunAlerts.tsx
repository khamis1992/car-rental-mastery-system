import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Eye, X } from 'lucide-react';
import { CostCenterService, CostCenter } from '@/services/BusinessServices/CostCenterService';
import { formatCurrencyKWD } from '@/lib/currency';
import { toast } from 'sonner';

export const BudgetOverrunAlerts: React.FC = () => {
  const [overrunCostCenters, setOverrunCostCenters] = useState<CostCenter[]>([]);
  const [warningCostCenters, setWarningCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const costCenterService = new CostCenterService();

  useEffect(() => {
    loadBudgetAlerts();
    // تحديث كل 5 دقائق
    const interval = setInterval(loadBudgetAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadBudgetAlerts = async () => {
    try {
      const costCenters = await costCenterService.getAllCostCenters();
      
      const overruns = costCenters.filter(cc => 
        cc.actual_spent > cc.budget_amount && cc.budget_amount > 0
      );
      
      const warnings = costCenters.filter(cc => {
        const utilization = cc.budget_amount > 0 ? (cc.actual_spent / cc.budget_amount) * 100 : 0;
        return utilization >= 80 && utilization <= 100;
      });

      setOverrunCostCenters(overruns);
      setWarningCostCenters(warnings);
    } catch (error) {
      console.error('Error loading budget alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (costCenterId: string) => {
    setDismissed(prev => new Set([...prev, costCenterId]));
    toast.success('تم إخفاء التنبيه');
  };

  const viewCostCenter = (costCenterId: string) => {
    // Navigate to cost center details
    window.location.href = `/cost-centers?view=${costCenterId}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            تنبيهات الميزانية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">جاري التحميل...</div>
        </CardContent>
      </Card>
    );
  }

  const visibleOverruns = overrunCostCenters.filter(cc => !dismissed.has(cc.id));
  const visibleWarnings = warningCostCenters.filter(cc => !dismissed.has(cc.id));

  if (visibleOverruns.length === 0 && visibleWarnings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-green-500" />
            تنبيهات الميزانية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            لا توجد تنبيهات حالياً - جميع مراكز التكلفة ضمن الميزانية
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          تنبيهات الميزانية
          <Badge variant="destructive" className="ml-2">
            {visibleOverruns.length + visibleWarnings.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* تجاوزات الميزانية */}
        {visibleOverruns.map((costCenter) => {
          const overrun = costCenter.actual_spent - costCenter.budget_amount;
          const overrunPercentage = ((overrun / costCenter.budget_amount) * 100);
          
          return (
            <Alert key={costCenter.id} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">
                      {costCenter.cost_center_name}
                    </div>
                    <div className="text-sm mt-1">
                      تجاوز الميزانية بمبلغ {formatCurrencyKWD(overrun)} 
                      ({overrunPercentage.toFixed(1)}%)
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      الميزانية: {formatCurrencyKWD(costCenter.budget_amount)} | 
                      المصروف: {formatCurrencyKWD(costCenter.actual_spent)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => viewCostCenter(costCenter.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissAlert(costCenter.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          );
        })}

        {/* تحذيرات اقتراب النفاد */}
        {visibleWarnings.map((costCenter) => {
          const utilization = (costCenter.actual_spent / costCenter.budget_amount) * 100;
          const remaining = costCenter.budget_amount - costCenter.actual_spent;
          
          return (
            <Alert key={costCenter.id}>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">
                      {costCenter.cost_center_name}
                    </div>
                    <div className="text-sm mt-1">
                      اقتراب من نفاد الميزانية - استخدام {utilization.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      المتبقي: {formatCurrencyKWD(remaining)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => viewCostCenter(costCenter.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissAlert(costCenter.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
};