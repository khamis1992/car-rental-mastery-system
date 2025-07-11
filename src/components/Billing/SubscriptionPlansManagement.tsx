import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Crown } from "lucide-react";
import { saasService } from '@/services/saasService';
import { SubscriptionPlan, PlanFormData } from '@/types/unified-saas';

const SubscriptionPlansManagement: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    sort_order: 0
  });

  const [featuresInput, setFeaturesInput] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await saasService.getAllSubscriptionPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل خطط الاشتراك",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const planData = {
        ...formData,
        features: featuresInput.split('\n').filter(f => f.trim() !== '')
      };

      if (editingPlan) {
        await saasService.updateSubscriptionPlan(editingPlan.id, planData);
        toast({
          title: "نجح",
          description: "تم تحديث الخطة بنجاح",
        });
      } else {
        await saasService.createSubscriptionPlan(planData);
        toast({
          title: "نجح",
          description: "تم إنشاء الخطة بنجاح",
        });
      }

      setIsDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      loadPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الخطة",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      plan_name_en: plan.plan_name_en || '',
      plan_code: plan.plan_code,
      description: plan.description || '',
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      features: plan.features,
      max_tenants: plan.max_tenants,
      max_users_per_tenant: plan.max_users_per_tenant,
      max_vehicles: plan.max_vehicles,
      max_contracts: plan.max_contracts,
      storage_limit_gb: plan.storage_limit_gb,
      is_popular: plan.is_popular,
      sort_order: plan.sort_order
    });
    setFeaturesInput(plan.features.join('\n'));
    setIsDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;

    try {
      await saasService.deleteSubscriptionPlan(planId);
      toast({
        title: "نجح",
        description: "تم حذف الخطة بنجاح",
      });
      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast({
        title: "خطأ",
        description: "فشل في حذف الخطة",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
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
      sort_order: 0
    });
    setFeaturesInput('');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">إدارة خطط الاشتراك</h2>
          <p className="text-muted-foreground">إدارة خطط الاشتراك المختلفة للنظام</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingPlan(null); }}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة خطة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'تعديل خطة الاشتراك' : 'إضافة خطة اشتراك جديدة'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan_name">اسم الخطة (عربي)</Label>
                  <Input
                    id="plan_name"
                    value={formData.plan_name}
                    onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                    placeholder="خطة أساسية"
                  />
                </div>
                <div>
                  <Label htmlFor="plan_name_en">اسم الخطة (إنجليزي)</Label>
                  <Input
                    id="plan_name_en"
                    value={formData.plan_name_en}
                    onChange={(e) => setFormData({ ...formData, plan_name_en: e.target.value })}
                    placeholder="Basic Plan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan_code">رمز الخطة</Label>
                  <Input
                    id="plan_code"
                    value={formData.plan_code}
                    onChange={(e) => setFormData({ ...formData, plan_code: e.target.value })}
                    placeholder="BASIC"
                  />
                </div>
                <div>
                  <Label htmlFor="sort_order">ترتيب العرض</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف الخطة..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_monthly">السعر الشهري (د.ك)</Label>
                  <Input
                    id="price_monthly"
                    type="number"
                    step="0.001"
                    value={formData.price_monthly}
                    onChange={(e) => setFormData({ ...formData, price_monthly: parseFloat(e.target.value) })}
                    placeholder="0.000"
                  />
                </div>
                <div>
                  <Label htmlFor="price_yearly">السعر السنوي (د.ك)</Label>
                  <Input
                    id="price_yearly"
                    type="number"
                    step="0.001"
                    value={formData.price_yearly}
                    onChange={(e) => setFormData({ ...formData, price_yearly: parseFloat(e.target.value) })}
                    placeholder="0.000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="features">الميزات (كل ميزة في سطر منفصل)</Label>
                <Textarea
                  id="features"
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  placeholder="إدارة المركبات&#10;إدارة العقود&#10;التقارير الأساسية"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_users">الحد الأقصى للمستخدمين</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={formData.max_users_per_tenant || ''}
                    onChange={(e) => setFormData({ ...formData, max_users_per_tenant: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="غير محدود"
                  />
                </div>
                <div>
                  <Label htmlFor="max_vehicles">الحد الأقصى للمركبات</Label>
                  <Input
                    id="max_vehicles"
                    type="number"
                    value={formData.max_vehicles || ''}
                    onChange={(e) => setFormData({ ...formData, max_vehicles: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="غير محدود"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_contracts">الحد الأقصى للعقود</Label>
                  <Input
                    id="max_contracts"
                    type="number"
                    value={formData.max_contracts || ''}
                    onChange={(e) => setFormData({ ...formData, max_contracts: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="غير محدود"
                  />
                </div>
                <div>
                  <Label htmlFor="storage_limit">مساحة التخزين (جيجابايت)</Label>
                  <Input
                    id="storage_limit"
                    type="number"
                    value={formData.storage_limit_gb || ''}
                    onChange={(e) => setFormData({ ...formData, storage_limit_gb: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="غير محدود"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_popular"
                  checked={formData.is_popular}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_popular: checked })}
                />
                <Label htmlFor="is_popular">خطة شائعة</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSave}>
                  {editingPlan ? 'تحديث' : 'إنشاء'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            {plan.is_popular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="bg-gradient-primary text-primary-foreground">
                  <Crown className="w-3 h-3 ml-1" />
                  الأكثر شعبية
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {plan.plan_name_en && (
                <p className="text-sm text-muted-foreground">{plan.plan_name_en}</p>
              )}
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(plan.price_monthly)}/شهر
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatPrice(plan.price_yearly)}/سنة
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {plan.description && (
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              )}
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">الميزات:</h4>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">الحدود:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>المستخدمين: {plan.max_users_per_tenant || 'غير محدود'}</div>
                    <div>المركبات: {plan.max_vehicles || 'غير محدود'}</div>
                    <div>العقود: {plan.max_contracts || 'غير محدود'}</div>
                    <div>التخزين: {plan.storage_limit_gb ? `${plan.storage_limit_gb} جيجا` : 'غير محدود'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? 'نشطة' : 'غير نشطة'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    رمز: {plan.plan_code}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">لا توجد خطط اشتراك متاحة</p>
          <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
            إضافة خطة جديدة
          </Button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlansManagement;