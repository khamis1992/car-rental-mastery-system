import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  actionText?: string;
  onActionClick?: () => void;
  className?: string;
}

const StatsCard = ({ title, value, subtitle, icon, trend, className = "", actionText, onActionClick }: StatsCardProps) => {
  const getTrendColor = (type: string) => {
    switch (type) {
      case 'up': return 'bg-success text-success-foreground';
      case 'down': return 'bg-danger text-danger-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className={`card-elegant hover:card-highlight transition-all duration-300 ${className}`}>
      <CardHeader className="rtl-header space-y-0 pb-2">
        <div className="text-primary">
          {icon}
        </div>
        <CardTitle className="text-sm font-medium text-muted-foreground text-right">
          {title}
        </CardTitle>
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
        <div className="rtl-header">
          {actionText && onActionClick && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover-scale"
              onClick={onActionClick}
            >
              {actionText}
            </Button>
          )}
          {trend && (
            <Badge 
              variant="secondary" 
              className={`text-xs ${getTrendColor(trend.type)}`}
            >
              {trend.value}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;