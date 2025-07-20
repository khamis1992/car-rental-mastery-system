
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Car, Calendar, DollarSign } from 'lucide-react';

const Violations = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">المخالفات المرورية</h1>
            <p className="text-muted-foreground">متابعة وإدارة المخالفات المرورية للأسطول</p>
          </div>
          <Button className="btn-primary">
            تسجيل مخالفة جديدة
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <AlertTriangle className="w-10 h-10 text-red-500" />
              <div>
                <p className="text-2xl font-bold">23</p>
                <p className="text-muted-foreground">مخالفات نشطة</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <DollarSign className="w-10 h-10 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">1,250 د.ك</p>
                <p className="text-muted-foreground">إجمالي الغرامات</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-elegant">
            <CardContent className="p-6 flex items-center gap-4">
              <Car className="w-10 h-10 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-muted-foreground">مركبات لها مخالفات</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">آخر المخالفات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant="destructive">سرعة</Badge>
                    <div>
                      <p className="font-medium">مخالفة سرعة - لوحة ABC-{i}23</p>
                      <p className="text-sm text-muted-foreground">تاريخ المخالفة: 2024-01-{15 + i}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{50 * i} د.ك</p>
                    <Badge variant="secondary">غير مدفوعة</Badge>
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

export default Violations;
