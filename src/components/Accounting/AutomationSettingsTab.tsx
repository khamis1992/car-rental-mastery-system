import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Bell, Calendar, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AutomationDashboard } from './AutomationDashboard';
import { AccountingDataRefresh } from './AccountingDataRefresh';
import { useToast } from '@/hooks/use-toast';

interface AutomationSettings {
  enabled: boolean;
  balanceUpdateFrequency: string;
  cleanupFrequency: string;
  reportGeneration: boolean;
  alertThresholds: {
    unbalancedEntries: number;
    missingPayments: number;
    duplicateAccounts: number;
  };
  notifications: {
    email: boolean;
    dashboard: boolean;
    webhooks: boolean;
  };
  maintenanceWindow: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export const AutomationSettingsTab = () => {
  const [settings, setSettings] = useState<AutomationSettings>({
    enabled: false,
    balanceUpdateFrequency: 'daily',
    cleanupFrequency: 'weekly',
    reportGeneration: true,
    alertThresholds: {
      unbalancedEntries: 5,
      missingPayments: 10,
      duplicateAccounts: 3
    },
    notifications: {
      email: true,
      dashboard: true,
      webhooks: false
    },
    maintenanceWindow: {
      enabled: true,
      startTime: '02:00',
      endTime: '04:00'
    }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'manual'>('dashboard');
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    // تحميل الإعدادات من localStorage أو API
    const savedSettings = localStorage.getItem('automation-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading automation settings:', error);
      }
    }
  };

