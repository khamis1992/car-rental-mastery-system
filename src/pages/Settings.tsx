import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings as SettingsIcon, Users, Building, Shield, Bell, Database, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import OfficeLocationManager from '@/components/Settings/OfficeLocationManager';

const Settings = () => {
  const { profile } = useAuth();
  const { systemSettings: globalSystemSettings, updateSystemSettings } = useSettings();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'company';
  
  const [companySettings, setCompanySettings] = useState({
    name: 'شركة النجوم لتأجير السيارات',
    email: 'info@najoomrentals.com',
    phone: '+966501234567',
    address: 'الرياض، المملكة العربية السعودية',
    taxNumber: '1234567890',
    logo: ''
  });

  const [systemSettings, setSystemSettings] = useState(globalSystemSettings);

  // تحديث الحالة المحلية عند تغيير الإعدادات العامة
  useEffect(() => {
    setSystemSettings(globalSystemSettings);
  }, [globalSystemSettings]);

  const users = [
    {
      id: '1',
      name: 'أحمد محمد',
      email: 'ahmed@company.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2025-01-01'
    },
    {
      id: '2', 
      name: 'فاطمة علي',
      email: 'fatima@company.com',
      role: 'manager',
      status: 'active',
      lastLogin: '2024-12-31'
    },
    {
      id: '3',
      name: 'محمد سعد',
      email: 'mohammed@company.com', 
      role: 'receptionist',
      status: 'inactive',
      lastLogin: '2024-12-28'
    }
  ];

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'مدير النظام',
      manager: 'مدير',
      accountant: 'محاسب',
      technician: 'فني',
      receptionist: 'موظف استقبال'
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: 'bg-red-500',
      manager: 'bg-blue-500',
      accountant: 'bg-green-500',
      technician: 'bg-orange-500',
      receptionist: 'bg-gray-500'
    };
    return roleColors[role] || 'bg-gray-500';
  };

  const handleCompanySettingChange = (field: string, value: string) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSystemSettingChange = (field: string, value: any) => {
    setSystemSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = () => {
    try {
      // حفظ إعدادات النظام في السياق العام
      Object.keys(systemSettings).forEach(key => {
        updateSystemSettings(key, systemSettings[key as keyof typeof systemSettings]);
      });
      
      toast({
        title: "تم حفظ الإعدادات",
        description: "تم حفظ جميع الإعدادات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    }
  };

  // Only allow admin and manager to access settings
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    return (
      <div className="p-6">
        <Card className="card-elegant">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">غير مصرح لك</h3>
            <p className="text-sm text-muted-foreground">لا تملك الصلاحيات اللازمة للوصول إلى الإعدادات</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إعدادات النظام</h1>
          <p className="text-muted-foreground">إدارة إعدادات النظام والشركة والمستخدمين</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            نسخ احتياطي
          </Button>
          <Button 
            className="btn-primary flex items-center gap-2"
            onClick={handleSaveSettings}
          >
            <SettingsIcon className="w-4 h-4" />
            حفظ الإعدادات
          </Button>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company">بيانات الشركة</TabsTrigger>
          <TabsTrigger value="system">إعدادات النظام</TabsTrigger>
          <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
          <TabsTrigger value="locations">مواقع المكاتب</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                معلومات الشركة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">اسم الشركة</Label>
                  <Input
                    id="companyName"
                    value={companySettings.name}
                    onChange={(e) => handleCompanySettingChange('name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyEmail">البريد الإلكتروني</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => handleCompanySettingChange('email', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyPhone">رقم الهاتف</Label>
                  <Input
                    id="companyPhone"
                    value={companySettings.phone}
                    onChange={(e) => handleCompanySettingChange('phone', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxNumber">الرقم الضريبي</Label>
                  <Input
                    id="taxNumber"
                    value={companySettings.taxNumber}
                    onChange={(e) => handleCompanySettingChange('taxNumber', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyAddress">العنوان</Label>
                <Textarea
                  id="companyAddress"
                  value={companySettings.address}
                  onChange={(e) => handleCompanySettingChange('address', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                إعدادات النظام العامة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">العملة الافتراضية</Label>
                  <Input
                    id="currency"
                    value={systemSettings.defaultCurrency}
                    onChange={(e) => handleSystemSettingChange('defaultCurrency', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">المنطقة الزمنية</Label>
                  <Input
                    id="timezone"
                    value={systemSettings.timeZone}
                    onChange={(e) => handleSystemSettingChange('timeZone', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">تنسيق التاريخ</Label>
                  <Input
                    id="dateFormat"
                    value={systemSettings.dateFormat}
                    onChange={(e) => handleSystemSettingChange('dateFormat', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">اللغة</Label>
                  <Input
                    id="language"
                    value={systemSettings.language}
                    onChange={(e) => handleSystemSettingChange('language', e.target.value)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">إعدادات التنبيهات</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">إشعارات البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">تلقي إشعارات عبر البريد الإلكتروني</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={systemSettings.emailNotifications}
                    onCheckedChange={(checked) => handleSystemSettingChange('emailNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">إشعارات الرسائل النصية</Label>
                    <p className="text-sm text-muted-foreground">تلقي إشعارات عبر الرسائل النصية</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={systemSettings.smsNotifications}
                    onCheckedChange={(checked) => handleSystemSettingChange('smsNotifications', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode">وضع الصيانة</Label>
                    <p className="text-sm text-muted-foreground">تعطيل النظام مؤقتاً للصيانة</p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => handleSystemSettingChange('maintenanceMode', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  إدارة المستخدمين
                </CardTitle>
                <Button className="btn-primary">
                  <Users className="w-4 h-4 mr-2" />
                  إضافة مستخدم
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">آخر دخول: {user.lastLogin}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={`text-white ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                        {user.status === 'active' ? 'نشط' : 'غير نشط'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        تعديل
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                إدارة مواقع المكاتب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OfficeLocationManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                إعدادات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>إشعارات العقود المنتهية</Label>
                    <p className="text-sm text-muted-foreground">تنبيه عند انتهاء صلاحية العقود</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>إشعارات الصيانة المجدولة</Label>
                    <p className="text-sm text-muted-foreground">تنبيه قبل موعد الصيانة المجدولة</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>إشعارات المدفوعات المتأخرة</Label>
                    <p className="text-sm text-muted-foreground">تنبيه عند تأخر المدفوعات</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>إشعارات العملاء الجدد</Label>
                    <p className="text-sm text-muted-foreground">تنبيه عند تسجيل عميل جديد</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>إشعارات انتهاء التأمين</Label>
                    <p className="text-sm text-muted-foreground">تنبيه قبل انتهاء تأمين المركبات</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>تفعيل نظام الحضور والغياب</Label>
                    <p className="text-sm text-muted-foreground">إظهار أو إخفاء تبويبة الحضور والغياب من القائمة الرئيسية</p>
                  </div>
                   <Switch 
                     checked={systemSettings.attendanceEnabled}
                     onCheckedChange={(checked) => handleSystemSettingChange('attendanceEnabled', checked)}
                   />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;