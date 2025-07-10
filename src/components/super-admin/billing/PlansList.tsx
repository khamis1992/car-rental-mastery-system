import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanFormDialog } from './PlanFormDialog';
import { 
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Users,
  Crown,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  useSubscriptionPlans, 
  useDeleteSubscriptionPlan 
} from '@/hooks/useSaasData';
import { SubscriptionPlan } from '@/types/saas';

const PlansList: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const { data: plans = [], isLoading, error } = useSubscriptionPlans();
  const deletePlanMutation = useDeleteSubscriptionPlan();

  const handleAddPlan = () => {
    setSelectedPlan(null);
    setIsDialogOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setIsDialogOpen(true);
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
      deletePlanMutation.mutate(planId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">جاري تحميل خطط الاشتراك...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">حدث خطأ في تحميل خطط الاشتراك</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">خطط الاشتراك</h2>
          <p className="text-muted-foreground">إدارة خطط الاشتراك المتاحة للمؤسسات</p>
        </div>
        <Button onClick={handleAddPlan} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          إضافة خطة جديدة
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`border-2 transition-colors ${
              plan.is_popular 
                ? 'border-primary bg-primary/5' 
                : 'border-muted hover:border-primary/50'
            }`}
          >
            <CardHeader className="relative">
              {plan.is_popular && (
                <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground">
                  <Crown className="w-3 h-3 ml-1" />
                  الأكثر شيوعاً
                </Badge>
              )}
              
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{plan.plan_name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                      <Edit className="w-4 h-4 ml-2" />
                      تعديل
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeletePlan(plan.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {plan.plan_name_en && (
                <p className="text-sm text-muted-foreground">{plan.plan_name_en}</p>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Pricing */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span className="text-3xl font-bold text-primary">
                    {plan.price_monthly}
                  </span>
                  <span className="text-sm text-muted-foreground">د.ك/شهر</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  أو {plan.price_yearly} د.ك سنوياً
                </p>
              </div>

              {/* Limits */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    المستخدمين
                  </span>
                  <span className="font-medium">{plan.max_users_per_tenant || 'غير محدود'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>المركبات</span>
                  <span className="font-medium">{plan.max_vehicles || 'غير محدود'}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>العقود</span>
                  <span className="font-medium">{plan.max_contracts || 'غير محدود'}</span>
                </div>
                
                {plan.storage_limit_gb && (
                  <div className="flex items-center justify-between">
                    <span>التخزين</span>
                    <span className="font-medium">{plan.storage_limit_gb} GB</span>
                  </div>
                )}
              </div>

              {/* Features */}
              {plan.features && plan.features.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">المميزات:</h4>
                  <ul className="text-sm space-y-1">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="text-muted-foreground flex items-center">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full ml-2 flex-shrink-0"></span>
                        {feature}
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

              {/* Description */}
              {plan.description && (
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {plan.description}
                </p>
              )}

              {/* Status */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? 'نشط' : 'غير نشط'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ترتيب: {plan.sort_order}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {plans.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد خطط اشتراك</h3>
            <p className="text-muted-foreground mb-4">
              ابدأ بإنشاء خطة اشتراك جديدة للمؤسسات
            </p>
            <Button onClick={handleAddPlan}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة خطة جديدة
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan Form Dialog */}
      <PlanFormDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
      />
    </div>
  );
};

export default PlansList;