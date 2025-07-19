
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ChartOfAccountsSettings } from '@/types/chartOfAccounts';

export function ChartOfAccountsSettingsPage() {
  const [settings, setSettings] = useState<ChartOfAccountsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chart_of_accounts_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data as ChartOfAccountsSettings);
      } else {
        // إنشاء إعدادات افتراضية
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('حدث خطأ في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    try {
      const defaultSettings = {
        tenant_id: '00000000-0000-0000-0000-000000000000', // سيتم تحديده من RLS
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
      setSettings(data as ChartOfAccountsSettings);
    } catch (error) {
      console.error('Error creating default settings:', error);
      toast.error('حدث خطأ في إنشاء الإعدادات الافتراضية');
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('chart_of_accounts_settings')
        .update({
          max_account_levels: settings.max_account_levels,
          account_code_format: settings.account_code_format,
          auto_code_generation: settings.auto_code_generation,
          require_parent_for_level: settings.require_parent_for_level,
          level_naming: settings.level_naming,
          allow_posting_levels: settings.allow_posting_levels,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) throw error;
      toast.success('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('حدث خطأ في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">لا توجد إعدادات</h3>
          <p className="text-muted-foreground mb-4">حدث خطأ في تحميل إعدادات دليل الحسابات</p>
          <Button onClick={loadSettings}>
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold rtl-title">إعدادات دليل الحسابات</h1>
        <p className="text-muted-foreground mt-2">
          تخصيص إعدادات دليل الحسابات والمستويات المسموحة
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="rtl-title flex items-center gap-2">
            <Settings className="h-5 w-5" />
            الإعدادات العامة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-levels">الحد الأقصى لمستويات الحسابات</Label>
              <Input
                id="max-levels"
                type="number"
                min="1"
                max="10"
                value={settings.max_account_levels}
                onChange={(e) => setSettings({
                  ...settings,
                  max_account_levels: parseInt(e.target.value) || 5
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="separator">فاصل أرقام الحسابات</Label>
              <Input
                id="separator"
                value={settings.account_code_format.separator}
                onChange={(e) => setSettings({
                  ...settings,
                  account_code_format: {
                    ...settings.account_code_format,
                    separator: e.target.value
                  }
                })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              id="auto-generation"
              checked={settings.auto_code_generation}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                auto_code_generation: checked
              })}
            />
            <Label htmlFor="auto-generation">توليد أرقام الحسابات تلقائياً</Label>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-4 rtl-title">مستويات الحسابات</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].slice(0, settings.max_account_levels).map((level) => (
                <div key={level} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <Label htmlFor={`level-${level}-name`}>المستوى {level}</Label>
                    <Input
                      id={`level-${level}-name`}
                      value={settings.level_naming[`level_${level}` as keyof typeof settings.level_naming]}
                      onChange={(e) => setSettings({
                        ...settings,
                        level_naming: {
                          ...settings.level_naming,
                          [`level_${level}`]: e.target.value
                        }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-4 space-x-reverse mr-4">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id={`level-${level}-parent`}
                        checked={settings.require_parent_for_level[`level_${level}` as keyof typeof settings.require_parent_for_level]}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          require_parent_for_level: {
                            ...settings.require_parent_for_level,
                            [`level_${level}`]: checked
                          }
                        })}
                      />
                      <Label htmlFor={`level-${level}-parent`}>يتطلب حساب أب</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        id={`level-${level}-posting`}
                        checked={settings.allow_posting_levels[`level_${level}` as keyof typeof settings.allow_posting_levels]}
                        onCheckedChange={(checked) => setSettings({
                          ...settings,
                          allow_posting_levels: {
                            ...settings.allow_posting_levels,
                            [`level_${level}`]: checked
                          }
                        })}
                      />
                      <Label htmlFor={`level-${level}-posting`}>يسمح بالقيد عليه</Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button onClick={saveSettings} disabled={saving} className="min-w-32">
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 ml-2" />
                  حفظ الإعدادات
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
