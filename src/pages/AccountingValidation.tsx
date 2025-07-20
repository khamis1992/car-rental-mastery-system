
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { AccountingValidation as AccountingValidationComponent } from '@/components/Accounting/AccountingValidation';
import { AccountingDashboard } from '@/components/Accounting/AccountingDashboard';
import { Button } from '@/components/ui/button';
import { RefreshCw, Shield, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const AccountingValidation = () => {
  const validationStats = [
    {
      title: "القيود المراجعة",
      value: "158",
      status: "تم المراجعة",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />
    },
    {
      title: "القيود المعلقة",
      value: "12",
      status: "تحتاج مراجعة",
      icon: <AlertTriangle className="w-5 h-5 text-orange-500" />
    },
    {
      title: "الأخطاء المكتشفة",
      value: "3",
      status: "تحتاج تصحيح",
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />
    },
    {
      title: "نسبة الدقة",
      value: "98.2%",
      status: "ممتاز",
      icon: <Shield className="w-5 h-5 text-blue-500" />
    }
  ];

  const recentValidations = [
    {
      id: "VAL-001",
      type: "قيد يومي",
      description: "قيد إيراد تأجير سيارة",
      status: "مُوافق عليه",
      date: "2024-01-15",
      reviewer: "محمد أحمد"
    },
    {
      id: "VAL-002",
      type: "قيد تسوية",
      description: "تسوية حساب النقدية",
      status: "معلق",
      date: "2024-01-15",
      reviewer: "فاطمة علي"
    },
    {
      id: "VAL-003",
      type: "قيد إقفال",
      description: "إقفال شهري للحسابات",
      status: "مرفوض",
      date: "2024-01-14",
      reviewer: "أحمد سالم"
    }
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="rtl-title">
            <h1 className="text-3xl font-bold text-foreground">التحقق والمراجعة</h1>
            <p className="text-muted-foreground">مراجعة وتدقيق القيود المحاسبية وضمان الدقة</p>
          </div>
          
          <div className="rtl-flex gap-2">
            <Button variant="outline" className="rtl-flex">
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
            <Button variant="outline" className="rtl-flex">
              <Search className="w-4 h-4" />
              بحث متقدم
            </Button>
            <Button className="btn-primary rtl-flex">
              <Shield className="w-4 h-4" />
              بدء المراجعة
            </Button>
          </div>
        </div>

        {/* Validation Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {validationStats.map((stat, index) => (
            <Card key={index} className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="rtl-content">
                    <p className="text-sm text-muted-foreground rtl-label">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.status}</p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Validations */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="rtl-title">آخر عمليات المراجعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentValidations.map((validation) => (
                <div key={validation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="rtl-content">
                    <div className="flex items-center gap-4 rtl-flex">
                      <Badge variant="outline">{validation.id}</Badge>
                      <div className="text-right">
                        <p className="font-medium">{validation.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {validation.type} • {validation.date} • {validation.reviewer}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      validation.status === 'مُوافق عليه' ? 'default' :
                      validation.status === 'معلق' ? 'secondary' : 'destructive'
                    }
                  >
                    {validation.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* لوحة القيادة المحاسبية */}
        <AccountingDashboard />
        
        {/* واجهة التحقق الرئيسية */}
        <AccountingValidationComponent />
      </div>
    </Layout>
  );
};

export default AccountingValidation;
