
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PieChart, AlertCircle } from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';

interface FinancialData {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashFlow: number;
  accountsReceivable: number;
  accountsPayable: number;
  revenueGrowth: number;
  expenseGrowth: number;
}

interface FinancialHighlightsProps {
  data: FinancialData;
  loading?: boolean;
}

export const FinancialHighlights: React.FC<FinancialHighlightsProps> = ({ 
  data, 
  loading = false 
}) => {
  const highlights = [
    {
      title: "إجمالي الإيرادات",
      value: data.totalRevenue,
      change: data.revenueGrowth,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: data.revenueGrowth > 0 ? "up" : "down"
    },
    {
      title: "إجمالي المصروفات", 
      value: data.totalExpenses,
      change: data.expenseGrowth,
      icon: PieChart,
      color: "text-red-600",
      bgColor: "bg-red-50",
      trend: data.expenseGrowth > 0 ? "down" : "up" // Higher expenses = bad trend
    },
    {
      title: "صافي الربح",
      value: data.netIncome,
      change: ((data.totalRevenue - data.totalExpenses) / data.totalRevenue) * 100,
      icon: TrendingUp,
      color: data.netIncome > 0 ? "text-green-600" : "text-red-600",
      bgColor: data.netIncome > 0 ? "bg-green-50" : "bg-red-50",
      trend: data.netIncome > 0 ? "up" : "down"
    },
    {
      title: "التدفق النقدي",
      value: data.cashFlow,
      change: 0, // We'll calculate this when we have historical data
      icon: AlertCircle,
      color: data.cashFlow > 0 ? "text-blue-600" : "text-orange-600",
      bgColor: data.cashFlow > 0 ? "bg-blue-50" : "bg-orange-50",
      trend: data.cashFlow > 0 ? "up" : "down"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {highlights.map((item, index) => {
        const IconComponent = item.icon;
        const TrendIcon = item.trend === "up" ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-200 border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${item.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <TrendIcon className={`w-4 h-4 ${item.trend === "up" ? "text-green-500" : "text-red-500"}`} />
                  <span className={item.trend === "up" ? "text-green-500" : "text-red-500"}>
                    {Math.abs(item.change).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {item.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrencyKWD(item.value)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
