
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RealtimeIndicatorProps {
  isConnected: boolean;
  isUpdating: boolean;
  lastUpdated: Date | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({
  isConnected,
  isUpdating,
  lastUpdated,
  className,
  size = 'sm'
}) => {
  // Format time since last update
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return 'لم يتم التحديث بعد';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `منذ ${diffSec} ثانية`;
    if (diffSec < 3600) return `منذ ${Math.floor(diffSec / 60)} دقيقة`;
    if (diffSec < 86400) return `منذ ${Math.floor(diffSec / 3600)} ساعة`;
    return `منذ ${Math.floor(diffSec / 86400)} يوم`;
  };

  // Get icon and style based on status
  const getIndicator = () => {
    if (isUpdating) {
      return {
        icon: <Loader2 className={cn("animate-spin", size === 'sm' ? "h-3 w-3" : "h-4 w-4")} />,
        text: 'جاري التحديث...',
        style: 'bg-primary/20 text-primary hover:bg-primary/30'
      };
    }
    
    if (!isConnected) {
      return {
        icon: <AlertCircle className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />,
        text: 'غير متصل',
        style: 'bg-destructive/20 text-destructive hover:bg-destructive/30'
      };
    }
    
    const indicator = {
      icon: <CheckCircle2 className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />,
      text: getTimeSinceUpdate(),
      style: 'bg-success/20 text-success hover:bg-success/30'
    };
    
    // If data is stale (more than 5 minutes old)
    if (lastUpdated && (new Date().getTime() - lastUpdated.getTime()) > 5 * 60 * 1000) {
      indicator.style = 'bg-warning/20 text-warning hover:bg-warning/30';
    }
    
    return indicator;
  };

  const indicator = getIndicator();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-1 cursor-pointer transition-all", 
              indicator.style,
              className
            )}
            onClick={() => isConnected && window.location.reload()}
          >
            {indicator.icon}
            {size !== 'sm' && <span>{indicator.text}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent dir="rtl">
          <div className="text-center">
            <p className="font-semibold mb-1">
              {isConnected ? 'متصل بالتحديثات المباشرة' : 'غير متصل بالتحديثات المباشرة'}
            </p>
            <p className="text-xs">
              {isUpdating 
                ? 'جاري تحديث البيانات...' 
                : lastUpdated 
                  ? `آخر تحديث: ${getTimeSinceUpdate()}` 
                  : 'لم يتم التحديث بعد'}
            </p>
            {isConnected && (
              <div className="flex items-center justify-center gap-1 mt-1 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3" />
                <span>انقر للتحديث اليدوي</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
