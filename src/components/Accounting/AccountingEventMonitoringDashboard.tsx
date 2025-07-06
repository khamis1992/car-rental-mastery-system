import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Zap,
  Database,
  Webhook
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrencyKWD } from '@/lib/currency';

interface EventMonitorData {
  id: string;
  event_type: string;
  entity_id: string;
  status: string; // Changed from union type to string for flexibility
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_duration_ms?: number;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  totalEvents: number;
  completedEvents: number;
  failedEvents: number;
  averageProcessingTime: number;
  successRate: number;
}

export const AccountingEventMonitoringDashboard: React.FC = () => {
  const [events, setEvents] = useState<EventMonitorData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    completedEvents: 0,
    failedEvents: 0,
    averageProcessingTime: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('24h');

  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      
      // Calculate time range
      const timeRanges = {
        '1h': new Date(Date.now() - 60 * 60 * 1000),
        '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      };
      
      const startTime = timeRanges[selectedTimeRange].toISOString();

      // Load event monitor data
      const { data: eventData, error: eventError } = await supabase
        .from('accounting_event_monitor')
        .select('*')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventError) throw eventError;

      setEvents(eventData || []);

      // Calculate stats
      const totalEvents = eventData?.length || 0;
      const completedEvents = eventData?.filter(e => e.status === 'completed').length || 0;
      const failedEvents = eventData?.filter(e => e.status === 'failed').length || 0;
      
      const completedEventsWithDuration = eventData?.filter(e => 
        e.status === 'completed' && e.processing_duration_ms
      ) || [];
      
      const averageProcessingTime = completedEventsWithDuration.length > 0
        ? completedEventsWithDuration.reduce((sum, e) => sum + (e.processing_duration_ms || 0), 0) / completedEventsWithDuration.length
        : 0;

      const successRate = totalEvents > 0 ? (completedEvents / totalEvents) * 100 : 0;

      setStats({
        totalEvents,
        completedEvents,
        failedEvents,
        averageProcessingTime,
        successRate
      });

    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryFailedEvent = async (eventId: string) => {
    try {
      // Simply reset the status to pending and increment retry count
      const { data: currentEvent, error: fetchError } = await supabase
        .from('accounting_event_monitor')
        .select('retry_count')
        .eq('id', eventId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('accounting_event_monitor')
        .update({ 
          status: 'pending',
          retry_count: (currentEvent?.retry_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) throw error;
      
      await loadMonitoringData();
    } catch (error) {
      console.error('Error retrying event:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Activity className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      processing: 'secondary',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status === 'completed' ? 'مكتمل' :
         status === 'failed' ? 'فشل' :
         status === 'processing' ? 'قيد المعالجة' : 'في الانتظار'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">جاري تحميل بيانات المراقبة...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold rtl-title">مراقبة الأحداث المحاسبية</h2>
        <div className="flex gap-2">
          {(['1h', '24h', '7d'] as const).map((range) => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range === '1h' ? 'ساعة واحدة' : 
               range === '24h' ? '24 ساعة' : '7 أيام'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Database className="w-5 h-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <div className="text-sm text-muted-foreground">إجمالي الأحداث</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.completedEvents}</div>
                <div className="text-sm text-muted-foreground">مكتملة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.failedEvents}</div>
                <div className="text-sm text-muted-foreground">فاشلة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{Math.round(stats.averageProcessingTime)}ms</div>
                <div className="text-sm text-muted-foreground">متوسط المعالجة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">معدل النجاح</div>
                <Progress value={stats.successRate} className="h-1 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-flex">
            <Activity className="w-5 h-5" />
            الأحداث الأخيرة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="rtl-title">نوع الحدث</TableHead>
                <TableHead className="rtl-title">معرف الكيان</TableHead>
                <TableHead className="rtl-title">الحالة</TableHead>
                <TableHead className="rtl-title">وقت المعالجة</TableHead>
                <TableHead className="rtl-title">المحاولات</TableHead>
                <TableHead className="rtl-title">التاريخ</TableHead>
                <TableHead className="rtl-title">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(event.status)}
                      <span className="font-medium">
                        {event.event_type === 'contract_accounting' ? 'محاسبة عقد' :
                         event.event_type === 'payment_accounting' ? 'محاسبة دفعة' :
                         event.event_type === 'invoice_accounting' ? 'محاسبة فاتورة' :
                         event.event_type === 'violation_accounting' ? 'محاسبة مخالفة' :
                         event.event_type}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {event.entity_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(event.status)}
                  </TableCell>
                  <TableCell>
                    {event.processing_duration_ms ? (
                      <span className="text-sm font-medium">
                        {event.processing_duration_ms}ms
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.retry_count > 0 ? 'secondary' : 'outline'}>
                      {event.retry_count}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(event.created_at).toLocaleString('ar-SA')}
                  </TableCell>
                  <TableCell>
                    {event.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryFailedEvent(event.id)}
                      >
                        إعادة المحاولة
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد أحداث في الفترة المحددة
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health Alert */}
      {stats.successRate < 90 && stats.totalEvents > 10 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            تحذير: معدل نجاح الأحداث المحاسبية أقل من 90%. يرجى مراجعة الأحداث الفاشلة واتخاذ الإجراءات اللازمة.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};