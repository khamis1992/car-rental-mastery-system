import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RotateCcw, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AccountSettings {
  id: string;
  tenant_id: string;
  max_account_levels: number;
  account_code_format: any;
  auto_code_generation: boolean;
  require_parent_for_level: any;
  level_naming: any;
  allow_posting_levels: any;
  is_active: boolean;
}

export const ChartOfAccountsSettings: React.FC = () => {
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // إنشاء إعدادات افتراضية
        await createDefaultSettings();
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل إعدادات دليل الحسابات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    const defaultSettings = {
      max_account_levels: 5,
      account_code_format: {
        pattern: 'hierarchical',
        separator: '.',
        length_per_level: [2, 2, 2, 2, 2]
      },
      auto_code_generation: true,
      require_parent_for_level: {
        level_1: false,
        level_2: true,
        level_3: true,
        level_4: true,
        level_5: true
      },
      level_naming: {
        level_1: 'حساب رئيسي',
        level_2: 'حساب فرعي',
        level_3: 'حساب تفصيلي',
        level_4: 'حساب فرعي متقدم',
        level_5: 'حساب نهائي'
      },
      allow_posting_levels: {
        level_1: false,
        level_2: false,
        level_3: true,
        level_4: true,
        level_5: true
      },
      is_active: true
    };

    const { data, error } = await supabase
      .from('chart_of_accounts_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) throw error;
    setSettings(data);
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('chart_of_accounts_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: 'تم بنجاح',
        description: 'تم حفظ إعدادات دليل الحسابات بنجاح',
      });
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الإعدادات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!settings) return;

    const defaultSettings = {
      ...settings,
      max_account_levels: 5,
      account_code_format: {
        pattern: 'hierarchical',
        separator: '.',
        length_per_level: [2, 2, 2, 2, 2]
      },
      auto_code_generation: true,
      require_parent_for_level: {
        level_1: false,
        level_2: true,
        level_3: true,
        level_4: true,
        level_5: true
      },
      level_naming: {
        level_1: 'حساب رئيسي',
        level_2: 'حساب فرعي',
        level_3: 'حساب تفصيلي',
        level_4: 'حساب فرعي متقدم',
        level_5: 'حساب نهائي'
      },
      allow_posting_levels: {
        level_1: false,
        level_2: false,
        level_3: true,
        level_4: true,
        level_5: true
      }
    };

    setSettings(defaultSettings);
  };

  const updateSettings = (key: string, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const updateNestedSettings = (parentKey: string, childKey: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [parentKey]: {
        ...settings[parentKey as keyof AccountSettings] as any,
        [childKey]: value
      }
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Settings className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>جاري تحميل الإعدادات...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <p>لم يتم العثور على إعدادات دليل الحسابات</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              إعدادات دليل الحسابات
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetToDefaults}>
                <RotateCcw className="w-4 h-4 ml-2" />
                إعادة تعيين
              </Button>
              <Button onClick={saveSettings} disabled={saving}>
                <Save className="w-4 h-4 ml-2" />
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* إعدادات عامة */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">الإعدادات العامة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max-levels">الحد الأقصى لمستويات الحسابات</Label>
                <Select
                  value={settings.max_account_levels.toString()}
                  onValueChange={(value) => updateSettings('max_account_levels', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 مستويات</SelectItem>
                    <SelectItem value="4">4 مستويات</SelectItem>
                    <SelectItem value="5">5 مستويات</SelectItem>
                    <SelectItem value="6">6 مستويات</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="auto-generation"
                  checked={settings.auto_code_generation}
                  onCheckedChange={(checked) => updateSettings('auto_code_generation', checked)}
                />
                <Label htmlFor="auto-generation">توليد أرقام الحسابات تلقائياً</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* تنسيق رقم الحساب */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">تنسيق رقم الحساب</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>نمط الترقيم</Label>
                <Select
                  value={settings.account_code_format?.pattern || 'hierarchical'}
                  onValueChange={(value) => updateNestedSettings('account_code_format', 'pattern', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hierarchical">هرمي</SelectItem>
                    <SelectItem value="sequential">تسلسلي</SelectItem>
                    <SelectItem value="custom">مخصص</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="separator">الفاصل</Label>
                <Input
                  id="separator"
                  value={settings.account_code_format?.separator || '.'}
                  onChange={(e) => updateNestedSettings('account_code_format', 'separator', e.target.value)}
                  placeholder="."
                  maxLength={1}
                />
              </div>

              <div>
                <Label>مثال على التنسيق</Label>
                <div className="p-2 bg-muted rounded-md">
                  <code className="text-sm">
                    {settings.account_code_format?.pattern === 'hierarchical' 
                      ? `01${settings.account_code_format?.separator || '.'}01${settings.account_code_format?.separator || '.'}01`
                      : '001002003'
                    }
                  </code>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* تسمية المستويات */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">تسمية المستويات</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: settings.max_account_levels }, (_, i) => (
                <div key={i}>
                  <Label htmlFor={`level-${i + 1}`}>المستوى {i + 1}</Label>
                  <Input
                    id={`level-${i + 1}`}
                    value={settings.level_naming?.[`level_${i + 1}`] || ''}
                    onChange={(e) => updateNestedSettings('level_naming', `level_${i + 1}`, e.target.value)}
                    placeholder={`اسم المستوى ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* قواعد المستويات */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">قواعد المستويات</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">المستويات المسموح بالترحيل إليها</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Array.from({ length: settings.max_account_levels }, (_, i) => (
                    <div key={i} className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id={`posting-${i + 1}`}
                        checked={settings.allow_posting_levels?.[`level_${i + 1}`] || false}
                        onCheckedChange={(checked) => 
                          updateNestedSettings('allow_posting_levels', `level_${i + 1}`, checked)
                        }
                      />
                      <Label htmlFor={`posting-${i + 1}`} className="text-sm">
                        المستوى {i + 1}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">المستويات التي تتطلب حساب أب</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Array.from({ length: settings.max_account_levels }, (_, i) => (
                    <div key={i} className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id={`parent-${i + 1}`}
                        checked={settings.require_parent_for_level?.[`level_${i + 1}`] || false}
                        onCheckedChange={(checked) => 
                          updateNestedSettings('require_parent_for_level', `level_${i + 1}`, checked)
                        }
                        disabled={i === 0} // المستوى الأول لا يحتاج لحساب أب
                      />
                      <Label htmlFor={`parent-${i + 1}`} className="text-sm">
                        المستوى {i + 1}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* معلومات إضافية */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">ملاحظات مهمة:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>تغيير هذه الإعدادات قد يؤثر على الحسابات الموجودة</li>
                  <li>يُنصح بعمل نسخة احتياطية قبل تطبيق التغييرات</li>
                  <li>المستوى الأول لا يحتاج إلى حساب أب دائماً</li>
                  <li>الحسابات التي لا تسمح بالترحيل تُستخدم للتجميع فقط</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};