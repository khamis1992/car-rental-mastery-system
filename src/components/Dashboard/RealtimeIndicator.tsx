
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Activity } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';

interface RealtimeIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({
  className,
  size = 'sm',
  showDetails = false
}) => {
  const { isConnected, connectionStatus, health, stats, reconnect } = useUnifiedRealtime();

  // Format time since last update
  const getTimeSinceUpdate = () => {
    if (!health.lastPing) return 'لم يتم الفحص بعد';
    
    const now = new Date();
    const diffMs = now.getTime() - health.lastPing.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return `منذ ${diffSec} ثانية`;
    if (diffSec < 3600) return `منذ ${Math.floor(diffSec / 60)} دقيقة`;
    if (diffSec < 86400) return `منذ ${Math.floor(diffSec / 3600)} ساعة`;
    return `منذ ${Math.floor(diffSec / 86400)} يوم`;
  };

  // Get icon and style based on status
  const getIndicator = () => {
    switch (connectionStatus) {
      case 'connecting':
      case 'reconnecting':
        return {
          icon: <Loader2 className={cn("animate-spin", size === 'sm' ? "h-3 w-3" : "h-4 w-4")} />,
          text: connectionStatus === 'connecting' ? 'جاري الاتصال...' : 'جاري إعادة الاتصال...',
          style: 'bg-primary/20 text-primary hover:bg-primary/30'
        };
      
      case 'error':
        return {
          icon: <AlertCircle className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />,
          text: 'خطأ في الاتصال',
          style: 'bg-destructive/20 text-destructive hover:bg-destructive/30'
        };
      
      case 'connected':
        const isHealthy = health.isHealthy && stats.isHealthy;
        return {
          icon: isHealthy 
            ? <CheckCircle2 className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />
            : <Activity className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />,
          text: isHealthy ? getTimeSinceUpdate() : 'متصل - مشاكل في الأداء',
          style: isHealthy 
            ? 'bg-success/20 text-success hover:bg-success/30'
            : 'bg-warning/20 text-warning hover:bg-warning/30'
        };
      
      default:
        return {
          icon: <AlertCircle className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />,
          text: 'غير متصل',
          style: 'bg-muted/20 text-muted-foreground hover:bg-muted/30'
        };
    }
  };

  const indicator = getIndicator();

  const TooltipContent_Custom = () => (
    <div className="text-center max-w-xs">
      <p className="font-semibold mb-1">
        نظام التحديث المباشر الموحد
      </p>
      <p className="text-xs mb-2">
        الحالة: {indicator.text}
      </p>
      
      {showDetails && (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>الاشتراكات النشطة:</span>
            <span>{stats.activeSubscriptions}</span>
          </div>
          <div className="flex justify-between">
            <span>إجمالي الأحداث:</span>
            <span>{stats.totalEvents}</span>
          </div>
          {health.latency && (
            <div className="flex justify-between">
              <span>زمن الاستجابة:</span>
              <span>{health.latency}ms</span>
            </div>
          )}
          {health.reconnectAttempts > 0 && (
            <div className="flex justify-between text-warning">
              <span>محاولات الاتصال:</span>
              <span>{health.reconnectAttempts}</span>
            </div>
          )}
        </div>
      )}
      
      {isConnected && (
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          <span>انقر للتحديث اليدوي</span>
        </div>
      )}
    </div>
  );

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
            onClick={() => isConnected && reconnect()}
          >
            {indicator.icon}
            
            {showDetails && stats.activeSubscriptions > 0 && (
              <span className="ml-1 text-xs">({stats.activeSubscriptions})</span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent dir="rtl">
          <TooltipContent_Custom />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
