import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface CustomerSegment {
  type: string;
  count: number;
}

interface CustomerData {
  segments: CustomerSegment[];
  totalCustomers: number;
  averageRating: number;
}

interface CustomerSegmentChartProps {
  data: CustomerData;
}

export const CustomerSegmentChart: React.FC<CustomerSegmentChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const percentage = ((payload[0].value / data.totalCustomers) * 100).toFixed(1);
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary">العدد: {payload[0].value}</p>
          <p className="text-muted-foreground">النسبة: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-flex">
            <Users className="w-5 h-5" />
            شرائح العملاء
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.segments.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.segments} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  type="category" 
                  dataKey="type"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              لا توجد بيانات شرائح عملاء متاحة
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="rtl-title">إحصائيات العملاء</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {data.totalCustomers}
              </div>
              <p className="text-muted-foreground">إجمالي العملاء</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">
                {data.averageRating.toFixed(1)} ⭐
              </div>
              <p className="text-muted-foreground">متوسط التقييم</p>
            </div>

            <div className="space-y-3">
              {data.segments.map((segment, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">{segment.type}</span>
                  <div className="text-left">
                    <span className="font-bold">{segment.count}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({((segment.count / data.totalCustomers) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};