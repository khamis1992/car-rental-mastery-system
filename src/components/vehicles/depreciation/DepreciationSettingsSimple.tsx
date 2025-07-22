import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Settings } from "lucide-react";

interface DepreciationSettings {
  auto_calculate_monthly: boolean;
  auto_post_entries: boolean;
  depreciation_day_of_month: number;
  default_useful_life_years: number;
  default_residual_rate: number;
  notification_before_days: number;
}

export function DepreciationSettingsSimple() {
  const [settings, setSettings] = useState<DepreciationSettings>({
    auto_calculate_monthly: true,
    auto_post_entries: false,
    depreciation_day_of_month: 1,
    default_useful_life_years: 5,
    default_residual_rate: 10,
    notification_before_days: 7,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("تم حفظ الإعدادات بنجاح");
      setIsLoading(false);
    }, 1000);
  };

  const updateSetting = (key: keyof DepreciationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">إعدادات النظام</h3>
          <p className="text-sm text-muted-foreground">
            تكوين الإعدادات العامة لنظام استهلاك المركبات
          </p>
        </div>

        <Button onClick={handleSaveSettings} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              الإعدادات العامة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>حساب الاستهلاك التلقائي</Label>
                <p className="text-sm text-muted-foreground">
                  تفعيل حساب الاستهلاك الشهري تلقائياً
                </p>
              </div>
              <Switch
                checked={settings.auto_calculate_monthly}
                onCheckedChange={(checked) => updateSetting('auto_calculate_monthly', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>ترحيل القيود التلقائي</Label>
                <p className="text-sm text-muted-foreground">
                  ترحيل قيود الاستهلاك تلقائياً للدفاتر المحاسبية
                </p>
              </div>
              <Switch
                checked={settings.auto_post_entries}
                onCheckedChange={(checked) => updateSetting('auto_post_entries', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label>يوم حساب الاستهلاك من الشهر</Label>
              <Select 
                value={settings.depreciation_day_of_month.toString()} 
                onValueChange={(value) => updateSetting('depreciation_day_of_month', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>
                      اليوم {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                اليوم المحدد من كل شهر لحساب الاستهلاك
              </p>
            </div>

            <div className="space-y-2">
              <Label>أيام التنبيه المسبق</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={settings.notification_before_days}
                onChange={(e) => updateSetting('notification_before_days', parseInt(e.target.value) || 7)}
              />
              <p className="text-sm text-muted-foreground">
                عدد الأيام لإرسال تنبيه قبل موعد حساب الاستهلاك
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Default Values */}
        <Card>
          <CardHeader>
            <CardTitle>القيم الافتراضية</CardTitle>
            <CardDescription>
              القيم الافتراضية المستخدمة عند إضافة مركبات جديدة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>العمر الافتراضي (بالسنوات)</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={settings.default_useful_life_years}
                onChange={(e) => updateSetting('default_useful_life_years', parseInt(e.target.value) || 5)}
              />
              <p className="text-sm text-muted-foreground">
                العمر الافتراضي للمركبات الجديدة
              </p>
            </div>

            <div className="space-y-2">
              <Label>نسبة القيمة المتبقية (%)</Label>
              <Input
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={settings.default_residual_rate}
                onChange={(e) => updateSetting('default_residual_rate', parseFloat(e.target.value) || 10)}
              />
              <p className="text-sm text-muted-foreground">
                النسبة المئوية للقيمة المتبقية في نهاية العمر الافتراضي
              </p>
            </div>

            {/* Preview Calculation */}
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">مثال للحساب</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>سعر الشراء:</span>
                  <span>15,000 د.ك</span>
                </div>
                <div className="flex justify-between">
                  <span>القيمة المتبقية ({settings.default_residual_rate}%):</span>
                  <span>{(15000 * settings.default_residual_rate / 100).toLocaleString()} د.ك</span>
                </div>
                <div className="flex justify-between">
                  <span>قابل للاستهلاك:</span>
                  <span>{(15000 - (15000 * settings.default_residual_rate / 100)).toLocaleString()} د.ك</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>الاستهلاك الشهري:</span>
                  <span>{((15000 - (15000 * settings.default_residual_rate / 100)) / (settings.default_useful_life_years * 12)).toLocaleString()} د.ك</span>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <Label className="text-muted-foreground">آخر تحديث للإعدادات</Label>
              <p className="font-medium">لم يتم التحديث بعد</p>
            </div>
            <div>
              <Label className="text-muted-foreground">طريقة الاستهلاك</Label>
              <p className="font-medium">الخط المستقيم</p>
            </div>
            <div>
              <Label className="text-muted-foreground">العملة المستخدمة</Label>
              <p className="font-medium">الدينار الكويتي (د.ك)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}