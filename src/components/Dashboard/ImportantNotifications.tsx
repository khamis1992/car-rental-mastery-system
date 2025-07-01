import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { useState } from "react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success' | 'error';
  time: string;
  priority: 'high' | 'medium' | 'low';
}

const ImportantNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "عقود منتهية الصلاحية",
      message: "يوجد 3 عقود تنتهي خلال 24 ساعة",
      type: "warning",
      time: "منذ 10 دقائق",
      priority: "high"
    },
    {
      id: "2", 
      title: "سيارة تحتاج صيانة",
      message: "المركبة VEH0023 تجاوزت 5000 كم",
      type: "warning",
      time: "منذ ساعة",
      priority: "medium"
    },
    {
      id: "3",
      title: "دفعة جديدة",
      message: "تم استلام دفعة 500 د.ك من العميل أحمد",
      type: "success",
      time: "منذ ساعتين",
      priority: "low"
    }
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-danger" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-success" />;
      default: return <Info className="w-4 h-4 text-info" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-danger text-danger-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      default: return 'bg-info text-info-foreground';
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Card className="card-elegant">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5" />
          التنبيهات المهمة
        </CardTitle>
        <Badge variant="secondary" className="text-xs">
          {notifications.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">لا توجد تنبيهات جديدة</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {notification.title}
                    </h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getPriorityColor(notification.priority)}`}
                    >
                      {notification.priority === 'high' ? 'عاجل' : 
                       notification.priority === 'medium' ? 'متوسط' : 'عادي'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.time}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-muted"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
        
        {notifications.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-8 text-xs hover-scale"
          >
            عرض جميع التنبيهات
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ImportantNotifications;