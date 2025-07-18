
import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';

// Lazy load the chart component
const FinancialChart = lazy(() => import('@/components/Charts/FinancialChart'));

interface LazyFinancialChartProps {
  title: string;
  data: any[];
  type: 'bar' | 'line' | 'pie' | 'area';
  height?: number;
}

const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
    <Skeleton className={`w-full h-[${height}px]`} />
    <div className="flex justify-center space-x-4 rtl:space-x-reverse">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

export const LazyFinancialChart: React.FC<LazyFinancialChartProps> = ({
  title,
  data,
  type,
  height = 300
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ChartSkeleton height={height} />}>
          <FinancialChart
            data={data}
            type={type}
            height={height}
          />
        </Suspense>
      </CardContent>
    </Card>
  );
};

export default LazyFinancialChart;
