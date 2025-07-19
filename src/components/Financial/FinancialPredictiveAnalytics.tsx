import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  AlertCircle, 
  BarChart3,
  Calendar,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PredictionData {
  period: string;
  actual?: number;
  predicted: number;
  confidence: number;
}

interface Forecast {
  id: string;
  title: string;
  type: 'revenue' | 'expense' | 'profit' | 'cashflow';
  currentValue: number;
  predictedValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  timeframe: string;
  data: PredictionData[];
}

interface FinancialPredictiveAnalyticsProps {
  className?: string;
}

export const FinancialPredictiveAnalytics: React.FC<FinancialPredictiveAnalyticsProps> = ({ 
  className = '' 
}) => {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [selectedForecast, setSelectedForecast] = useState<string>('1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // محاكاة جلب التوقعات
    const mockForecasts: Forecast[] = [
      {
        id: '1',
        title: 'توقع الإيرادات',
        type: 'revenue',
        currentValue: 150000,
        predictedValue: 165000,
        trend: 'increasing',
        confidence: 85,
        timeframe: '3 أشهر قادمة',
        data: [
          { period: 'الشهر 1', actual: 150000, predicted: 152000, confidence: 90 },
          { period: 'الشهر 2', predicted: 158000, confidence: 87 },
          { period: 'الشهر 3', predicted: 165000, confidence: 85 },
          { period: 'الشهر 4', predicted: 170000, confidence: 82 }
        ]
      },
      {
        id: '2',
        title: 'توقع المصروفات',
        type: 'expense',
        currentValue: 120000,
        predictedValue: 125000,
        trend: 'increasing',
        confidence: 78,
        timeframe: '3 أشهر قادمة',
        data: [
          { period: 'الشهر 1', actual: 120000, predicted: 121000, confidence: 85 },
          { period: 'الشهر 2', predicted: 123000, confidence: 80 },
          { period: 'الشهر 3', predicted: 125000, confidence: 78 },
          { period: 'الشهر 4', predicted: 127000, confidence: 75 }
        ]
      },
      {
        id: '3',
        title: 'توقع التدفق النقدي',
        type: 'cashflow',
        currentValue: 30000,
        predictedValue: 40000,
        trend: 'increasing',
        confidence: 92,
        timeframe: '3 أشهر قادمة',
        data: [
          { period: 'الشهر 1', actual: 30000, predicted: 31000, confidence: 95 },
          { period: 'الشهر 2', predicted: 35000, confidence: 93 },
          { period: 'الشهر 3', predicted: 40000, confidence: 92 },
          { period: 'الشهر 4', predicted: 43000, confidence: 88 }
        ]
      },
      {
        id: '4',
        title: 'توقع الأرباح',
        type: 'profit',
        currentValue: 30000,
        predictedValue: 40000,
        trend: 'increasing',
        confidence: 80,
        timeframe: '3 أشهر قادمة',
        data: [
          { period: 'الشهر 1', actual: 30000, predicted: 31000, confidence: 85 },
          { period: 'الشهر 2', predicted: 35000, confidence: 82 },
          { period: 'الشهر 3', predicted: 40000, confidence: 80 },
          { period: 'الشهر 4', predicted: 43000, confidence: 78 }
        ]
      }
    ];

    setTimeout(() => {
      setForecasts(mockForecasts);
      setLoading(false);
    }, 1500);
  }, []);

  const selectedForecastData = forecasts.find(f => f.id === selectedForecast);

  const getTrendIcon = (trend: Forecast['trend']) => {
    switch (trend) {
      case 'increasing': return ArrowUpRight;
      case 'decreasing': return ArrowDownRight;
      default: return Target;
    }
  };

  const getTrendColor = (trend: Forecast['trend']) => {
    switch (trend) {
      case 'increasing': return 'text-green-500';
      case 'decreasing': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-KW', { 
      style: 'currency', 
      currency: 'KWD',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            التحليل التنبؤي
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
            <span>جاري تحليل الاتجاهات...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="rtl-title flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          التحليل التنبؤي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* قائمة التوقعات */}
        <div className="grid grid-cols-2 gap-3">
          {forecasts.map((forecast) => {
            const TrendIcon = getTrendIcon(forecast.trend);
            const trendColor = getTrendColor(forecast.trend);
            const changePercent = ((forecast.predictedValue - forecast.currentValue) / forecast.currentValue * 100);
            
            return (
              <div
                key={forecast.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedForecast === forecast.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedForecast(forecast.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{forecast.title}</span>
                    <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold">{formatCurrency(forecast.predictedValue)}</p>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={changePercent > 0 ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ثقة {forecast.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* الرسم البياني للتوقع المحدد */}
        {selectedForecastData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{selectedForecastData.title}</h4>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {selectedForecastData.timeframe}
                </span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedForecastData.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `${(value / 1000)}ك`} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'actual' ? 'فعلي' : 'متوقع'
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 6 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* تفاصيل التوقع */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">القيمة الحالية</p>
                  <p className="font-bold">{formatCurrency(selectedForecastData.currentValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">القيمة المتوقعة</p>
                  <p className="font-bold">{formatCurrency(selectedForecastData.predictedValue)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مستوى الثقة</p>
                  <p className="font-bold">{selectedForecastData.confidence}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Button variant="outline" className="gap-2">
            <Target className="w-4 h-4" />
            عرض تقرير التوقعات الكامل
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};