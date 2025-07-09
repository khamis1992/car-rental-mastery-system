import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface PerformanceData {
  id: string;
  kpi_name_ar: string;
  current_value: number;
  target_value?: number;
  category: string;
  calculation_period: string;
  alert_threshold_high?: number;
  alert_threshold_low?: number;
}

interface PerformanceTableProps {
  data: PerformanceData[];
}

export const PerformanceTable: React.FC<PerformanceTableProps> = ({ data }) => {
  const getPerformanceStatus = (current: number, target?: number, highThreshold?: number, lowThreshold?: number) => {
    if (highThreshold && current > highThreshold) {
      return { status: 'تحذير عالي', variant: 'destructive' as const };
    }
    if (lowThreshold && current < lowThreshold) {
      return { status: 'تحذير منخفض', variant: 'destructive' as const };
    }
    if (target) {
      const variance = Math.abs(current - target) / target * 100;
      if (variance <= 5) {
        return { status: 'ممتاز', variant: 'default' as const };
      } else if (current > target) {
        return { status: 'فوق الهدف', variant: 'secondary' as const };
      } else {
        return { status: 'دون الهدف', variant: 'outline' as const };
      }
    }
    return { status: 'جيد', variant: 'default' as const };
  };

  const formatValue = (value: number, period: string) => {
    if (period === 'percentage') return `${value.toFixed(2)}%`;
    if (period === 'currency') return `${value.toLocaleString()} د.ك`;
    return value.toLocaleString();
  };

  return (
    <Card className="card-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 rtl-flex">
          <TrendingUp className="w-5 h-5" />
          أفضل المؤشرات أداءً
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المؤشر</TableHead>
                  <TableHead className="text-right">القيمة الحالية</TableHead>
                  <TableHead className="text-right">الهدف</TableHead>
                  <TableHead className="text-right">الفئة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.slice(0, 10).map((item) => {
                  const performance = getPerformanceStatus(
                    item.current_value || 0,
                    item.target_value,
                    item.alert_threshold_high,
                    item.alert_threshold_low
                  );

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-right">
                        {item.kpi_name_ar}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatValue(item.current_value || 0, item.calculation_period)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.target_value 
                          ? formatValue(item.target_value, item.calculation_period)
                          : 'غير محدد'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={performance.variant}>
                          {performance.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            لا توجد بيانات أداء متاحة
          </div>
        )}
      </CardContent>
    </Card>
  );
};