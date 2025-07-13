import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, CheckCircle, Clock, TrendingDown, 
  TrendingUp, Bell, X, Eye, EyeOff 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SmartAlert {
  id: string;
  alert_type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  is_read: boolean;
  created_at: string;
  metadata?: {
    account_name?: string;
    current_value?: number;
    threshold?: number;
    recommendation?: string;
  };
}

const AlertIcons = {
  low: CheckCircle,
  medium: Clock,
  high: AlertTriangle
};

const AlertColors = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-red-500'
};

export function SmartAlerts() {
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform the data to match our interface
      const transformedAlerts: SmartAlert[] = (data || []).map(insight => ({
        id: insight.id,
        alert_type: insight.insight_type,
        message: insight.insight_description,
        severity: insight.priority_level as 'low' | 'medium' | 'high',
        is_read: insight.is_dismissed,
        created_at: insight.created_at,
        metadata: {
          recommendation: insight.recommended_actions?.[0]
        }
      }));

      setAlerts(transformedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('فشل في تحميل التنبيهات');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('ai_insights')
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast.error('فشل في تحديث حالة التنبيه');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = alerts.filter(alert => !alert.is_read).map(alert => alert.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('installment_alerts')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;

      setAlerts(alerts.map(alert => ({ ...alert, is_read: true })));
      toast.success('تم تعليم جميع التنبيهات كمقروءة');
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
      toast.error('فشل في تحديث التنبيهات');
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      // For now, we'll just mark as read. In a full implementation, 
      // you might want to add a 'dismissed' field
      await markAsRead(alertId);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      toast.success('تم إغلاق التنبيه');
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast.error('فشل في إغلاق التنبيه');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.is_read;
    if (filter === 'high') return alert.severity === 'high';
    return true;
  });

  const unreadCount = alerts.filter(alert => !alert.is_read).length;
  const highPriorityCount = alerts.filter(alert => alert.severity === 'high').length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-right">التنبيهات الذكية</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="rtl-flex">
              <AlertTriangle className="w-4 h-4 ml-1" />
              {highPriorityCount} عالي الأولوية
            </Badge>
            <Badge variant="secondary" className="rtl-flex">
              <Bell className="w-4 h-4 ml-1" />
              {unreadCount} غير مقروء
            </Badge>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              تعليم الكل كمقروء
            </Button>
          )}
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          الكل ({alerts.length})
        </Button>
        <Button 
          variant={filter === 'unread' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('unread')}
        >
          غير مقروء ({unreadCount})
        </Button>
        <Button 
          variant={filter === 'high' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('high')}
        >
          عالي الأولوية ({highPriorityCount})
        </Button>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">لا توجد تنبيهات</h4>
              <p className="text-muted-foreground">
                {filter === 'all' ? 'لا توجد تنبيهات في النظام' :
                 filter === 'unread' ? 'لا توجد تنبيهات غير مقروءة' :
                 'لا توجد تنبيهات عالية الأولوية'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const IconComponent = AlertIcons[alert.severity];
            const iconColor = AlertColors[alert.severity];
            
            return (
              <Alert key={alert.id} className={`${!alert.is_read ? 'border-primary bg-primary/5' : ''} relative`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <IconComponent className={`w-5 h-5 mt-0.5 ${iconColor}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={
                          alert.severity === 'high' ? 'destructive' :
                          alert.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {alert.severity === 'high' ? 'عالي' :
                           alert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(alert.created_at).toLocaleDateString('ar-SA')}
                        </span>
                        {!alert.is_read && (
                          <Badge variant="outline" className="text-xs">
                            جديد
                          </Badge>
                        )}
                      </div>
                      
                      <AlertDescription className="text-right mb-2">
                        {alert.message}
                      </AlertDescription>

                      {alert.metadata?.recommendation && (
                        <div className="mt-2 p-2 bg-muted rounded-md">
                          <p className="text-sm text-right">
                            <strong>التوصية:</strong> {alert.metadata.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!alert.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                        className="rtl-flex"
                      >
                        <Eye className="w-4 h-4 ml-1" />
                        تعليم كمقروء
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Alert>
            );
          })
        )}
      </div>

      {/* Generate Sample Alerts for Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">إنشاء تنبيهات تجريبية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  await supabase.from('ai_insights').insert({
                    insight_type: 'budget_alert',
                    insight_title: 'تجاوز الميزانية',
                    insight_description: 'تجاوز الميزانية المحددة لمركز التكلفة "إدارة المبيعات" بنسبة 15%',
                    priority_level: 'high',
                    recommended_actions: ['مراجعة المصروفات', 'تحديث الميزانية']
                  });
                  fetchAlerts();
                  toast.success('تم إنشاء تنبيه تجريبي');
                } catch (error) {
                  toast.error('فشل في إنشاء التنبيه');
                }
              }}
            >
              تجاوز ميزانية
            </Button>
            
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  await supabase.from('ai_insights').insert({
                    insight_type: 'liquidity_alert',
                    insight_title: 'انخفاض السيولة',
                    insight_description: 'انخفاض نسبة السيولة إلى 0.8، يُنصح بمراجعة التدفق النقدي',
                    priority_level: 'medium',
                    recommended_actions: ['تحسين التحصيل', 'مراجعة المدفوعات']
                  });
                  fetchAlerts();
                  toast.success('تم إنشاء تنبيه تجريبي');
                } catch (error) {
                  toast.error('فشل في إنشاء التنبيه');
                }
              }}
            >
              انخفاض سيولة
            </Button>
            
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  await supabase.from('ai_insights').insert({
                    insight_type: 'performance_alert',
                    insight_title: 'تحسن الأداء',
                    insight_description: 'زيادة الإيرادات بنسبة 20% مقارنة بالشهر الماضي - أداء ممتاز!',
                    priority_level: 'low',
                    recommended_actions: ['الحفاظ على النمو', 'توسيع الاستثمار']
                  });
                  fetchAlerts();
                  toast.success('تم إنشاء تنبيه تجريبي');
                } catch (error) {
                  toast.error('فشل في إنشاء التنبيه');
                }
              }}
            >
              زيادة إيرادات
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}