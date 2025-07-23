
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Activity, 
  Clock, 
  Users, 
  Database,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useUnifiedRealtime } from '@/hooks/useUnifiedRealtime';
import { cn } from "@/lib/utils";

export const UnifiedRealtimeStatus = () => {
  const {
    isConnected,
    connectionStatus,
    health,
    lastEvent,
    eventHistory,
    subscriptions,
    reconnect,
    stats
  } = useUnifiedRealtime();

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-5 w-5 text-green-500" />;
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <WifiOff className="h-5 w-5 text-red-500" />;
      default:
        return <WifiOff className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'متصل';
      case 'connecting':
        return 'جاري الاتصال...';
      case 'reconnecting':
        return 'جاري إعادة الاتصال...';
      case 'error':
        return 'خطأ في الاتصال';
      default:
        return 'غير متصل';
    }
  };

  const getStatusBadgeVariant = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'default';
      case 'connecting':
      case 'reconnecting':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ar-KW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getEventTypeLabel = (table: string, event: string) => {
    const tableLabels: { [key: string]: string } = {
      'contracts': 'العقود',
      'vehicles': 'المركبات',
      'customers': 'العملاء',
      'invoices': 'الفواتير',
      'payments': 'المدفوعات',
      'employees': 'الموظفين',
      'daily_tasks': 'المهام اليومية',
      'attendance': 'الحضور'
    };
    
    const eventLabels: { [key: string]: string } = {
      'INSERT': 'إضافة',
      'UPDATE': 'تحديث',
      'DELETE': 'حذف'
    };
    
    return `${eventLabels[event] || event} ${tableLabels[table] || table}`;
  };

  return (
    <Card className="rtl-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="rtl-title flex items-center gap-2">
            {getStatusIcon()}
            نظام التحديث المباشر الموحد
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant()}>
              {getStatusText()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={reconnect}
              disabled={connectionStatus === 'connecting' || connectionStatus === 'reconnecting'}
              className="rtl-button"
            >
              <RefreshCw className={cn(
                "h-4 w-4 ml-2",
                (connectionStatus === 'connecting' || connectionStatus === 'reconnecting') && "animate-spin"
              )} />
              إعادة اتصال
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">{stats.activeSubscriptions}</p>
              <p className="text-xs text-muted-foreground">اشتراكات نشطة</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Activity className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">{stats.totalEvents}</p>
              <p className="text-xs text-muted-foreground">إجمالي الأحداث</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">
                {health.latency ? `${health.latency}ms` : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">زمن الاستجابة</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Database className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-medium">
                {health.isHealthy ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </p>
              <p className="text-xs text-muted-foreground">حالة النظام</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* معلومات الحالة التفصيلية */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">معلومات الاتصال</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            {health.lastPing && (
              <p>آخر فحص: {formatTime(health.lastPing)}</p>
            )}
            {health.reconnectAttempts > 0 && (
              <p>محاولات إعادة الاتصال: {health.reconnectAttempts}</p>
            )}
            {health.lastError && (
              <p className="text-red-600">آخر خطأ: {health.lastError}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* الأحداث الحديثة */}
        <div>
          <h4 className="text-sm font-medium mb-2">الأحداث الحديثة</h4>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {eventHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  لا توجد أحداث حديثة
                </p>
              ) : (
                eventHistory.slice(0, 5).map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs"
                  >
                    <span>{getEventTypeLabel(event.table, event.event)}</span>
                    <span className="text-muted-foreground">
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* الاشتراكات النشطة */}
        {subscriptions.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">الاشتراكات النشطة</h4>
              <div className="flex flex-wrap gap-1">
                {Array.from(new Set(subscriptions.map(s => s.table))).map(table => (
                  <Badge key={table} variant="outline" className="text-xs">
                    {table}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
