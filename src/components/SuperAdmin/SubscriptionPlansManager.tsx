import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  Edit,
  Trash2,
  Star,
  Users,
  Car,
  FileText,
  HardDrive,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useSubscriptionPlans, useDeleteSubscriptionPlan } from '@/hooks/useSaasData';
import { SubscriptionPlan } from '@/types/saas';
// دالة تنسيق العملة
const formatCurrency = (amount: number) => `${amount.toFixed(3)} د.ك`;
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlansManagerProps {
  onCreatePlan: () => void;
  onEditPlan: (plan: SubscriptionPlan) => void;
}

const SubscriptionPlansManager: React.FC<SubscriptionPlansManagerProps> = ({
  onCreatePlan,
  onEditPlan
}) => {
  const { data: plans, isLoading, error } = useSubscriptionPlans();
  const { mutate: deletePlan } = useDeleteSubscriptionPlan();
  const { toast } = useToast();
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const handleDeletePlan = async (planId: string, planName: string) => {
    if (!confirm(`هل أنت متأكد من حذف خطة "${planName}"؟`)) return;
    
    setDeletingPlanId(planId);
    try {
      deletePlan(planId);
    } catch (error) {
      toast({
        title: 'خطأ في الحذف',
        description: 'حدث خطأ أثناء حذف الخطة',
        variant: 'destructive'
      });
    } finally {
      setDeletingPlanId(null);
    }
  };

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? "default" : "secondary"} className="flex items-center gap-1">
      {isActive ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <AlertCircle className="w-3 h-3" />
      )}
      {isActive ? 'نشطة' : 'غير نشطة'}
    </Badge>
  );

  const getLimitText = (value: number | null | undefined, unit: string) => {
    if (value === null || value === undefined) return 'غير محدود';
    return `${value} ${unit}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">إدارة خطط الاشتراك</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">خطأ في تحميل الخطط</h3>
        <p className="text-muted-foreground mb-4">حدث خطأ أثناء تحميل خطط الاشتراك</p>
        <Button onClick={() => window.location.reload()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">إدارة خطط الاشتراك</h2>
          <p className="text-muted-foreground">
            إدارة وتخصيص خطط الاشتراك المتاحة للعملاء
          </p>
        </div>
        <Button onClick={onCreatePlan} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إضافة خطة جديدة
        </Button>
      </div>

      {!plans || plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد خطط اشتراك</h3>
            <p className="text-muted-foreground mb-4">
              ابدأ بإضافة أول خطة اشتراك للنظام
            </p>
            <Button onClick={onCreatePlan}>
              <Plus className="w-4 h-4 mr-2" />
              إضافة خطة اشتراك
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative transition-all duration-200 hover:shadow-lg ${
                plan.is_popular ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-primary-foreground px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    الأكثر شيوعاً
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-1">{plan.plan_name}</CardTitle>
                    {plan.plan_name_en && (
                      <p className="text-sm text-muted-foreground">{plan.plan_name_en}</p>
                    )}
                  </div>
                  {getStatusBadge(plan.is_active)}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">
                      {formatCurrency(plan.price_monthly)}
                    </span>
                    <span className="text-muted-foreground">/شهر</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    أو {formatCurrency(plan.price_yearly)} سنوياً
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{getLimitText(plan.max_users_per_tenant, 'مستخدم')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <span>{getLimitText(plan.max_vehicles, 'مركبة')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>{getLimitText(plan.max_contracts, 'عقد')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-muted-foreground" />
                      <span>{getLimitText(plan.storage_limit_gb, 'جيجا')}</span>
                    </div>
                  </div>

                  {plan.features && plan.features.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">الميزات المتضمنة:</h4>
                      <ul className="space-y-1">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-xs text-muted-foreground">
                            +{plan.features.length - 3} ميزة أخرى
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEditPlan(plan)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    تعديل
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeletePlan(plan.id, plan.plan_name)}
                    disabled={deletingPlanId === plan.id}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlansManager;