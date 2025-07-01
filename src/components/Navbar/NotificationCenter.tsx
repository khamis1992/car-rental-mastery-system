import React, { useState } from 'react';
import { Bell, X, Check, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useUnifiedNotifications } from '@/hooks/useUnifiedNotifications';
import { cn } from '@/lib/utils';

export const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const { 
    notifications,
    handleDismiss,
    handleMarkAsRead,
    stats
  } = useUnifiedNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getTimeAgo = (timeString: string) => {
    // هذه دالة بسيطة لتحويل النص إلى وقت منطقي
    if (timeString === 'الآن') return 'الآن';
    if (timeString.includes('دقيقة')) return timeString;
    if (timeString.includes('ساعة')) return timeString;
    return timeString;
  };


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {stats.criticalCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {stats.criticalCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-96 sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              الإشعارات
            </div>
            <div className="flex items-center gap-2">
              {stats.unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    notifications.filter(n => !n.read).forEach(n => handleMarkAsRead(n));
                  }}
                  className="text-xs"
                >
                  <Check className="w-4 h-4 mr-1" />
                  قراءة الكل
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {/* إحصائيات سريعة */}
          {stats.criticalCount > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-destructive">
                <Bell className="w-4 h-4" />
                <span className="font-medium text-sm">تنبيهات مهمة</span>
              </div>
              <p className="text-xs text-destructive/80 mt-1">
                {stats.urgent > 0 && `${stats.urgent} عاجل`}
                {stats.urgent > 0 && stats.high > 0 && ' • '}
                {stats.high > 0 && `${stats.high} مرتفع`}
              </p>
            </div>
          )}

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">لا توجد إشعارات</h3>
                  <p className="text-sm text-muted-foreground">
                    ستظهر هنا جميع الإشعارات والتنبيهات المهمة
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer",
                      !notification.read && "bg-primary/5 border-primary/20"
                    )}
                    onClick={() => handleMarkAsRead(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {getTimeAgo(notification.time)}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  notification.priority === 'urgent' && "border-destructive text-destructive",
                                  notification.priority === 'high' && "border-orange-500 text-orange-600",
                                  notification.priority === 'medium' && "border-yellow-500 text-yellow-600"
                                )}
                              >
                                {notification.category}
                              </Badge>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDismiss(notification);
                                }}
                                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};