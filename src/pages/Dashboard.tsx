import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import QuickActions from '@/components/Dashboard/QuickActions';

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "إجمالي المركبات",
      value: "48",
      change: "+2.5%",
      icon: <Car className="w-5 h-5 text-blue-500" />
    },
    {
      title: "العملاء النشطين",
      value: "127",
      change: "+8.1%", 
      icon: <Users className="w-5 h-5 text-green-500" />
    },
    {
      title: "العقود الشهر الحالي",
      value: "23",
      change: "+12.3%",
      icon: <FileText className="w-5 h-5 text-orange-500" />
    },
    {
      title: "الإيرادات الشهرية",
      value: "25,000 د.ك",
      change: "+15.2%",
      icon: <DollarSign className="w-5 h-5 text-purple-500" />
    }
  ];

  const recentActivities = [
    {
      id: 1,
      title: "عقد جديد - أحمد محمد",
      description: "تم إنشاء عقد إيجار سيارة تويوتا كامري",
      time: "منذ 5 دقائق",
      icon: <CheckCircle className="w-4 h-4 text-green-500" />
    },
    {
      id: 2,
      title: "صيانة مجدولة",
      description: "صيانة دورية لسيارة هونداي إلنترا",
      time: "منذ 15 دقيقة",
      icon: <Clock className="w-4 h-4 text-blue-500" />
    },
    {
      id: 3,
      title: "تنبيه مخالفة",
      description: "مخالفة سرعة للوحة ABC-123",
      time: "منذ 30 دقيقة",
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />
    }
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">لوحة التحكم</h1>
            <p className="text-muted-foreground">نظرة عامة على أنشطة الشركة</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="card-elegant">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-green-500">{stat.change}</p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <QuickActions />
          </div>

          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">الأنشطة الأخيرة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {activity.icon}
                      <div className="flex-1">
                        <h4 className="font-medium">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
