
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, CheckCircle } from 'lucide-react';

const Leaves = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">إدارة الإجازات</h1>
            <p className="text-muted-foreground">طلبات الإجازات والموافقات</p>
          </div>
          <Button className="btn-primary rtl-flex">
            <Plus className="w-4 h-4" />
            طلب إجازة جديد
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Calendar className="w-10 h-10 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-muted-foreground">طلبات الإجازة</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Clock className="w-10 h-10 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-muted-foreground">قيد المراجعة</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-muted-foreground">معتمدة</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Calendar className="w-10 h-10 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-muted-foreground">أيام متبقية</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">طلبات الإجازات الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { employee: "أحمد محمد", type: "إجازة سنوية", period: "2024-02-01 إلى 2024-02-05", status: "معتمدة" },
                { employee: "فاطمة علي", type: "إجازة مرضية", period: "2024-01-25 إلى 2024-01-26", status: "قيد المراجعة" },
                { employee: "محمد سالم", type: "إجازة طارئة", period: "2024-01-20", status: "معتمدة" }
              ].map((leave, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{leave.employee}</p>
                    <p className="text-sm text-muted-foreground">{leave.type} - {leave.period}</p>
                  </div>
                  <Badge 
                    variant={
                      leave.status === 'معتمدة' ? 'default' :
                      leave.status === 'قيد المراجعة' ? 'secondary' : 'destructive'
                    }
                  >
                    {leave.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leaves;
