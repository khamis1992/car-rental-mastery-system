import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Eye, EyeOff, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CostCenterBudgetAlert {
  id: string;
  cost_center_id: string;
  alert_type: 'budget_exceeded' | 'budget_warning' | 'budget_critical';
  threshold_percentage: number;
  current_spent: number;
  budget_amount: number;
  alert_message: string;
  is_read: boolean;
  created_at: string;
  cost_center?: {
    cost_center_name: string;
    cost_center_code: string;
  };
}

interface CostCenterBudgetAlertsProps {
  showOnlyUnread?: boolean;
  maxAlerts?: number;
}

export const CostCenterBudgetAlerts: React.FC<CostCenterBudgetAlertsProps> = ({
  showOnlyUnread = false,
  maxAlerts = 10
}) => {
  const [alerts, setAlerts] = useState<CostCenterBudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
  }, [showOnlyUnread, maxAlerts]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('cost_center_budget_alerts')
        .select(`
          *,
          cost_center:cost_centers(cost_center_name, cost_center_code)
        `)
        .order('created_at', { ascending: false });

      if (showOnlyUnread) {
        query = query.eq('is_read', false);
      }
      
      if (maxAlerts) {
        query = query.limit(maxAlerts);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading alerts:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في تحميل تنبيهات مراكز التكلفة',
          variant: 'destructive',
        });
        return;
      }

      setAlerts((data || []) as CostCenterBudgetAlert[]);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في تحميل التنبيهات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('cost_center_budget_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) {
        console.error('Error marking alert as read:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في تحديث حالة التنبيه',
          variant: 'destructive',
        });
        return;
      }

      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث حالة التنبيه',
      });
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadAlertIds = alerts.filter(alert => !alert.is_read).map(alert => alert.id);
      
      if (unreadAlertIds.length === 0) return;

      const { error } = await supabase
        .from('cost_center_budget_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .in('id', unreadAlertIds);

      if (error) {
        console.error('Error marking all alerts as read:', error);
        toast({
          title: 'خطأ',
          description: 'فشل في تحديث حالة التنبيهات',
          variant: 'destructive',
        });
        return;
      }

      // Update local state
      setAlerts(alerts.map(alert => ({ ...alert, is_read: true })));

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث جميع التنبيهات كمقروءة',
      });
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'budget_exceeded':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'budget_critical':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'budget_warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertBadgeVariant = (alertType: string) => {
    switch (alertType) {
      case 'budget_exceeded':
        return 'destructive';
      case 'budget_critical':
        return 'destructive';
      case 'budget_warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    switch (alertType) {
      case 'budget_exceeded':
        return 'تجاوز الميزانية';
      case 'budget_critical':
        return 'تحذير حرج';
      case 'budget_warning':
        return 'تحذير';
      default:
        return 'تنبيه';
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} د.ك`;
  };

  const getUsagePercentage = (spent: number, budget: number) => {
    return budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">جاري تحميل التنبيهات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
            <h3 className="font-medium">لا توجد تنبيهات</h3>
            <p className="text-sm text-muted-foreground">
              {showOnlyUnread ? 'جميع التنبيهات مقروءة' : 'لا توجد تنبيهات لمراكز التكلفة'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = alerts.filter(alert => !alert.is_read).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 rtl-flex">
            <Bell className="w-5 h-5" />
            تنبيهات مراكز التكلفة
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <Card 
            key={alert.id} 
            className={`transition-all ${
              !alert.is_read 
                ? 'border-l-4 border-l-primary bg-primary/5' 
                : 'opacity-70'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getAlertBadgeVariant(alert.alert_type)} className="text-xs">
                        {getAlertTypeLabel(alert.alert_type)}
                      </Badge>
                      {!alert.is_read && (
                        <Badge variant="outline" className="text-xs">
                          جديد
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-sm mb-1">
                      {alert.cost_center?.cost_center_name} ({alert.cost_center?.cost_center_code})
                    </h4>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {alert.alert_message}
                    </p>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>المستخدم من الميزانية:</span>
                        <span className="font-medium">
                          {getUsagePercentage(alert.current_spent, alert.budget_amount).toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            alert.alert_type === 'budget_exceeded' ? 'bg-red-500' :
                            alert.alert_type === 'budget_critical' ? 'bg-orange-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ 
                            width: `${Math.min(getUsagePercentage(alert.current_spent, alert.budget_amount), 100)}%` 
                          }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                        <div>
                          <span className="text-muted-foreground">المنصرف:</span>
                          <span className="font-medium mr-1">{formatCurrency(alert.current_spent)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الميزانية:</span>
                          <span className="font-medium mr-1">{formatCurrency(alert.budget_amount)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(alert.created_at).toLocaleString('ar-SA')}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1">
                  {!alert.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(alert.id)}
                      title="تحديد كمقروء"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {alerts.length >= maxAlerts && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm" onClick={loadAlerts}>
              تحديث التنبيهات
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};