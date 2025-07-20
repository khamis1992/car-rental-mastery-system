
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, CheckCircle, Info, Settings } from 'lucide-react';

const Notifications = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">الإشعارات</h1>
            <p className="text-muted-foreground">مركز الإشعارات والتنبيهات</p>
          </div>
          <div className="flex items-center gap-2 flex-row-reverse">
            <Button className="btn-primary">
              تحديد الكل كمقروء
            </Button>
            <Button variant="outline" className="rtl-flex">
              <Settings className="w-4 h-4" />
              إعدادات الإشعارات
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Bell className="w-10 h-10 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">15</p>
                <p className="text-muted-foreground">إشعارات جديدة</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <AlertTriangle className="w-10 h-10 text-red-500" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-muted-foreground">تنبيهات عاجلة</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-muted-foreground">إشعارات مقروءة</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Info className="w-10 h-10 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-muted-foreground">معلومات عامة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">آخر الإشعارات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  title: "تم تسليم السيارة بنجاح", 
                  description: "تم تسليم سيارة تويوتا كامري للعميل أحمد محمد",
                  time: "منذ 5 دقائق",
                  type: "success",
                  isNew: true
                },
                { 
                  title: "مخالفة مرورية جديدة", 
                  description: "مخالفة سرعة للوحة ABC-123",
                  time: "منذ 15 دقيقة",
                  type: "warning",
                  isNew: true
                },
                { 
                  title: "صيانة مجدولة", 
                  description: "موعد صيانة دورية لسيارة هونداي إلنترا غداً",
                  time: "منذ ساعة",
                  type: "info",
                  isNew: false
                },
                { 
                  title: "فاتورة جديدة", 
                  description: "تم إنشاء فاتورة رقم INV-2024-156",
                  time: "منذ ساعتين",
                  type: "info",
                  isNew: false
                }
              ].map((notification, i) => (
                <div key={i} className={`flex items-start gap-4 p-4 border rounded-lg ${notification.isNew ? 'bg-blue-50 border-blue-200' : ''}`}>
                  <div className="flex-shrink-0 mt-1">
                    {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                    {notification.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                      </div>
                      <div className="text-left flex flex-col items-end gap-2">
                        <p className="text-sm text-muted-foreground">{notification.time}</p>
                        {notification.isNew && <Badge variant="default" className="text-xs">جديد</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Notifications;
