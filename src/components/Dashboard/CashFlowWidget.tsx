
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrencyKWD } from '@/lib/currency';

interface CashFlowData {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  monthlyData: {
    month: string;
    inflow: number;
    outflow: number;
    net: number;
  }[];
}

interface CashFlowWidgetProps {
  data: CashFlowData;
  loading?: boolean;
}

export const CashFlowWidget: React.FC<CashFlowWidgetProps> = ({ 
  data, 
  loading = false 
}) => {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositiveFlow = data.netCashFlow > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="rtl-title flex items-center gap-2">
          <div className={`p-2 rounded-full ${isPositiveFlow ? 'bg-green-50' : 'bg-red-50'}`}>
            {isPositiveFlow ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          التدفق النقدي
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Net Cash Flow */}
          <div className="text-center p-4 rounded-lg bg-gray-50">
            <p className="text-sm text-muted-foreground mb-1">صافي التدفق النقدي</p>
            <p className={`text-2xl font-bold ${isPositiveFlow ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrencyKWD(data.netCashFlow)}
            </p>
          </div>

          {/* Inflow vs Outflow */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg border">
              <div className="flex items-center justify-center gap-1 mb-2">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">التدفق الداخل</span>
              </div>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrencyKWD(data.totalInflow)}
              </p>
            </div>
            
            <div className="text-center p-3 rounded-lg border">
              <div className="flex items-center justify-center gap-1 mb-2">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">التدفق الخارج</span>
              </div>
              <p className="text-lg font-semibold text-red-600">
                {formatCurrencyKWD(data.totalOutflow)}
              </p>
            </div>
          </div>

          {/* Mini Chart Placeholder */}
          <div className="h-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center border-dashed border-2 border-blue-200">
            <p className="text-sm text-muted-foreground">مخطط التدفق النقدي</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
