
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RealtimeIndicator } from "./RealtimeIndicator";
import { cn } from "@/lib/utils";

interface BudgetOverrunAlertsProps {
  isUpdating?: boolean;
  isConnected?: boolean;
  lastUpdated?: Date | null;
}

export const BudgetOverrunAlerts: React.FC<BudgetOverrunAlertsProps> = ({
  isUpdating = false,
  isConnected = true,
  lastUpdated = null
}) => {
  const navigate = useNavigate();
  
  // بيانات تجريبية - يجب استبدالها بالبيانات الفعلية
  const alerts = [
    {
      id: 1,
      type: 'صيانة',
      item: 'تويوتا كامري - KWT 3729',
      budget: 120,
      actual: 175,
      date: '2023-12-15'
    },
    {
      id: 2,
      type: 'تأمين',
      item: 'هوندا اكورد - KWT 5372',
      budget: 350,
      actual: 385,
      date: '2023-12-10'
    },
    {
      id: 3,
      type: 'قطع غيار',
      item: 'نيسان التيما - KWT 7891',
      budget: 200,
      actual: 245,
      date: '2023-12-05'
    }
  ];
  
  return (
    <Card className={cn("card-elegant", isUpdating && "animate-pulse")}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground rtl-title flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          تنبيهات تجاوز الميزانية
          {isConnected && (
            <RealtimeIndicator 
              isConnected={isConnected}
              isUpdating={isUpdating}
              lastUpdated={lastUpdated}
              size="sm"
            />
          )}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/financial-reports')}
          className="hover:scale-105 transition-transform"
        >
          التقارير المالية
        </Button>
      </CardHeader>
      <CardContent>
        {isUpdating ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
            جاري تحميل التنبيهات...
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد تنبيهات حالية لتجاوز الميزانية
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border border-warning/30 bg-warning/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <div className="font-medium">{alert.type}</div>
                    <div className="text-sm text-muted-foreground">
                      {alert.item}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-destructive">
                    {alert.actual} د.ك
                    <span className="text-xs text-muted-foreground mr-1">
                      (تجاوز {Math.round((alert.actual - alert.budget) / alert.budget * 100)}%)
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    الميزانية: {alert.budget} د.ك
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
