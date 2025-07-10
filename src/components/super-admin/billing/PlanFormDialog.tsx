import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useCreateSubscriptionPlan, useUpdateSubscriptionPlan } from '@/hooks/useSaasData';
import { SubscriptionPlan } from '@/types/saas';

interface PlanFormDialogProps {
  open: boolean;
  onClose: () => void;
  plan?: SubscriptionPlan | null;
}

export function PlanFormDialog({ open, onClose, plan }: PlanFormDialogProps) {
  const [formData, setFormData] = useState({
    plan_name: '',
    plan_name_en: '',
    plan_code: '',
    description: '',
    price_monthly: 0,
    price_yearly: 0,
    max_users_per_tenant: 5,
    max_vehicles: 10,
    max_contracts: 50,
    storage_limit_gb: 1,
    is_popular: false,
    sort_order: 1,
    features: ''
  });

  const { toast } = useToast();
  const createPlanMutation = useCreateSubscriptionPlan();
  const updatePlanMutation = useUpdateSubscriptionPlan();

  // Reset form when dialog opens/closes or plan changes
  useEffect(() => {
    if (open) {
      if (plan) {
        setFormData({
          plan_name: plan.plan_name || '',
          plan_name_en: plan.plan_name_en || '',
          plan_code: plan.plan_code || '',
          description: plan.description || '',
          price_monthly: plan.price_monthly || 0,
          price_yearly: plan.price_yearly || 0,
          max_users_per_tenant: plan.max_users_per_tenant || 5,
          max_vehicles: plan.max_vehicles || 10,
          max_contracts: plan.max_contracts || 50,
          storage_limit_gb: plan.storage_limit_gb || 1,
          is_popular: plan.is_popular || false,
          sort_order: plan.sort_order || 1,
          features: plan.features?.join('\n') || ''
        });
      } else {
        setFormData({
          plan_name: '',
          plan_name_en: '',
          plan_code: '',
          description: '',
          price_monthly: 0,
          price_yearly: 0,
          max_users_per_tenant: 5,
          max_vehicles: 10,
          max_contracts: 50,
          storage_limit_gb: 1,
          is_popular: false,
          sort_order: 1,
          features: ''
        });
      }
    }
  }, [open, plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const planPayload = {
        ...formData,
        features: formData.features
          .split('\n')
          .filter(feature => feature.trim())
          .map(feature => feature.trim())
      };

      if (plan) {
        await updatePlanMutation.mutateAsync({
          planId: plan.id,
          planData: planPayload
        });
      } else {
        await createPlanMutation.mutateAsync(planPayload);
      }
      
      onClose();
    } catch (error) {
      // Error is handled by the mutation hooks
    }
  };

  const isLoading = createPlanMutation.isPending || updatePlanMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'تعديل خطة الاشتراك' : 'إضافة خطة اشتراك جديدة'}</DialogTitle>
          <DialogDescription>
            {plan ? 'تعديل تفاصيل خطة الاشتراك' : 'إنشاء خطة اشتراك جديدة للعملاء'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plan_name">اسم الخطة (عربي)</Label>
              <Input
                id="plan_name"
                value={formData.plan_name}
                onChange={(e) => setFormData({...formData, plan_name: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="plan_name_en">اسم الخطة (إنجليزي)</Label>
              <Input
                id="plan_name_en"
                value={formData.plan_name_en}
                onChange={(e) => setFormData({...formData, plan_name_en: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="plan_code">رمز الخطة</Label>
            <Input
              id="plan_code"
              value={formData.plan_code}
              onChange={(e) => setFormData({...formData, plan_code: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">الوصف</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_monthly">السعر الشهري ($)</Label>
              <Input
                id="price_monthly"
                type="number"
                step="0.01"
                value={formData.price_monthly}
                onChange={(e) => setFormData({...formData, price_monthly: parseFloat(e.target.value)})}
                required
              />
            </div>
            <div>
              <Label htmlFor="price_yearly">السعر السنوي ($)</Label>
              <Input
                id="price_yearly"
                type="number"
                step="0.01"
                value={formData.price_yearly}
                onChange={(e) => setFormData({...formData, price_yearly: parseFloat(e.target.value)})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_users">أقصى عدد مستخدمين</Label>
              <Input
                id="max_users"
                type="number"
                value={formData.max_users_per_tenant}
                onChange={(e) => setFormData({...formData, max_users_per_tenant: parseInt(e.target.value)})}
                required
              />
            </div>
            <div>
              <Label htmlFor="max_vehicles">أقصى عدد مركبات</Label>
              <Input
                id="max_vehicles"
                type="number"
                value={formData.max_vehicles}
                onChange={(e) => setFormData({...formData, max_vehicles: parseInt(e.target.value)})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_contracts">أقصى عدد عقود</Label>
              <Input
                id="max_contracts"
                type="number"
                value={formData.max_contracts}
                onChange={(e) => setFormData({...formData, max_contracts: parseInt(e.target.value)})}
                required
              />
            </div>
            <div>
              <Label htmlFor="storage_limit">حد التخزين (GB)</Label>
              <Input
                id="storage_limit"
                type="number"
                value={formData.storage_limit_gb}
                onChange={(e) => setFormData({...formData, storage_limit_gb: parseInt(e.target.value)})}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="features">المميزات (كل ميزة في سطر منفصل)</Label>
            <Textarea
              id="features"
              value={formData.features}
              onChange={(e) => setFormData({...formData, features: e.target.value})}
              rows={5}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_popular"
              checked={formData.is_popular}
              onCheckedChange={(checked) => setFormData({...formData, is_popular: checked})}
            />
            <Label htmlFor="is_popular">خطة شائعة</Label>
          </div>

          <div>
            <Label htmlFor="sort_order">ترتيب العرض</Label>
            <Input
              id="sort_order"
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'جاري الحفظ...' : (plan ? 'تحديث' : 'إنشاء')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}