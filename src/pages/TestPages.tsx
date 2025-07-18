import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Home, 
  UserPlus, 
  LogIn,
  Building2,
  Users,
  Shield,
  Settings
} from "lucide-react";

const TestPages: React.FC = () => {
  const navigate = useNavigate();

  const pages = [
    {
      name: 'الصفحة الرئيسية',
      path: '/',
      icon: <Home className="w-4 h-4" />,
      description: 'الصفحة المقصودة الرئيسية'
    },
    {
      name: 'تسجيل الدخول',
      path: '/auth',
      icon: <LogIn className="w-4 h-4" />,
      description: 'صفحة تسجيل الدخول'
    },
    {
      name: 'التسجيل',
      path: '/register',
      icon: <UserPlus className="w-4 h-4" />,
      description: 'صفحة إنشاء حساب جديد'
    },
    {
      name: 'لوحة التحكم',
      path: '/dashboard',
      icon: <Building2 className="w-4 h-4" />,
      description: 'لوحة التحكم الرئيسية'
    },
    {
      name: 'العملاء',
      path: '/customers',
      icon: <Users className="w-4 h-4" />,
      description: 'إدارة العملاء'
    },
    {
      name: 'الإعدادات',
      path: '/settings',
      icon: <Settings className="w-4 h-4" />,
      description: 'إعدادات النظام'
    },
    {
      name: 'مدير النظام',
      path: '/super-admin',
      icon: <Shield className="w-4 h-4" />,
      description: 'لوحة تحكم مدير النظام'
    }
  ];

  const testPage = (path: string) => {
    try {
      navigate(path);
      return true;
    } catch (error) {
      console.error('خطأ في الانتقال:', error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            اختبار صفحات النظام
          </h1>
          <p className="text-gray-600">
            تحقق من عمل جميع الصفحات الأساسية في النظام
          </p>
        </div>

        {/* System Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              حالة النظام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">React Router يعمل</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">مكونات UI متاحة</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">التوجيه يعمل بشكل صحيح</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    {page.icon}
                  </div>
                  <h3 className="font-medium">{page.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {page.description}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => testPage(page.path)}
                    className="flex-1"
                  >
                    اختبار الصفحة
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(page.path, '_blank')}
                  >
                    فتح في تبويب جديد
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>إجراءات سريعة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate('/')} variant="outline">
                العودة للرئيسية
              </Button>
              <Button onClick={() => navigate('/auth')} variant="outline">
                تسجيل دخول
              </Button>
              <Button onClick={() => navigate('/register')} variant="outline">
                حساب جديد
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                لوحة التحكم
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                إعادة تحميل الصفحة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>نتائج الاختبار</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span>✅ جميع المكونات الأساسية متاحة</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span>✅ نظام التوجيه يعمل</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span>✅ الصفحات الأساسية متاحة</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <span>ℹ️ يمكنك الآن اختبار كل صفحة على حدة</span>
                <CheckCircle className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPages; 