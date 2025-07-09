import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Settings as SettingsIcon, Users, Building, Shield, Bell, Database, Palette, BookOpen, Download, FileText } from 'lucide-react';
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
import AddUserDialog from '@/components/Settings/AddUserDialog';
import CompanyBrandingManager from '@/components/Settings/CompanyBrandingManager';
import { HTMLDocumentsService } from '@/lib/htmlDocumentsService';
import { SystemFlowchartSection } from '@/components/Settings/SystemFlowchartSection';

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
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

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

  const handleUserAdded = () => {
    // Refresh users list or show success message
    toast({
      title: "تم إضافة المستخدم",
      description: "تم إضافة المستخدم الجديد بنجاح",
    });
  };

  const handleDownloadGuide = async (guideType: string, guideName: string) => {
    try {
      const htmlService = new HTMLDocumentsService();
      
      // فتح نافذة طباعة بتنسيق HTML
      htmlService.openPrintWindow(guideType, guideName);
      
      toast({
        title: "تم فتح نافذة الطباعة",
        description: `يمكنك الآن طباعة ${guideName} أو حفظه كـ PDF`,
      });
    } catch (error) {
      toast({
        title: "خطأ في فتح الدليل",
        description: "حدث خطأ أثناء فتح نافذة الطباعة",
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
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="documentation">الأدلة والتوثيق</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          <TabsTrigger value="branding">العلامة التجارية</TabsTrigger>
          <TabsTrigger value="locations">مواقع المكاتب</TabsTrigger>
          <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
          <TabsTrigger value="system">إعدادات النظام</TabsTrigger>
          <TabsTrigger value="company">بيانات الشركة</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 rtl-flex rtl-title">
                <Building className="w-5 h-5" />
                معلومات الشركة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="rtl-label text-right">اسم الشركة</Label>
                  <Input
                    id="companyName"
                    value={companySettings.name}
                    onChange={(e) => handleCompanySettingChange('name', e.target.value)}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyEmail" className="rtl-label text-right">البريد الإلكتروني</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => handleCompanySettingChange('email', e.target.value)}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companyPhone" className="rtl-label text-right">رقم الهاتف</Label>
                  <Input
                    id="companyPhone"
                    value={companySettings.phone}
                    onChange={(e) => handleCompanySettingChange('phone', e.target.value)}
                    className="text-right"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxNumber" className="rtl-label text-right">الرقم الضريبي</Label>
                  <Input
                    id="taxNumber"
                    value={companySettings.taxNumber}
                    onChange={(e) => handleCompanySettingChange('taxNumber', e.target.value)}
                    className="text-right"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyAddress" className="rtl-label text-right">العنوان</Label>
                <Textarea
                  id="companyAddress"
                  value={companySettings.address}
                  onChange={(e) => handleCompanySettingChange('address', e.target.value)}
                  rows={3}
                  className="text-right"
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
                  <Switch
                    id="emailNotifications"
                    checked={systemSettings.emailNotifications}
                    onCheckedChange={(checked) => handleSystemSettingChange('emailNotifications', checked)}
                  />
                  <div className="text-right">
                    <Label htmlFor="emailNotifications">إشعارات البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">تلقي إشعارات عبر البريد الإلكتروني</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Switch
                    id="smsNotifications"
                    checked={systemSettings.smsNotifications}
                    onCheckedChange={(checked) => handleSystemSettingChange('smsNotifications', checked)}
                  />
                  <div className="text-right">
                    <Label htmlFor="smsNotifications">إشعارات الرسائل النصية</Label>
                    <p className="text-sm text-muted-foreground">تلقي إشعارات عبر الرسائل النصية</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Switch
                    id="maintenanceMode"
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => handleSystemSettingChange('maintenanceMode', checked)}
                  />
                  <div className="text-right">
                    <Label htmlFor="maintenanceMode">وضع الصيانة</Label>
                    <p className="text-sm text-muted-foreground">تعطيل النظام مؤقتاً للصيانة</p>
                  </div>
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
                <Button 
                  className="btn-primary"
                  onClick={() => setIsAddUserDialogOpen(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  إضافة مستخدم
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg flex-row-reverse">
                    <div className="flex items-center gap-3 flex-row-reverse">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Badge className={`text-white ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </Badge>
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status === 'active' ? 'نشط' : 'غير نشط'}
                          </Badge>
                          <h3 className="font-medium">{user.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">آخر دخول: {user.lastLogin}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
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

        <TabsContent value="branding" className="space-y-4">
          <CompanyBrandingManager />
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

        <TabsContent value="documentation" className="space-y-4">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 flex-row-reverse">
                <BookOpen className="w-5 h-5" />
                الأدلة والتوثيق
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="mb-6 text-right">
                <h3 className="text-lg font-medium text-foreground mb-2">أدلة النظام</h3>
                <p className="text-sm text-muted-foreground">
                  تحميل الأدلة الشاملة لاستخدام النظام بصيغة PDF احترافية بحجم A4
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SystemFlowchartSection />
                
                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 text-right">
                    <div className="flex items-center gap-3 mb-4 rtl-flex">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground rtl-title">دليل المستخدم</h4>
                        <p className="text-sm text-muted-foreground">الدليل الشامل للنظام</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      دليل شامل يغطي جميع أدوار المستخدمين، الواجهات، والعمليات الأساسية في النظام
                    </p>
                    
                    <Button 
                      className="w-full btn-primary flex items-center gap-2 flex-row-reverse"
                      onClick={() => handleDownloadGuide('user-manual', 'دليل_المستخدم')}
                    >
                      <Download className="w-4 h-4" />
                      تحميل/طباعة
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 text-right">
                    <div className="flex items-center gap-3 mb-4 flex-row-reverse">
                      <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-green-500" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-medium text-foreground">دليل إدارة العقود</h4>
                        <p className="text-sm text-muted-foreground">دورة حياة العقد كاملة</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      شرح مفصل لجميع مراحل العقد من الإنشاء حتى الإكمال، تسليم واستقبال المركبات
                    </p>
                    
                    <Button 
                      className="w-full btn-primary flex items-center gap-2 flex-row-reverse"
                      onClick={() => handleDownloadGuide('contracts-guide', 'دليل_إدارة_العقود')}
                    >
                      <Download className="w-4 h-4" />
                      تحميل/طباعة
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 text-right">
                    <div className="flex items-center gap-3 mb-4 flex-row-reverse">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-medium text-foreground">دليل النظام المحاسبي</h4>
                        <p className="text-sm text-muted-foreground">المحاسبة والتقارير المالية</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      دليل شامل للنظام المحاسبي، دليل الحسابات، القيود المحاسبية والتقارير المالية
                    </p>
                    
                    <Button 
                      className="w-full btn-primary flex items-center gap-2 flex-row-reverse"
                      onClick={() => handleDownloadGuide('accounting-guide', 'دليل_النظام_المحاسبي')}
                    >
                      <Download className="w-4 h-4" />
                      تحميل/طباعة
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 text-right">
                    <div className="flex items-center gap-3 mb-4 flex-row-reverse">
                      <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-medium text-foreground">دليل استكشاف الأخطاء</h4>
                        <p className="text-sm text-muted-foreground">حل المشاكل الشائعة</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      دليل شامل لحل جميع المشاكل الشائعة في النظام وإجراءات الطوارئ
                    </p>
                    
                    <Button 
                      className="w-full btn-primary flex items-center gap-2 flex-row-reverse"
                      onClick={() => handleDownloadGuide('troubleshooting-guide', 'دليل_استكشاف_الأخطاء')}
                    >
                      <Download className="w-4 h-4" />
                      تحميل/طباعة
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 text-right">
                    <div className="flex items-center gap-3 mb-4 flex-row-reverse">
                      <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                        <SettingsIcon className="w-6 h-6 text-orange-500" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-medium text-foreground">دليل الإعداد والتكوين</h4>
                        <p className="text-sm text-muted-foreground">إعداد النظام الأولي</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 text-right">
                      دليل شامل لإعداد النظام، تكوين الشركة، المستخدمين والإعدادات الأولية
                    </p>
                    
                    <Button 
                      className="w-full btn-primary flex items-center gap-2 flex-row-reverse"
                      onClick={() => handleDownloadGuide('setup-guide', 'دليل_الإعداد_والتكوين')}
                    >
                      <Download className="w-4 h-4" />
                      تحميل/طباعة
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-muted/30 p-6 rounded-lg border">
                <div className="flex items-start gap-3 flex-row-reverse text-right">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-right">
                    <h4 className="font-medium text-foreground mb-2">ملاحظات مهمة حول الأدلة</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside text-right">
                      <li>جميع الأدلة محدثة ومتوافقة مع أحدث إصدار من النظام</li>
                      <li>تنسيق HTML محسن للطباعة بحجم A4 مع إمكانية حفظ كـ PDF</li>
                      <li>تدعم الخط العربي مع تخطيط RTL مناسب للغة العربية</li>
                      <li>تحتوي على تنسيق احترافي مع ألوان وعناوين منظمة</li>
                      <li>يمكن طباعتها مباشرة من المتصفح أو حفظها كـ PDF</li>
                      <li>يتم تحديث الأدلة دورياً مع كل تحديث للنظام</li>
                    </ul>
                  </div>
                </div>
              </div>
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
                  <Switch defaultChecked />
                  <div className="text-right">
                    <Label>إشعارات العقود المنتهية</Label>
                    <p className="text-sm text-muted-foreground">تنبيه عند انتهاء صلاحية العقود</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Switch defaultChecked />
                  <div className="text-right">
                    <Label>إشعارات الصيانة المجدولة</Label>
                    <p className="text-sm text-muted-foreground">تنبيه قبل موعد الصيانة المجدولة</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Switch defaultChecked />
                  <div className="text-right">
                    <Label>إشعارات المدفوعات المتأخرة</Label>
                    <p className="text-sm text-muted-foreground">تنبيه عند تأخر المدفوعات</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Switch />
                  <div className="text-right">
                    <Label>إشعارات العملاء الجدد</Label>
                    <p className="text-sm text-muted-foreground">تنبيه عند تسجيل عميل جديد</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Switch defaultChecked />
                  <div className="text-right">
                    <Label>إشعارات انتهاء التأمين</Label>
                    <p className="text-sm text-muted-foreground">تنبيه قبل انتهاء تأمين المركبات</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                   <Switch 
                     checked={systemSettings.attendanceEnabled}
                     onCheckedChange={(checked) => handleSystemSettingChange('attendanceEnabled', checked)}
                   />
                  <div className="text-right">
                    <Label>تفعيل نظام الحضور والغياب</Label>
                    <p className="text-sm text-muted-foreground">إظهار أو إخفاء تبويبة الحضور والغياب من القائمة الرئيسية</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
};

export default Settings;