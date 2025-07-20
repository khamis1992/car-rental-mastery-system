
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, UserCheck, Clock } from 'lucide-react';

const Employees = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">إدارة الموظفين</h1>
            <p className="text-muted-foreground">عرض وإدارة بيانات الموظفين</p>
          </div>
          <Button className="btn-primary rtl-flex">
            <Plus className="w-4 h-4" />
            موظف جديد
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Users className="w-10 h-10 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-muted-foreground">إجمالي الموظفين</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <UserCheck className="w-10 h-10 text-green-500" />
              <div>
                <p className="text-2xl font-bold">22</p>
                <p className="text-muted-foreground">حاضرين اليوم</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Clock className="w-10 h-10 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-muted-foreground">في إجازة</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">قائمة الموظفين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "أحمد محمد", position: "مدير العمليات", status: "نشط" },
                { name: "فاطمة علي", position: "محاسبة", status: "نشط" },
                { name: "محمد سالم", position: "فني صيانة", status: "في إجازة" }
              ].map((employee, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.position}</p>
                  </div>
                  <Badge variant={employee.status === 'نشط' ? 'default' : 'secondary'}>
                    {employee.status}
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

export default Employees;
