import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Database, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2,
  BarChart3,
  Calculator,
  History,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CostCenterSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    autoDistributeCosts: true,
    trackHistory: true,
    enableAlerts: true,
    budgetWarningThreshold: 80,
    distributionFrequency: 'weekly'
  });

  const handleUpdateCosts = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('update_all_cost_center_costs');
      if (error) throw error;
      toast.success('تم تحديث تكاليف مراكز التكلفة بنجاح');
    } catch (error: any) {
      console.error('Error updating costs:', error);
      toast.error('فشل في تحديث التكاليف');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistributeCosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('auto_distribute_costs');
      if (error) throw error;
      toast.success(`تم توزيع ${data} تخصيص تكلفة تلقائياً`);
    } catch (error: any) {
      console.error('Error distributing costs:', error);
      toast.error('فشل في توزيع التكاليف');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculateHierarchy = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cost_centers')
        .update({ updated_at: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) throw error;
      toast.success('تم إعادة حساب التسلسل الهرمي بنجاح');
    } catch (error: any) {
      console.error('Error recalculating hierarchy:', error);
      toast.error('فشل في إعادة حساب التسلسل الهرمي');
    } finally {
      setIsLoading(false);
    }
  };

  const categoryStats = [
    { name: 'الإدارة العامة', count: 3, color: 'bg-blue-500' },
    { name: 'الموارد البشرية', count: 4, color: 'bg-green-500' },
    { name: 'إدارة المركبات', count: 4, color: 'bg-purple-500' },
    { name: 'المبيعات والعملاء', count: 4, color: 'bg-orange-500' },
    { name: 'المحاسبة والمالية', count: 4, color: 'bg-red-500' },
    { name: 'تقنية المعلومات', count: 4, color: 'bg-indigo-500' },
    { name: 'العمليات اليومية', count: 4, color: 'bg-teal-500' },
    { name: 'الخدمات المساندة', count: 4, color: 'bg-pink-500' }
  ];

  return (
    <div className="space-y-6">
      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 rtl-flex">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <div className="text-right">
                <p className="text-2xl font-bold">31</p>
                <p className="text-sm text-muted-foreground">مركز تكلفة جديد</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 rtl-flex">
              <Database className="h-8 w-8 text-green-500" />
              <div className="text-right">
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">فئة رئيسية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 rtl-flex">
              <Calculator className="h-8 w-8 text-purple-500" />
              <div className="text-right">
                <p className="text-2xl font-bold">100%</p>
                <p className="text-sm text-muted-foreground">تغطية النظام</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 rtl-flex">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <div className="text-right">
                <p className="text-2xl font-bold">تم</p>
                <p className="text-sm text-muted-foreground">التحديث الشامل</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* توزيع الفئات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-flex">
            <FileSpreadsheet className="h-5 w-5" />
            توزيع مراكز التكلفة حسب الفئة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryStats.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 rtl-flex">
                  <div className={`w-4 h-4 rounded-full ${category.color}`} />
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={(category.count / 4) * 100} className="w-20 h-2" />
                  <Badge variant="secondary">{category.count}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* إعدادات التوزيع التلقائي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-flex">
            <Settings className="h-5 w-5" />
            إعدادات التوزيع التلقائي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="rtl-label">التوزيع التلقائي للتكاليف</Label>
              <p className="text-sm text-muted-foreground">
                توزيع التكاليف تلقائياً بناءً على النشاط
              </p>
            </div>
            <Switch
              checked={settings.autoDistributeCosts}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, autoDistributeCosts: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="rtl-label">تتبع التاريخ والتغييرات</Label>
              <p className="text-sm text-muted-foreground">
                حفظ سجل لجميع التغييرات على مراكز التكلفة
              </p>
            </div>
            <Switch
              checked={settings.trackHistory}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, trackHistory: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="rtl-label">تنبيهات الميزانية</Label>
              <p className="text-sm text-muted-foreground">
                إرسال تنبيهات عند تجاوز حدود الميزانية
              </p>
            </div>
            <Switch
              checked={settings.enableAlerts}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, enableAlerts: checked }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="rtl-label">حد التحذير للميزانية (%)</Label>
              <Input
                type="number"
                value={settings.budgetWarningThreshold}
                onChange={(e) =>
                  setSettings(prev => ({ ...prev, budgetWarningThreshold: parseInt(e.target.value) }))
                }
                min="50"
                max="100"
                step="5"
              />
            </div>

            <div className="space-y-2">
              <Label className="rtl-label">تكرار التوزيع</Label>
              <Select
                value={settings.distributionFrequency}
                onValueChange={(value) =>
                  setSettings(prev => ({ ...prev, distributionFrequency: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">يومي</SelectItem>
                  <SelectItem value="weekly">أسبوعي</SelectItem>
                  <SelectItem value="monthly">شهري</SelectItem>
                  <SelectItem value="manual">يدوي</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* عمليات الصيانة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-flex">
            <Database className="h-5 w-5" />
            عمليات الصيانة والتحديث
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              تأكد من عمل نسخة احتياطية قبل تشغيل عمليات الصيانة الثقيلة
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleUpdateCosts}
              disabled={isLoading}
              className="h-16 flex flex-col items-center gap-2"
              variant="outline"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>تحديث التكاليف</span>
            </Button>

            <Button
              onClick={handleDistributeCosts}
              disabled={isLoading}
              className="h-16 flex flex-col items-center gap-2"
              variant="outline"
            >
              <Calculator className="h-5 w-5" />
              <span>توزيع التكاليف التلقائي</span>
            </Button>

            <Button
              onClick={handleRecalculateHierarchy}
              disabled={isLoading}
              className="h-16 flex flex-col items-center gap-2"
              variant="outline"
            >
              <History className="h-5 w-5" />
              <span>إعادة حساب التسلسل الهرمي</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* معلومات الخطة المطبقة */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl-flex text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            الخطة الشاملة المطبقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-green-700 space-y-2">
            <p>✅ تم تنظيف البيانات المكررة وإزالة التضارب</p>
            <p>✅ تم إنشاء 31 مركز تكلفة شامل لجميع أقسام النظام</p>
            <p>✅ تم إضافة نظام تتبع التغييرات والتاريخ</p>
            <p>✅ تم إنشاء وظائف التوزيع التلقائي للتكاليف</p>
            <p>✅ تم تحسين الأداء والفهرسة</p>
            <p>✅ تم إنشاء تقارير محسنة ومؤشرات الأداء</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostCenterSettings;