import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Wrench, 
  Shield,
  Eye,
  X
} from 'lucide-react';
import { useContractMonitoring } from '@/hooks/useContractMonitoring';
import { cn } from '@/lib/utils';

interface AlertsOverviewProps {
  onAlertClick?: (alert: any) => void;
}

export const AlertsOverview: React.FC<AlertsOverviewProps> = ({ onAlertClick }) => {
  const { alerts, loading, dismissAlert, getAlertsByPriority } = useContractMonitoring();
  const { urgent, high, medium, normal } = getAlertsByPriority();

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'expiring_today':
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />;
      case 'expiring_soon':
        return <Clock className="w-4 h-4" />;
      case 'maintenance_due':
        return <Wrench className="w-4 h-4" />;
      case 'insurance_expiring':
        return <Shield className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive text-destructive-foreground';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'normal':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'عاجل';
      case 'high':
        return 'مرتفع';
      case 'medium':
        return 'متوسط';
      case 'normal':
        return 'عادي';
      default:
        return priority;
    }
  };

  const AlertItem = ({ alert, showDismiss = true }: { alert: any; showDismiss?: boolean }) => (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className={cn(
          "p-2 rounded-full",
          alert.priority === 'urgent' ? 'bg-destructive/10 text-destructive' :
          alert.priority === 'high' ? 'bg-orange-100 text-orange-600' :
          alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
          'bg-blue-100 text-blue-600'
        )}>
          {getAlertIcon(alert.type)}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{alert.title}</h4>
            <Badge variant="outline" className={cn("text-xs", getPriorityColor(alert.priority))}>
              {getPriorityLabel(alert.priority)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{alert.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {onAlertClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAlertClick(alert)}
            className="h-8 w-8 p-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
        
        {showDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismissAlert(alert.id)}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>التنبيهات والمتابعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            التنبيهات والمتابعة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="font-medium mb-2">لا توجد تنبيهات</h3>
            <p className="text-sm text-muted-foreground">جميع العقود والمركبات في حالة جيدة</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            التنبيهات والمتابعة
          </div>
          <Badge variant="outline">{alerts.length} تنبيه</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {/* التنبيهات العاجلة */}
            {urgent.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span className="text-sm font-medium text-destructive">عاجل ({urgent.length})</span>
                </div>
                <div className="space-y-2 mb-4">
                  {urgent.map(alert => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))}
                </div>
              </div>
            )}

            {/* التنبيهات عالية الأولوية */}
            {high.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-orange-600">مرتفع ({high.length})</span>
                </div>
                <div className="space-y-2 mb-4">
                  {high.map(alert => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))}
                </div>
              </div>
            )}

            {/* التنبيهات متوسطة الأولوية */}
            {medium.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-600">متوسط ({medium.length})</span>
                </div>
                <div className="space-y-2 mb-4">
                  {medium.map(alert => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))}
                </div>
              </div>
            )}

            {/* التنبيهات عادية */}
            {normal.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-600">عادي ({normal.length})</span>
                </div>
                <div className="space-y-2">
                  {normal.map(alert => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};