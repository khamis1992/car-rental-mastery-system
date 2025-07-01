import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

const StatsCard = ({ title, value, subtitle, icon, trend, className = "" }: StatsCardProps) => {
  const getTrendColor = (type: string) => {
    switch (type) {
      case 'up': return 'bg-success text-success-foreground';
      case 'down': return 'bg-danger text-danger-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className={`card-elegant hover:card-highlight transition-all duration-300 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mb-2">
            {subtitle}
          </p>
        )}
        {trend && (
          <Badge 
            variant="secondary" 
            className={`text-xs ${getTrendColor(trend.type)}`}
          >
            {trend.value}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;