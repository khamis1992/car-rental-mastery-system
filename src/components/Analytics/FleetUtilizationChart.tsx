import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FleetData {
  vehicle_type: string;
  total_count: number;
  rented_count: number;
  utilization: number;
}

interface FleetUtilizationChartProps {
  data: FleetData[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
  'hsl(210, 100%, 60%)',
  'hsl(120, 100%, 40%)',
];

export const FleetUtilizationChart: React.FC<FleetUtilizationChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    name: item.vehicle_type,
    value: item.total_count,
    utilization: item.utilization,
    rented: item.rented_count
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-primary">إجمالي المركبات: {data.value}</p>
          <p className="text-secondary">المؤجرة: {data.rented}</p>
          <p className="text-accent">معدل الاستغلال: {data.utilization.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="card-elegant">
      <CardHeader>
        <CardTitle className="rtl-title">توزيع الأسطول حسب النوع</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            لا توجد بيانات أسطول متاحة
          </div>
        )}
      </CardContent>
    </Card>
  );
};