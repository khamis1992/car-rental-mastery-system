import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings2, 
  RefreshCw, 
  Save, 
  AlertTriangle,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CostCenterSettingsService, type SettingGroup } from '@/services/BusinessServices/CostCenterSettingsService';
import { toast } from 'sonner';

const CostCenterSettings = () => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState<{ [key: string]: any }>({});
  const settingsService = new CostCenterSettingsService();
  const queryClient = useQueryClient();

  const { data: settingGroups, isLoading } = useQuery({
    queryKey: ['cost-center-settings'],
    queryFn: () => settingsService.getGroupedSettings()
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) => 
      settingsService.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-center-settings'] });
      toast.success('تم حفظ الإعدادات بنجاح');
      setHasUnsavedChanges(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في حفظ الإعدادات');
    }
  });

  const resetMutation = useMutation({
    mutationFn: () => settingsService.resetToDefaults(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-center-settings'] });
      toast.success('تم إعادة تعيين الإعدادات للقيم الافتراضية');
      setLocalSettings({});
      setHasUnsavedChanges(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'فشل في إعادة تعيين الإعدادات');
    }
  });

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const getSettingValue = (key: string, originalValue: any) => {
    if (key in localSettings) {
      return localSettings[key];
    }
    try {
      return typeof originalValue === 'string' ? JSON.parse(originalValue) : originalValue;
    } catch {
      return originalValue;
    }
  };

  const handleSaveAll = async () => {
    try {
      for (const [key, value] of Object.entries(localSettings)) {
        await updateSettingMutation.mutateAsync({ key, value });
      }
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const renderSettingInput = (setting: any) => {
    const value = getSettingValue(setting.setting_key, setting.setting_value);
    const key = setting.setting_key;

    switch (key) {
      case 'auto_allocation_enabled':
      case 'auto_budget_calculation':
      case 'require_approval_for_budget_changes':
      case 'enable_hierarchy':
      case 'enable_cost_center_reports':
        return (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => handleSettingChange(key, checked)}
          />
        );

      case 'budget_alert_threshold':
      case 'max_hierarchy_levels':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleSettingChange(key, parseInt(e.target.value) || 0)}
            className="w-24"
          />
        );

      case 'default_cost_center_type':
        return (
          <Select
            value={value || 'operational'}
            onValueChange={(val) => handleSettingChange(key, val)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operational">تشغيلي</SelectItem>
              <SelectItem value="administrative">إداري</SelectItem>
              <SelectItem value="revenue">إيراد</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'cost_update_frequency':
        return (
          <Select
            value={value || 'daily'}
            onValueChange={(val) => handleSettingChange(key, val)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">يومي</SelectItem>
              <SelectItem value="weekly">أسبوعي</SelectItem>
              <SelectItem value="monthly">شهري</SelectItem>
            </SelectContent>
          </Select>
        );

      case 'default_currency':
        return (
          <Select
            value={value || 'KWD'}
            onValueChange={(val) => handleSettingChange(key, val)}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KWD">د.ك</SelectItem>
              <SelectItem value="USD">$</SelectItem>
              <SelectItem value="EUR">€</SelectItem>
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleSettingChange(key, e.target.value)}
            className="w-40"
          />
        );
    }
  };

  const getSettingLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      'auto_allocation_enabled': 'التوزيع التلقائي للتكاليف',
      'default_cost_center_type': 'نوع مركز التكلفة الافتراضي',
      'budget_alert_threshold': 'عتبة تنبيه الميزانية (%)',
      'auto_budget_calculation': 'حساب الميزانية تلقائياً',
      'cost_update_frequency': 'تكرار تحديث التكاليف',
      'require_approval_for_budget_changes': 'طلب موافقة لتغيير الميزانية',
      'default_currency': 'العملة الافتراضية',
      'enable_hierarchy': 'تفعيل التسلسل الهرمي',
      'max_hierarchy_levels': 'أقصى مستويات هرمية',
      'enable_cost_center_reports': 'تفعيل تقارير مراكز التكلفة'
    };
    return labels[key] || key;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin ml-2" />
          جاري تحميل الإعدادات...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between rtl-flex">
        <div className="flex gap-2 rtl-flex">
          <Button
            onClick={() => resetMutation.mutate()}
            variant="outline"
            disabled={resetMutation.isPending}
            className="gap-2 rtl-flex"
          >
            <RotateCcw className="h-4 w-4" />
            إعادة تعيين افتراضي
          </Button>
          
          {hasUnsavedChanges && (
            <Button
              onClick={handleSaveAll}
              disabled={updateSettingMutation.isPending}
              className="gap-2 rtl-flex"
            >
              <Save className="h-4 w-4" />
              حفظ جميع التغييرات
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 rtl-flex">
          <Settings2 className="h-5 w-5" />
          <h2 className="text-xl font-semibold rtl-title">إعدادات مراكز التكلفة</h2>
          {hasUnsavedChanges && (
            <Badge variant="outline" className="gap-1 rtl-flex">
              <AlertTriangle className="h-3 w-3" />
              تغييرات غير محفوظة
            </Badge>
          )}
        </div>
      </div>

      {/* مجموعات الإعدادات */}
      <div className="grid gap-6">
        {settingGroups?.map((group: SettingGroup) => (
          <Card key={group.type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 rtl-flex">
                <CheckCircle className="h-5 w-5 text-primary" />
                {group.title}
              </CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {group.settings.map((setting, index) => (
                  <div key={setting.setting_key}>
                    <div className="flex items-center justify-between p-4 border rounded-lg rtl-flex">
                      <div className="flex-1">
                        <Label className="text-sm font-medium rtl-label">
                          {getSettingLabel(setting.setting_key)}
                        </Label>
                        {setting.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {setting.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {renderSettingInput(setting)}
                        {setting.requires_restart && (
                          <Badge variant="secondary" className="text-xs">
                            يتطلب إعادة تشغيل
                          </Badge>
                        )}
                      </div>
                    </div>
                    {index < group.settings.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CostCenterSettings;