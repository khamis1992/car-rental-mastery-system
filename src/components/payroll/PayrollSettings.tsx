import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save } from 'lucide-react';

export const PayrollSettings = () => {
  const [settings, setSettings] = useState({
    tax_rate: 5.0,
    social_insurance_rate: 6.0,
    overtime_multiplier: 1.5,
    working_hours_per_day: 8,
    working_days_per_month: 22,
    auto_generate_journal_entries: true,
    payroll_approval_required: false,
    auto_post_entries: false,
  });
  
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // في المستقبل سنربطها بقاعدة البيانات
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات الرواتب بنجاح"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حفظ الإعدادات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">إعدادات الرواتب العامة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tax_rate" className="rtl-label">معدل الضريبة (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.1"
                value={settings.tax_rate}
                onChange={(e) => setSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="social_insurance_rate" className="rtl-label">معدل التأمين الاجتماعي (%)</Label>
              <Input
                id="social_insurance_rate"
                type="number"
                step="0.1"
                value={settings.social_insurance_rate}
                onChange={(e) => setSettings(prev => ({ ...prev, social_insurance_rate: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overtime_multiplier" className="rtl-label">مضاعف ساعات العمل الإضافي</Label>
              <Input
                id="overtime_multiplier"
                type="number"
                step="0.1"
                value={settings.overtime_multiplier}
                onChange={(e) => setSettings(prev => ({ ...prev, overtime_multiplier: parseFloat(e.target.value) || 1 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="working_hours_per_day" className="rtl-label">ساعات العمل اليومية</Label>
              <Input
                id="working_hours_per_day"
                type="number"
                value={settings.working_hours_per_day}
                onChange={(e) => setSettings(prev => ({ ...prev, working_hours_per_day: parseInt(e.target.value) || 8 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="working_days_per_month" className="rtl-label">أيام العمل الشهرية</Label>
              <Input
                id="working_days_per_month"
                type="number"
                value={settings.working_days_per_month}
                onChange={(e) => setSettings(prev => ({ ...prev, working_days_per_month: parseInt(e.target.value) || 22 }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>إنشاء القيود المحاسبية تلقائياً</Label>
                <p className="text-sm text-muted-foreground">
                  سيتم إنشاء القيود المحاسبية عند حساب الرواتب
                </p>
              </div>
              <Switch
                checked={settings.auto_generate_journal_entries}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_generate_journal_entries: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>مطالبة بموافقة الرواتب</Label>
                <p className="text-sm text-muted-foreground">
                  تتطلب موافقة المدير قبل صرف الرواتب
                </p>
              </div>
              <Switch
                checked={settings.payroll_approval_required}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, payroll_approval_required: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>ترحيل القيود تلقائياً</Label>
                <p className="text-sm text-muted-foreground">
                  ترحيل القيود المحاسبية مباشرة دون مراجعة
                </p>
              </div>
              <Switch
                checked={settings.auto_post_entries}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, auto_post_entries: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="rtl-title">معلومات النظام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">حالة النظام المحاسبي</h4>
              <p className="text-sm text-blue-700">
                تم تفعيل الربط المحاسبي للرواتب. سيتم إنشاء القيود تلقائياً عند معالجة الرواتب.
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">الدوال المتاحة</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• حساب الرواتب مع الربط المحاسبي</li>
                <li>• إنشاء القيود المحاسبية التلقائية</li>
                <li>• قواعد الأتمتة للبدلات والخصومات</li>
                <li>• سير عمل الموافقات</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="rtl-flex">
          <Save className="h-4 w-4 ml-2" />
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  );
};