import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2,
  Calendar,
  DollarSign,
  Users,
  Edit,
  RefreshCw
} from "lucide-react";

const TenantSubscriptions: React.FC = () => {
  const subscriptions = [
    {
      id: 1,
      tenantName: "شركة البشائر الخليجية",
      plan: "خطة المؤسسة",
      price: "500 د.ك/شهر",
      status: "نشط",
      statusColor: "bg-success",
      nextBilling: "2024-02-15",
      users: 50,
      maxUsers: 100
    },
    {
      id: 2,
      tenantName: "مؤسسة النقل الحديث",
      plan: "خطة المتقدمة",
      price: "300 د.ك/شهر",
      status: "نشط",
      statusColor: "bg-success",
      nextBilling: "2024-02-20",
      users: 25,
      maxUsers: 50
    },
    {
      id: 3,
      tenantName: "شركة التوصيل السريع",
      plan: "خطة الأساسية",
      price: "150 د.ك/شهر",
      status: "نشط",
      statusColor: "bg-success",
      nextBilling: "2024-02-10",
      users: 10,
      maxUsers: 25
    },
    {
      id: 4,
      tenantName: "شركة الخدمات اللوجستية",
      plan: "خطة المتقدمة",
      price: "300 د.ك/شهر",
      status: "معلق",
      statusColor: "bg-warning",
      nextBilling: "2024-01-25",
      users: 30,
      maxUsers: 50
    }
  ];

  const plans = [
    {
      name: "خطة الأساسية",
      price: "150 د.ك/شهر",
      users: "حتى 25 مستخدم",
      features: ["إدارة الأسطول الأساسية", "التقارير الأساسية", "الدعم الفني"]
    },
    {
      name: "خطة المتقدمة",
      price: "300 د.ك/شهر",
      users: "حتى 50 مستخدم",
      features: ["جميع مميزات الخطة الأساسية", "التقارير المتقدمة", "إدارة المحاسبة", "API متقدم"]
    },
    {
      name: "خطة المؤسسة",
      price: "500 د.ك/شهر",
      users: "حتى 100 مستخدم",
      features: ["جميع الميزات", "الدعم المخصص", "التخصيص الكامل", "التكامل المتقدم"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Subscription Plans */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>خطط الاشتراك المتاحة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <Card key={index} className="border-muted">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <div className="text-2xl font-bold text-primary">{plan.price}</div>
                    <p className="text-sm text-muted-foreground">{plan.users}</p>
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="text-muted-foreground">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>الاشتراكات النشطة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} className="border-muted">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-primary p-3 rounded-xl">
                        <Building2 className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{subscription.tenantName}</h3>
                        <p className="text-sm text-muted-foreground">{subscription.plan}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>السعر</span>
                        </div>
                        <p className="font-semibold">{subscription.price}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>المستخدمين</span>
                        </div>
                        <p className="font-semibold">{subscription.users}/{subscription.maxUsers}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>الفاتورة التالية</span>
                        </div>
                        <p className="font-semibold">{subscription.nextBilling}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`text-white ${subscription.statusColor}`}>
                          {subscription.status}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantSubscriptions;