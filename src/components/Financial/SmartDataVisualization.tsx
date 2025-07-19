import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  LineChart,
  DollarSign,
  Percent,
  Calendar,
  Filter,
  Download,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  comparison?: number;
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface VisualizationProps {
  title: string;
  description?: string;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
  currency?: boolean;
}

export const SmartDataVisualization: React.FC<VisualizationProps> = ({
  title,
  description,
  timeframe,
  currency = true
}) => {
  const [activeChart, setActiveChart] = useState<'line' | 'bar' | 'pie' | 'area'>('line');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data - replace with real data from your API
  const mockLineData: ChartData[] = [
    { name: 'يناير', value: 45000, comparison: 42000, trend: 'up' },
    { name: 'فبراير', value: 52000, comparison: 48000, trend: 'up' },
    { name: 'مارس', value: 48000, comparison: 51000, trend: 'down' },
    { name: 'أبريل', value: 61000, comparison: 55000, trend: 'up' },
    { name: 'مايو', value: 58000, comparison: 59000, trend: 'down' },
    { name: 'يونيو', value: 67000, comparison: 62000, trend: 'up' },
  ];

  const mockPieData: ChartData[] = [
    { name: 'الإيرادات التشغيلية', value: 45, percentage: 45 },
    { name: 'الإيرادات الأخرى', value: 25, percentage: 25 },
    { name: 'الاستثمارات', value: 20, percentage: 20 },
    { name: 'الإيرادات الاستثنائية', value: 10, percentage: 10 },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const formatValue = (value: number) => {
    if (currency) {
      return `${value.toLocaleString()} د.ك`;
    }
    return value.toLocaleString();
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const refreshData = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const exportChart = () => {
    // Implementation for exporting chart
    console.log('Exporting chart...');
  };

  const renderChart = () => {
    const commonProps = {
      width: '100%',
      height: isFullscreen ? 600 : 400,
    };

    switch (activeChart) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsLineChart data={mockLineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `${value / 1000}ك`} />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), 'القيمة']}
                labelStyle={{ color: '#666' }}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="comparison" 
                stroke="#10B981" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#10B981', strokeWidth: 1, r: 4 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsBarChart data={mockLineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `${value / 1000}ك`} />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), 'القيمة']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer {...commonProps}>
            <AreaChart data={mockLineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `${value / 1000}ك`} />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), 'القيمة']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer {...commonProps}>
            <RechartsPieChart>
              <Pie 
                data={mockPieData} 
                cx="50%" 
                cy="50%" 
                outerRadius={120}
                dataKey="value"
                label={({ percentage }) => `${percentage}%`}
              >
                {mockPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value}%`, 'النسبة']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`border-0 shadow-lg transition-all duration-300 ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="rtl-title flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={exportChart}>
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Chart Type Selector */}
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-muted-foreground ml-2">نوع الرسم:</span>
          <div className="flex gap-1">
            <Button
              variant={activeChart === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveChart('line')}
            >
              <LineChart className="w-4 h-4" />
            </Button>
            <Button
              variant={activeChart === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveChart('bar')}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button
              variant={activeChart === 'area' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveChart('area')}
            >
              <TrendingUp className="w-4 h-4" />
            </Button>
            <Button
              variant={activeChart === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveChart('pie')}
            >
              <PieChart className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1 mr-4">
            <Badge variant="secondary" className="text-xs">
              <Calendar className="w-3 h-3 ml-1" />
              {timeframe === 'monthly' ? 'شهري' : timeframe === 'weekly' ? 'أسبوعي' : timeframe === 'yearly' ? 'سنوي' : 'يومي'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">إجمالي</p>
              <p className="text-lg font-bold">{formatValue(mockLineData.reduce((sum, item) => sum + item.value, 0))}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">المتوسط</p>
              <p className="text-lg font-bold">{formatValue(Math.round(mockLineData.reduce((sum, item) => sum + item.value, 0) / mockLineData.length))}</p>
            </div>
            <div className="text-center flex items-center justify-center gap-1">
              <div>
                <p className="text-sm text-muted-foreground">الاتجاه</p>
                <div className="flex items-center gap-1 justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-lg font-bold text-green-600">+12%</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">أعلى قيمة</p>
              <p className="text-lg font-bold">{formatValue(Math.max(...mockLineData.map(item => item.value)))}</p>
            </div>
          </div>
          
          {/* Chart Area */}
          <div className="mt-6">
            {renderChart()}
          </div>
          
          {/* Legend for line/bar charts */}
          {(activeChart === 'line' || activeChart === 'bar' || activeChart === 'area') && (
            <div className="flex items-center justify-center gap-6 mt-4 p-2 bg-muted/20 rounded">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-xs text-muted-foreground">القيم الحالية</span>
              </div>
              {activeChart === 'line' && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-green-500 border-dashed"></div>
                  <span className="text-xs text-muted-foreground">المقارنة</span>
                </div>
              )}
            </div>
          )}
          
          {/* Pie chart legend */}
          {activeChart === 'pie' && (
            <div className="grid grid-cols-2 gap-2 mt-4 p-4 bg-muted/20 rounded">
              {mockPieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-xs text-muted-foreground">{entry.name}: {entry.percentage}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};