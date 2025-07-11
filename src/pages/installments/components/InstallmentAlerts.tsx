import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, CheckCircle, AlertTriangle, Clock, Eye } from "lucide-react";
import { installmentService } from "@/services/installmentService";
import { useToast } from "@/hooks/use-toast";

interface InstallmentAlert {
  id: string;
  alert_type: string;
  message: string;
  severity: string;
  is_read: boolean;
  sent_at: string;
  read_at?: string;
  installment: {
    id: string;
    installment_number: number;
    due_date: string;
    total_amount: number;
    installment_plan: {
      plan_name: string;
      supplier_name: string;
    };
  };
}

interface Props {
  refreshKey: number;
  onRefresh: () => void;
}

export function InstallmentAlerts({ refreshKey, onRefresh }: Props) {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<InstallmentAlert[]>([]);
  const [unreadAlerts, setUnreadAlerts] = useState<InstallmentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [refreshKey, showUnreadOnly]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await installmentService.getInstallmentAlerts(showUnreadOnly);
      setAlerts(data || []);
      
      if (!showUnreadOnly) {
        const unreadData = await installmentService.getInstallmentAlerts(true);
        setUnreadAlerts(unreadData || []);
      }
    } catch (error) {
      console.error("Error loading alerts:", error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل التنبيهات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await installmentService.markAlertAsRead(alertId);
      loadAlerts();
      toast({
        title: "تم وضع علامة القراءة",
        description: "تم وضع علامة قراءة على التنبيه",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث التنبيه",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await installmentService.markAllAlertsAsRead();
      loadAlerts();
      toast({
        title: "تم وضع علامة القراءة",
        description: "تم وضع علامة قراءة على جميع التنبيهات",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث التنبيهات",
        variant: "destructive",
      });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const severityMap = {
      critical: { label: "حرج", variant: "destructive" as const },
      high: { label: "عالي", variant: "destructive" as const },
      medium: { label: "متوسط", variant: "outline" as const },
      low: { label: "منخفض", variant: "secondary" as const },
    };
    
    const severityInfo = severityMap[severity as keyof typeof severityMap] || severityMap.low;
    return <Badge variant={severityInfo.variant}>{severityInfo.label}</Badge>;
  };

  const getAlertTypeLabel = (type: string) => {
    const typeMap = {
      upcoming: "مستحق قريباً",
      overdue: "متأخر",
      critical: "حرج",
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>التنبيهات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="rtl-title rtl-flex">
              <Bell className="h-5 w-5" />
              التنبيهات
              {unreadAlerts.length > 0 && (
                <Badge variant="destructive" className="mr-2">
                  {unreadAlerts.length} جديد
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              تنبيهات الأقساط المستحقة والمتأخرة
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className="rtl-flex"
            >
              {showUnreadOnly ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {showUnreadOnly ? "جميع التنبيهات" : "غير المقروءة فقط"}
            </Button>
            {unreadAlerts.length > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={markAllAsRead}
                className="rtl-flex"
              >
                <CheckCircle className="h-4 w-4" />
                وضع علامة قراءة على الكل
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {showUnreadOnly ? "لا توجد تنبيهات غير مقروءة" : "لا توجد تنبيهات"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border transition-colors ${
                  alert.is_read 
                    ? "bg-muted/30 border-muted" 
                    : "bg-background border-border shadow-sm"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(alert.severity)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{getAlertTypeLabel(alert.alert_type)}</Badge>
                          {getSeverityBadge(alert.severity)}
                          {!alert.is_read && (
                            <Badge variant="default" className="text-xs">جديد</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium leading-relaxed">
                          {alert.message}
                        </p>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!alert.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(alert.id)}
                            className="h-8 w-8 p-0"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div>
                        {alert.installment?.installment_plan?.plan_name} - القسط #{alert.installment?.installment_number}
                      </div>
                      <div>
                        {new Date(alert.sent_at).toLocaleDateString('ar-KW', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}