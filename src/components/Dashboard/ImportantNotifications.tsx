import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";

const ImportantNotifications = () => {
  const { notifications, deleteNotification } = useNotifications();
  
  // عرض الإشعارات ذات الأولوية العالية فقط (أول 5)
  const importantNotifications = notifications
    .filter(n => n.priority === 'urgent' || n.priority === 'high')
    .slice(0, 5);

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
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'عاجل';
      case 'high': return 'مرتفع';
      case 'medium': return 'متوسط';
      default: return 'عادي';
    }
  };


  return (
    <Card className="card-elegant">
      <CardHeader className="rtl-header space-y-0 pb-3">
        <Badge variant="secondary" className="text-xs">
          {importantNotifications.length}
        </Badge>
        <CardTitle className="text-lg font-semibold text-foreground rtl-title">
          <span>التنبيهات المهمة</span>
          <Bell className="w-5 h-5" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {importantNotifications.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">لا توجد تنبيهات جديدة</p>
          </div>
        ) : (
          importantNotifications.map((notification) => (
            <div 
              key={notification.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="rtl-flex mb-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getPriorityColor(notification.priority)}`}
                    >
                      {getPriorityLabel(notification.priority)}
                    </Badge>
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {notification.title}
                    </h4>
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
                  onClick={() => deleteNotification(notification.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
        
        {importantNotifications.length > 0 && (
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