
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Users, Mail } from 'lucide-react';

const Communications = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">التواصل</h1>
            <p className="text-muted-foreground">إدارة الرسائل والتواصل الداخلي</p>
          </div>
          <Button className="btn-primary rtl-flex">
            <Send className="w-4 h-4" />
            رسالة جديدة
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <MessageCircle className="w-10 h-10 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-muted-foreground">رسائل جديدة</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Users className="w-10 h-10 text-green-500" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-muted-foreground">مجموعات نشطة</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Mail className="w-10 h-10 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">128</p>
                <p className="text-muted-foreground">إجمالي الرسائل</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Send className="w-10 h-10 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-muted-foreground">رسائل مرسلة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title">الرسائل الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { from: "أحمد محمد", subject: "تحديث حالة المركبة", time: "منذ 5 دقائق", isNew: true },
                  { from: "فاطمة علي", subject: "استفسار حول الفاتورة", time: "منذ 15 دقيقة", isNew: true },
                  { from: "محمد سالم", subject: "تقرير الصيانة الأسبوعي", time: "منذ ساعة", isNew: false }
                ].map((message, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{message.from}</p>
                      <p className="text-sm text-muted-foreground">{message.subject}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">{message.time}</p>
                      {message.isNew && <Badge variant="default">جديد</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title">المجموعات النشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "فريق الصيانة", members: 8, lastActivity: "منذ دقيقتين" },
                  { name: "إدارة العمليات", members: 5, lastActivity: "منذ 10 دقائق" },
                  { name: "المحاسبة", members: 3, lastActivity: "منذ ساعة" }
                ].map((group, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <p className="text-sm text-muted-foreground">{group.members} أعضاء</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">{group.lastActivity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Communications;
