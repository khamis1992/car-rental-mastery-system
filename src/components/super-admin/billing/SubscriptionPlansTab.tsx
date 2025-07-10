import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Star,
  Users,
  Car,
  HardDrive,
  FileText
} from 'lucide-react';
import { useSubscriptionPlans, useDeleteSubscriptionPlan } from '@/hooks/useSaasData';
import { SubscriptionPlan } from '@/types/saas';

export function SubscriptionPlansTab() {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { data: plans = [], isLoading } = useSubscriptionPlans();
  const deletePlanMutation = useDeleteSubscriptionPlan();
  const { toast } = useToast();

  const handleDeletePlan = async (planId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
      try {
        await deletePlanMutation.mutateAsync(planId);
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">خطط الاشتراك</h2>
          <p className="text-muted-foreground">إدارة خطط الاشتراك المتاحة للمؤسسات</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة خطة جديدة
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.is_popular ? 'border-primary/50 shadow-lg' : ''}`}>
            {plan.is_popular && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-primary text-primary-foreground gap-1">
                  <Star className="h-3 w-3" />
                  الأكثر شيوعاً
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
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeletePlan(plan.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {plan.description && (
                <CardDescription>{plan.description}</CardDescription>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">شهري</span>
                  <span className="font-bold text-lg">{plan.price_monthly} د.ك</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">سنوي</span>
                  <span className="font-bold text-lg">{plan.price_yearly} د.ك</span>
                </div>
                {plan.price_yearly < plan.price_monthly * 12 && (
                  <Badge variant="secondary" className="text-xs">
                    توفير {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%
                  </Badge>
                )}
              </div>

              {/* Limits */}
              <div className="space-y-3 pt-4 border-t">
                {plan.max_users_per_tenant && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.max_users_per_tenant} مستخدم</span>
                  </div>
                )}
                {plan.max_vehicles && (
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.max_vehicles} مركبة</span>
                  </div>
                )}
                {plan.max_contracts && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.max_contracts} عقد</span>
                  </div>
                )}
                {plan.storage_limit_gb && (
                  <div className="flex items-center gap-2 text-sm">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.storage_limit_gb} جيجابايت تخزين</span>
                  </div>
                )}
              </div>

              {/* Features */}
              {plan.features && plan.features.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium text-sm">الميزات المتضمنة:</h4>
                  <div className="space-y-1">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <div key={index} className="text-xs text-muted-foreground">
                        • {feature}
                      </div>
                    ))}
                    {plan.features.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        و {plan.features.length - 3} ميزة أخرى...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="pt-2">
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? "نشط" : "غير نشط"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {plans.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Star className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">لا توجد خطط اشتراك</h3>
                <p className="text-sm text-muted-foreground">
                  أنشئ خطة اشتراك جديدة للبدء في تحصيل الرسوم من المؤسسات
                </p>
              </div>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                إضافة خطة جديدة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}