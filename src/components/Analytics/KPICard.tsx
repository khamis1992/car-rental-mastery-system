import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon, trend }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <Card className="card-elegant hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between rtl-flex">
          <div className="text-right">
            <p className="text-sm text-muted-foreground rtl-title mb-1">{title}</p>
            <p className="text-2xl font-bold rtl-title mb-2">{value}</p>
            <div className="flex items-center gap-1 rtl-flex">
              {getTrendIcon()}
              <span className={`text-sm ${getTrendColor()}`}>{change}</span>
            </div>
          </div>
          <div className="text-3xl opacity-80">
            {typeof icon === 'string' ? icon : icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};