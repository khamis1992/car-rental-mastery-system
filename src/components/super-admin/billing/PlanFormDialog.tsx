import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { SubscriptionPlan, PlanFormData } from '@/types/unified-saas';

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: SubscriptionPlan | null;
  onSuccess: () => void;
}

export function PlanFormDialog({ open, onOpenChange, plan, onSuccess }: PlanFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState<PlanFormData>({
    plan_name: '',
    plan_name_en: '',
    plan_code: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    features: [],
    max_tenants: undefined,
    max_users_per_tenant: undefined,
    max_vehicles: undefined,
    max_contracts: undefined,
    storage_limit_gb: undefined,
    is_popular: false,
    sort_order: 1,
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        plan_name: plan.plan_name,
        plan_name_en: plan.plan_name_en || '',
        plan_code: plan.plan_code,
        description: plan.description || '',
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        features: plan.features || [],
        max_tenants: plan.max_tenants || undefined,
        max_users_per_tenant: plan.max_users_per_tenant || undefined,
        max_vehicles: plan.max_vehicles || undefined,
        max_contracts: plan.max_contracts || undefined,
        storage_limit_gb: plan.storage_limit_gb || undefined,
        is_popular: plan.is_popular,
        sort_order: plan.sort_order,
      });
    } else {
      // إعادة تعيين النموذج للإنشاء الجديد
      setFormData({
        plan_name: '',
        plan_name_en: '',
        plan_code: '',
        description: '',
        price_monthly: 0,
        price_yearly: 0,
        features: [],
        max_tenants: undefined,
        max_users_per_tenant: undefined,
        max_vehicles: undefined,
        max_contracts: undefined,
        storage_limit_gb: undefined,
        is_popular: false,
        sort_order: 1,
      });
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        // تأكد من أن القيم الفارغة تكون null بدلاً من undefined
        max_tenants: formData.max_tenants || null,
        max_users_per_tenant: formData.max_users_per_tenant || null,
        max_vehicles: formData.max_vehicles || null,
        max_contracts: formData.max_contracts || null,
        storage_limit_gb: formData.storage_limit_gb || null,
      };

      if (plan) {
        // تحديث الخطة
        const { error } = await supabase
          .from('subscription_plans')
          .update(submitData)
          .eq('id', plan.id);

        if (error) throw error;

        toast({
          title: "تم تحديث الخطة بنجاح",
          variant: "default",
        });
      } else {
        // إنشاء خطة جديدة
        const { error } = await supabase
          .from('subscription_plans')
          .insert([submitData]);

        if (error) throw error;

        toast({
          title: "تم إنشاء الخطة بنجاح",
          variant: "default",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: plan ? "خطأ في تحديث الخطة" : "خطأ في إنشاء الخطة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (field: keyof PlanFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="rtl-title">
            {plan ? 'تعديل خطة الاشتراك' : 'إضافة خطة اشتراك جديدة'}
          </DialogTitle>
          <DialogDescription>
            {plan ? 'قم بتعديل بيانات خطة الاشتراك. تأكد من صحة جميع البيانات قبل الحفظ.' : 'أدخل بيانات خطة الاشتراك الجديدة. تأكد من تحديد الأسعار والمميزات بدقة.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan_name" className="rtl-label">اسم الخطة (عربي) *</Label>
              <Input
                id="plan_name"
                value={formData.plan_name}
                onChange={(e) => handleInputChange('plan_name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan_name_en" className="rtl-label">اسم الخطة (انجليزي)</Label>
              <Input
                id="plan_name_en"
                value={formData.plan_name_en}
                onChange={(e) => handleInputChange('plan_name_en', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan_code" className="rtl-label">كود الخطة *</Label>
              <Input
                id="plan_code"
                value={formData.plan_code}
                onChange={(e) => handleInputChange('plan_code', e.target.value)}
                required
                placeholder="basic, professional, enterprise"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order" className="rtl-label">ترتيب العرض</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => handleInputChange('sort_order', parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="rtl-label">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_monthly" className="rtl-label">السعر الشهري (د.ك) *</Label>
              <Input
                id="price_monthly"
                type="number"
                step="0.01"
                value={formData.price_monthly}
                onChange={(e) => handleInputChange('price_monthly', parseFloat(e.target.value) || 0)}
                required
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_yearly" className="rtl-label">السعر السنوي (د.ك) *</Label>
              <Input
                id="price_yearly"
                type="number"
                step="0.01"
                value={formData.price_yearly}
                onChange={(e) => handleInputChange('price_yearly', parseFloat(e.target.value) || 0)}
                required
                min="0"
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h4 className="font-medium">مميزات الخطة</h4>
            
            {/* Add Feature */}
            <div className="rtl-flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="أدخل ميزة جديدة"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button type="button" onClick={addFeature} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Features List */}
            <div className="space-y-2">
              {formData.features.map((feature, index) => (
                <div key={index} className="rtl-flex gap-2 p-2 bg-muted rounded">
                  <span className="flex-1">{feature}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">إعدادات الخطة</h4>
            <div className="rtl-flex gap-2">
              <Switch
                id="is_popular"
                checked={formData.is_popular}
                onCheckedChange={(checked) => handleInputChange('is_popular', checked)}
              />
              <Label htmlFor="is_popular" className="rtl-label">خطة شائعة</Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : plan ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
