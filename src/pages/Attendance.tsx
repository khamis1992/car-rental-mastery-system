
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';

const Attendance = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">الحضور والغياب</h1>
            <p className="text-muted-foreground">متابعة حضور وغياب الموظفين</p>
          </div>
          <Button className="btn-primary rtl-flex">
            <Calendar className="w-4 h-4" />
            تقرير الحضور
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <div>
                <p className="text-2xl font-bold">22</p>
                <p className="text-muted-foreground">حاضرين اليوم</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <XCircle className="w-10 h-10 text-red-500" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-muted-foreground">غائبين</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Clock className="w-10 h-10 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-muted-foreground">متأخرين</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Calendar className="w-10 h-10 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">91%</p>
                <p className="text-muted-foreground">نسبة الحضور</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">حضور اليوم</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "أحمد محمد", time: "08:00", status: "حاضر" },
                { name: "فاطمة علي", time: "08:15", status: "متأخر" },
                { name: "محمد سالم", time: "-", status: "غائب" }
              ].map((record, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{record.name}</p>
                    <p className="text-sm text-muted-foreground">وقت الوصول: {record.time}</p>
                  </div>
                  <Badge 
                    variant={
                      record.status === 'حاضر' ? 'default' :
                      record.status === 'متأخر' ? 'secondary' : 'destructive'
                    }
                  >
                    {record.status}
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

export default Attendance;
