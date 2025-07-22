import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Settings } from "lucide-react";

interface DepreciationSettings {
  id?: string;
  auto_calculate_monthly: boolean;
  auto_post_entries: boolean;
  depreciation_day_of_month: number;
  default_useful_life_years: number;
  default_residual_rate: number;
  notification_before_days: number;
}

export function DepreciationSettings() {
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState<DepreciationSettings>({
    auto_calculate_monthly: true,
    auto_post_entries: false,
    depreciation_day_of_month: 1,
    default_useful_life_years: 5,
    default_residual_rate: 10.00,
    notification_before_days: 7,
  });

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["depreciation-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("depreciation_settings")
        .select("*")
        .single();
      
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      
      return data;
    },
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (currentSettings) {
      setSettings({
        id: currentSettings.id,
        auto_calculate_monthly: currentSettings.auto_calculate_monthly,
        auto_post_entries: currentSettings.auto_post_entries,
        depreciation_day_of_month: currentSettings.depreciation_day_of_month,
        default_useful_life_years: currentSettings.default_useful_life_years,
        default_residual_rate: currentSettings.default_residual_rate,
        notification_before_days: currentSettings.notification_before_days,
      });
    }
  }, [currentSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: DepreciationSettings) => {
      if (settingsData.id) {
        // Update existing settings
        const { data, error } = await supabase
          .from("depreciation_settings")
          .update({
            auto_calculate_monthly: settingsData.auto_calculate_monthly,
            auto_post_entries: settingsData.auto_post_entries,
            depreciation_day_of_month: settingsData.depreciation_day_of_month,
            default_useful_life_years: settingsData.default_useful_life_years,
            default_residual_rate: settingsData.default_residual_rate,
            notification_before_days: settingsData.notification_before_days,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settingsData.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from("depreciation_settings")
          .insert([{
            auto_calculate_monthly: settingsData.auto_calculate_monthly,
            auto_post_entries: settingsData.auto_post_entries,
            depreciation_day_of_month: settingsData.depreciation_day_of_month,
            default_useful_life_years: settingsData.default_useful_life_years,
            default_residual_rate: settingsData.default_residual_rate,
            notification_before_days: settingsData.notification_before_days,
          }])
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات بنجاح");
      queryClient.invalidateQueries({ queryKey: ["depreciation-settings"] });
    },
    onError: (error) => {
      toast.error("خطأ في حفظ الإعدادات: " + error.message);
    },
  });

  const handleSaveSettings = () => {
    // Validate settings
    if (settings.depreciation_day_of_month < 1 || settings.depreciation_day_of_month > 28) {
      toast.error("يوم الاستهلاك يجب أن يكون بين 1 و 28");
      return;
    }
    
    if (settings.default_useful_life_years < 1) {
      toast.error("العمر الافتراضي يجب أن يكون أكبر من صفر");
      return;
    }
    
    if (settings.default_residual_rate < 0 || settings.default_residual_rate > 100) {
      toast.error("نسبة القيمة المتبقية يجب أن تكون بين 0 و 100");
      return;
    }

    saveSettingsMutation.mutate(settings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div>جارٍ تحميل الإعدادات...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-lg font-semibold">إعدادات الاستهلاك</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الأتمتة</CardTitle>
            <CardDescription>
              تكوين العمليات التلقائية للاستهلاك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-calculate">حساب تلقائي شهري</Label>
                <div className="text-sm text-muted-foreground">
                  حساب الاستهلاك تلقائياً كل شهر
                </div>
              </div>
              <Switch
                id="auto-calculate"
                checked={settings.auto_calculate_monthly}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, auto_calculate_monthly: checked }))
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-post">ترحيل تلقائي للقيود</Label>
                <div className="text-sm text-muted-foreground">
                  ترحيل قيود الاستهلاك تلقائياً
                </div>
              </div>
              <Switch
                id="auto-post"
                checked={settings.auto_post_entries}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, auto_post_entries: checked }))
                }
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="depreciation-day">يوم الاستهلاك الشهري</Label>
              <Input
                id="depreciation-day"
                type="number"
                min="1"
                max="28"
                value={settings.depreciation_day_of_month}
                onChange={(e) =>
                  setSettings(prev => ({ 
                    ...prev, 
                    depreciation_day_of_month: parseInt(e.target.value) || 1 
                  }))
                }
              />
              <div className="text-sm text-muted-foreground">
                اليوم من الشهر الذي سيتم فيه حساب الاستهلاك (1-28)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Values */}
        <Card>
          <CardHeader>
            <CardTitle>القيم الافتراضية</CardTitle>
            <CardDescription>
              إعدادات افتراضية للمركبات الجديدة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="useful-life">العمر الافتراضي (سنوات)</Label>
              <Input
                id="useful-life"
                type="number"
                min="1"
                max="50"
                value={settings.default_useful_life_years}
                onChange={(e) =>
                  setSettings(prev => ({ 
                    ...prev, 
                    default_useful_life_years: parseInt(e.target.value) || 5 
                  }))
                }
              />
              <div className="text-sm text-muted-foreground">
                العمر الافتراضي للمركبات الجديدة
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="residual-rate">نسبة القيمة المتبقية (%)</Label>
              <Input
                id="residual-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={settings.default_residual_rate}
                onChange={(e) =>
                  setSettings(prev => ({ 
                    ...prev, 
                    default_residual_rate: parseFloat(e.target.value) || 10.00 
                  }))
                }
              />
              <div className="text-sm text-muted-foreground">
                النسبة المئوية للقيمة المتبقية من تكلفة المركبة
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-days">أيام التنبيه المسبق</Label>
              <Input
                id="notification-days"
                type="number"
                min="1"
                max="30"
                value={settings.notification_before_days}
                onChange={(e) =>
                  setSettings(prev => ({ 
                    ...prev, 
                    notification_before_days: parseInt(e.target.value) || 7 
                  }))
                }
              />
              <div className="text-sm text-muted-foreground">
                عدد الأيام قبل موعد الاستهلاك للتنبيه
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={saveSettingsMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          حفظ الإعدادات
        </Button>
      </div>
    </div>
  );
}