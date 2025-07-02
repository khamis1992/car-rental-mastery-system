import React, { useState } from 'react';
import { Bell, Check, X, Clock, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const Notifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'warning',
      title: 'عقد ينتهي اليوم',
      message: 'عقد العميل أحمد محمد (CON000001) ينتهي اليوم في تمام الساعة 5:00 مساءً',
      time: '5 دقائق مضت',
      read: false,
      priority: 'high',
      category: 'contracts'
    },
    {
      id: '2',
      type: 'error',
      title: 'صيانة مطلوبة بشكل عاجل',
      message: 'السيارة كامري 2023 (VEH0001) تحتاج صيانة عاجلة - تم الإبلاغ عن مشكلة في المحرك',
      time: '15 دقيقة مضت',
      read: false,
      priority: 'urgent',
      category: 'maintenance'
    },
    {
      id: '3',
      type: 'info',
      title: 'عميل جديد',
      message: 'تم تسجيل عميل جديد: فاطمة علي',
      time: '30 دقيقة مضت',
      read: true,
      priority: 'normal',
      category: 'customers'
    },
    {
      id: '4',
      type: 'success',
      title: 'تم السداد بنجاح',
      message: 'تم استلام دفعة بقيمة 2,500 ر.س من العميل محمد سعد',
      time: '1 ساعة مضت',
      read: true,
      priority: 'normal',
      category: 'payments'
    },
    {
      id: '5',
      type: 'warning',
      title: 'انتهاء صلاحية التأمين قريباً',
      message: 'تأمين السيارة اكورد 2022 ينتهي خلال 7 أيام',
      time: '2 ساعة مضت',
      read: false,
      priority: 'medium',
      category: 'insurance'
    }
  ]);

  const [settings, setSettings] = useState({
    contractExpiry: true,
    maintenanceAlerts: true,
    paymentReminders: true,
    newCustomers: false,
    insuranceExpiry: true,
    systemUpdates: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'error':
        return <X className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      contracts: 'العقود',
      maintenance: 'الصيانة',
      customers: 'العملاء',
      payments: 'المدفوعات',
      insurance: 'التأمين',
      system: 'النظام'
    };
    return labels[category] || category;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filterNotifications = (category?: string) => {
    if (!category) return notifications;
    return notifications.filter(n => n.category === category);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-8 h-8" />
            الإشعارات والتنبيهات
          </h1>
          <p className="text-muted-foreground">
            إدارة جميع الإشعارات والتنبيهات الخاصة بالنظام
            {unreadCount > 0 && (
              <span className="mr-2">
                <Badge className="bg-red-500 text-white">{unreadCount} غير مقروء</Badge>
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="w-4 h-4 mr-2" />
            تحديد الكل كمقروء
          </Button>
          <Button className="btn-primary">
            <Bell className="w-4 h-4 mr-2" />
            إعدادات الإشعارات
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          <TabsTrigger value="insurance">التأمين</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          <TabsTrigger value="maintenance">الصيانة</TabsTrigger>
          <TabsTrigger value="contracts">العقود</TabsTrigger>
          <TabsTrigger value="all">الكل ({notifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>جميع الإشعارات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg transition-all ${
                      !notification.read ? 'bg-muted/50 border-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium ${!notification.read ? 'font-bold' : ''}`}>
                              {notification.title}
                            </h3>
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority === 'urgent' ? 'عاجل' : 
                               notification.priority === 'high' ? 'مهم' :
                               notification.priority === 'medium' ? 'متوسط' : 'عادي'}
                            </Badge>
                            <Badge variant="outline">
                              {getCategoryLabel(notification.category)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {notification.time}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {['contracts', 'maintenance', 'payments', 'insurance'].map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>إشعارات {getCategoryLabel(category)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filterNotifications(category).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-all ${
                        !notification.read ? 'bg-muted/50 border-primary/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-medium ${!notification.read ? 'font-bold' : ''}`}>
                                {notification.title}
                              </h3>
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority === 'urgent' ? 'عاجل' : 
                                 notification.priority === 'high' ? 'مهم' :
                                 notification.priority === 'medium' ? 'متوسط' : 'عادي'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {notification.time}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="settings" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle>إعدادات الإشعارات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">أنواع الإشعارات</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>إشعارات انتهاء العقود</Label>
                      <p className="text-sm text-muted-foreground">تنبيه قبل انتهاء العقود</p>
                    </div>
                    <Switch
                      checked={settings.contractExpiry}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, contractExpiry: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>تنبيهات الصيانة</Label>
                      <p className="text-sm text-muted-foreground">إشعارات الصيانة المجدولة والعاجلة</p>
                    </div>
                    <Switch
                      checked={settings.maintenanceAlerts}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, maintenanceAlerts: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>تذكير المدفوعات</Label>
                      <p className="text-sm text-muted-foreground">تنبيه عند استحقاق المدفوعات</p>
                    </div>
                    <Switch
                      checked={settings.paymentReminders}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, paymentReminders: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>العملاء الجدد</Label>
                      <p className="text-sm text-muted-foreground">إشعار عند تسجيل عميل جديد</p>
                    </div>
                    <Switch
                      checked={settings.newCustomers}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, newCustomers: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>انتهاء التأمين</Label>
                      <p className="text-sm text-muted-foreground">تنبيه قبل انتهاء تأمين المركبات</p>
                    </div>
                    <Switch
                      checked={settings.insuranceExpiry}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, insuranceExpiry: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">طرق التنبيه</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>إشعارات البريد الإلكتروني</Label>
                      <p className="text-sm text-muted-foreground">إرسال إشعارات عبر البريد الإلكتروني</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, emailNotifications: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>الرسائل النصية</Label>
                      <p className="text-sm text-muted-foreground">إرسال تنبيهات عبر الرسائل النصية</p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, smsNotifications: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>الإشعارات الفورية</Label>
                      <p className="text-sm text-muted-foreground">إشعارات فورية في المتصفح</p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, pushNotifications: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications;