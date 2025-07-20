
import React from 'react';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database,
  Palette,
  Globe,
  Save
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Settings = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground rtl-title">الإعدادات</h1>
            <p className="text-muted-foreground">إدارة إعدادات النظام والحساب</p>
          </div>
          <Button className="btn-primary rtl-flex">
            <Save className="w-4 h-4" />
            حفظ التغييرات
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              الملف الشخصي
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              الإشعارات
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              الأمان
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              النظام
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              المظهر
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              عام
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">معلومات الملف الشخصي</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <Input id="fullName" defaultValue="أحمد محمد السالم" />
                  </div>
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input id="email" type="email" defaultValue="ahmed@company.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input id="phone" defaultValue="+965 9999 8888" />
                  </div>
                  <div>
                    <Label htmlFor="position">المنصب</Label>
                    <Input id="position" defaultValue="مدير النظام" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">إعدادات الإشعارات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">إشعارات البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">استقبال الإشعارات عبر البريد الإلكتروني</p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms-notifications">الرسائل النصية</Label>
                    <p className="text-sm text-muted-foreground">استقبال التنبيهات المهمة عبر الرسائل النصية</p>
                  </div>
                  <Switch id="sms-notifications" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-alerts">تنبيهات الصيانة</Label>
                    <p className="text-sm text-muted-foreground">إشعارات مواعيد الصيانة المجدولة</p>
                  </div>
                  <Switch id="maintenance-alerts" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">إعدادات الأمان</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current-password">كلمة المرور الحالية</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div>
                  <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div>
                  <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <div className="flex items-center justify-between mt-6">
                  <div>
                    <Label htmlFor="two-factor">المصادقة الثنائية</Label>
                    <p className="text-sm text-muted-foreground">تفعيل المصادقة الثنائية لحماية إضافية</p>
                  </div>
                  <Switch id="two-factor" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">إعدادات النظام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-backup">النسخ الاحتياطي التلقائي</Label>
                    <p className="text-sm text-muted-foreground">إنشاء نسخة احتياطية تلقائية يومياً</p>
                  </div>
                  <Switch id="auto-backup" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenance-mode">وضع الصيانة</Label>
                    <p className="text-sm text-muted-foreground">تفعيل وضع الصيانة للنظام</p>
                  </div>
                  <Switch id="maintenance-mode" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="debug-mode">وضع التشخيص</Label>
                    <p className="text-sm text-muted-foreground">عرض معلومات إضافية للتشخيص</p>
                  </div>
                  <Switch id="debug-mode" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">إعدادات المظهر</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode">الوضع الليلي</Label>
                    <p className="text-sm text-muted-foreground">تفعيل المظهر الداكن</p>
                  </div>
                  <Switch id="dark-mode" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="compact-view">العرض المضغوط</Label>
                    <p className="text-sm text-muted-foreground">عرض المزيد من المعلومات في مساحة أقل</p>
                  </div>
                  <Switch id="compact-view" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle className="rtl-title">الإعدادات العامة</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company-name">اسم الشركة</Label>
                  <Input id="company-name" defaultValue="شركة تأجير السيارات المتقدمة" />
                </div>
                <div>
                  <Label htmlFor="currency">العملة الافتراضية</Label>
                  <Input id="currency" defaultValue="الدينار الكويتي (د.ك)" />
                </div>
                <div>
                  <Label htmlFor="timezone">المنطقة الزمنية</Label>
                  <Input id="timezone" defaultValue="الكويت (GMT+3)" />
                </div>
                <div>
                  <Label htmlFor="language">اللغة</Label>
                  <Input id="language" defaultValue="العربية" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
