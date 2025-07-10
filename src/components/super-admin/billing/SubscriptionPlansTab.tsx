import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Star, Users, HardDrive, FileText, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { SubscriptionPlan } from '@/types/saas';
import { PlanFormDialog } from './PlanFormDialog';

export function SubscriptionPlansTab() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      // تحويل البيانات لتتطابق مع النوع المطلوب
      const formattedPlans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      })) as SubscriptionPlan[];
      
      setPlans(formattedPlans);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الخطط",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "تم حذف الخطة بنجاح",
        variant: "default",
      });
      
      fetchPlans();
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الخطة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setIsCreateDialogOpen(false);
    setEditingPlan(null);
    fetchPlans();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">خطط الاشتراك</h2>
          <p className="text-muted-foreground">إدارة خطط الاشتراك المتاحة للعملاء</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2 flex-row-reverse">
          <Plus className="h-4 w-4" />
          إضافة خطة جديدة
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.is_popular ? 'ring-2 ring-primary' : ''}`}>
            {plan.is_popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 ml-1" />
                  الأكثر شعبية
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{plan.price_monthly} د.ك</span>
                  <span className="text-muted-foreground">/شهر</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg">{plan.price_yearly} د.ك</span>
                  <span className="text-muted-foreground">/سنة</span>
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-2 text-sm">
                {plan.max_users_per_tenant && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 ml-2 text-muted-foreground" />
                      المستخدمين
                    </div>
                    <span>{plan.max_users_per_tenant === 999999 ? 'غير محدود' : plan.max_users_per_tenant}</span>
                  </div>
                )}
                {plan.max_vehicles && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Car className="h-4 w-4 ml-2 text-muted-foreground" />
                      المركبات
                    </div>
                    <span>{plan.max_vehicles === 999999 ? 'غير محدود' : plan.max_vehicles}</span>
                  </div>
                )}
                {plan.storage_limit_gb && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <HardDrive className="h-4 w-4 ml-2 text-muted-foreground" />
                      التخزين
                    </div>
                    <span>{plan.storage_limit_gb}GB</span>
                  </div>
                )}
              </div>

              {/* Features */}
              {plan.features && plan.features.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">المميزات:</p>
                  <ul className="text-xs space-y-1">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1 h-1 bg-primary rounded-full ml-2" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-muted-foreground">
                        +{plan.features.length - 3} مميزات أخرى
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Status */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <Badge variant={plan.is_active ? "default" : "secondary"}>
                    {plan.is_active ? "نشط" : "معطل"}
                  </Badge>
                  <span className="text-muted-foreground">كود: {plan.plan_code}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Form Dialog */}
      <PlanFormDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        plan={editingPlan}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}