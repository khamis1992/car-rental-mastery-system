
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Calculator, Users, TrendingUp } from 'lucide-react';

const Payroll = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">إدارة الرواتب</h1>
            <p className="text-muted-foreground">حساب وإدارة رواتب الموظفين</p>
          </div>
          <Button className="btn-primary rtl-flex">
            <Calculator className="w-4 h-4" />
            حساب الرواتب
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <DollarSign className="w-10 h-10 text-green-500" />
              <div>
                <p className="text-2xl font-bold">15,500 د.ك</p>
                <p className="text-muted-foreground">إجمالي الرواتب</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Users className="w-10 h-10 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-muted-foreground">موظف</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <TrendingUp className="w-10 h-10 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">2,300 د.ك</p>
                <p className="text-muted-foreground">المكافآت</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Calculator className="w-10 h-10 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">1,200 د.ك</p>
                <p className="text-muted-foreground">الخصومات</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">رواتب الشهر الحالي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "أحمد محمد", position: "مدير العمليات", salary: "1,200", bonus: "200", total: "1,400" },
                { name: "فاطمة علي", position: "محاسبة", salary: "800", bonus: "100", total: "900" },
                { name: "محمد سالم", position: "فني صيانة", salary: "600", bonus: "50", total: "650" }
              ].map((payroll, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{payroll.name}</p>
                    <p className="text-sm text-muted-foreground">{payroll.position}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{payroll.total} د.ك</p>
                    <p className="text-sm text-muted-foreground">
                      راتب: {payroll.salary} + مكافأة: {payroll.bonus}
                    </p>
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

export default Payroll;