  const saveSettings = () => {
    try {
      localStorage.setItem('automation-settings', JSON.stringify(settings));
      toast({
        title: 'تم حفظ الإعدادات',
        description: 'تم حفظ إعدادات الأتمتة بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ في الحفظ',
        description: 'فشل في حفظ الإعدادات',
        variant: 'destructive',
      });
    }
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current: any = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'hourly': return 'كل ساعة';
      case 'daily': return 'يومياً';
      case 'weekly': return 'أسبوعياً';
      case 'monthly': return 'شهرياً';
      default: return frequency;
    }
  };

  return (
    <div className="space-y-6">
      {/* التبويبات */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('dashboard')}
          className="rtl-flex"
        >
          <RefreshCw className="w-4 h-4" />
          لوحة التحكم التلقائية
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('settings')}
          className="rtl-flex"
        >
          <Settings className="w-4 h-4" />
          إعدادات الأتمتة
        </Button>
        <Button
          variant={activeTab === 'manual' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('manual')}
          className="rtl-flex"
        >
          <Zap className="w-4 h-4" />
          العمليات اليدوية
        </Button>
      </div>

      {/* لوحة التحكم التلقائية */}
      {activeTab === 'dashboard' && <AutomationDashboard />}

      {/* إعدادات الأتمتة */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* الإعدادات العامة */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <Settings className="w-5 h-5" />
                الإعدادات العامة للأتمتة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* تفعيل النظام */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">تفعيل نظام الأتمتة</Label>
                  <p className="text-sm text-muted-foreground">
                    تشغيل جميع العمليات التلقائية للمحاسبة
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => updateSetting('enabled', checked)}
                />
              </div>

              {/* تكرار تحديث الأرصدة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="balance-frequency">تكرار تحديث الأرصدة</Label>
                  <Select 
                    value={settings.balanceUpdateFrequency} 
                    onValueChange={(value) => updateSetting('balanceUpdateFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">كل ساعة</SelectItem>
                      <SelectItem value="daily">يومياً</SelectItem>
                      <SelectItem value="weekly">أسبوعياً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cleanup-frequency">تكرار تنظيف البيانات</Label>
                  <Select 
                    value={settings.cleanupFrequency} 
                    onValueChange={(value) => updateSetting('cleanupFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">يومياً</SelectItem>
                      <SelectItem value="weekly">أسبوعياً</SelectItem>
                      <SelectItem value="monthly">شهرياً</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* إنشاء التقارير التلقائية */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">إنشاء التقارير التلقائية</Label>
                  <p className="text-sm text-muted-foreground">
                    إنشاء التقارير المالية تلقائياً في نهاية كل فترة
                  </p>
                </div>
                <Switch
                  checked={settings.reportGeneration}
                  onCheckedChange={(checked) => updateSetting('reportGeneration', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* حدود التنبيهات */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <Bell className="w-5 h-5" />
                حدود التنبيهات التلقائية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="unbalanced-threshold">القيود غير المتوازنة</Label>
                  <Input
                    id="unbalanced-threshold"
                    type="number"
                    value={settings.alertThresholds.unbalancedEntries}
                    onChange={(e) => updateSetting('alertThresholds.unbalancedEntries', parseInt(e.target.value))}
                    placeholder="5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    عدد القيود غير المتوازنة لإرسال تنبيه
                  </p>
                </div>

                <div>
                  <Label htmlFor="missing-payments-threshold">المدفوعات المفقودة</Label>
                  <Input
                    id="missing-payments-threshold"
                    type="number"
                    value={settings.alertThresholds.missingPayments}
                    onChange={(e) => updateSetting('alertThresholds.missingPayments', parseInt(e.target.value))}
                    placeholder="10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    عدد المدفوعات المفقودة لإرسال تنبيه
                  </p>
                </div>

                <div>
                  <Label htmlFor="duplicate-accounts-threshold">الحسابات المكررة</Label>
                  <Input
                    id="duplicate-accounts-threshold"
                    type="number"
                    value={settings.alertThresholds.duplicateAccounts}
                    onChange={(e) => updateSetting('alertThresholds.duplicateAccounts', parseInt(e.target.value))}
                    placeholder="3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    عدد الحسابات المكررة لإرسال تنبيه
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* إعدادات الإشعارات */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <Bell className="w-5 h-5" />
                إعدادات الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">إشعارات اللوحة</Label>
                  <p className="text-sm text-muted-foreground">
                    عرض الإشعارات في لوحة التحكم
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.dashboard}
                  onCheckedChange={(checked) => updateSetting('notifications.dashboard', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">إشعارات البريد الإلكتروني</Label>
                  <p className="text-sm text-muted-foreground">
                    إرسال تنبيهات عبر البريد الإلكتروني
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => updateSetting('notifications.email', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Webhooks</Label>
                  <p className="text-sm text-muted-foreground">
                    إرسال إشعارات إلى أنظمة خارجية
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.webhooks}
                  onCheckedChange={(checked) => updateSetting('notifications.webhooks', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* نافذة الصيانة */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                نافذة الصيانة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">تفعيل نافذة الصيانة</Label>
                  <p className="text-sm text-muted-foreground">
                    تحديد أوقات محددة لتشغيل المهام الثقيلة
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceWindow.enabled}
                  onCheckedChange={(checked) => updateSetting('maintenanceWindow.enabled', checked)}
                />
              </div>

              {settings.maintenanceWindow.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">وقت البداية</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={settings.maintenanceWindow.startTime}
                      onChange={(e) => updateSetting('maintenanceWindow.startTime', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="end-time">وقت النهاية</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={settings.maintenanceWindow.endTime}
                      onChange={(e) => updateSetting('maintenanceWindow.endTime', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* زر الحفظ */}
          <div className="flex justify-end">
            <Button onClick={saveSettings} className="rtl-flex">
              <Save className="w-4 h-4" />
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      )}

      {/* العمليات اليدوية */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="rtl-title flex items-center gap-2">
                <Zap className="w-5 h-5" />
                العمليات اليدوية والطوارئ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                يمكنك استخدام هذه الأدوات عند الحاجة لتشغيل عمليات محددة يدوياً أو في حالات الطوارئ.
              </p>
              <AccountingDataRefresh />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};