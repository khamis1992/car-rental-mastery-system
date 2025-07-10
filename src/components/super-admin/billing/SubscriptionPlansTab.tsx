import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Star, Users, HardDrive, FileText } from 'lucide-react';
import { PlanFormDialog } from './PlanFormDialog';

export function SubscriptionPlansTab() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const { toast } = useToast();

  // Mock data - replace with real data from API
  const plans = [
    {
      id: '1',
      plan_name: 'الخطة الأساسية',
      plan_name_en: 'Basic Plan',
      plan_code: 'basic',
      description: 'خطة مناسبة للشركات الصغيرة',
      price_monthly: 29.99,
      price_yearly: 299.99,
      features: ['إدارة العقود', 'إدارة المركبات', 'التقارير الأساسية', 'دعم بالبريد الإلكتروني'],
      max_users_per_tenant: 5,
      max_vehicles: 10,
      max_contracts: 50,
      storage_limit_gb: 1,
      is_active: true,
      is_popular: false,
      sort_order: 1,
      subscribers_count: 15
    },
    {
      id: '2',
      plan_name: 'الخطة المتقدمة',
      plan_name_en: 'Professional Plan',
      plan_code: 'professional',
      description: 'خطة مناسبة للشركات المتوسطة',
      price_monthly: 59.99,
      price_yearly: 599.99,
      features: ['جميع مميزات الخطة الأساسية', 'تقارير متقدمة', 'إدارة المخالفات', 'النسخ الاحتياطي التلقائي', 'دعم هاتفي'],
      max_users_per_tenant: 25,
      max_vehicles: 50,
      max_contracts: 200,
      storage_limit_gb: 5,
      is_active: true,
      is_popular: true,
      sort_order: 2,
      subscribers_count: 28
    },
    {
      id: '3',
      plan_name: 'خطة المؤسسات',
      plan_name_en: 'Enterprise Plan',
      plan_code: 'enterprise',
      description: 'خطة مناسبة للشركات الكبيرة',
      price_monthly: 149.99,
      price_yearly: 1499.99,
      features: ['جميع المميزات', 'مستأجرين متعددين', 'مستخدمين غير محدودين', 'API مخصص', 'دعم مخصص 24/7', 'تدريب مخصص'],
      max_users_per_tenant: 999999,
      max_vehicles: 999999,
      max_contracts: 999999,
      storage_limit_gb: 100,
      is_active: true,
      is_popular: false,
      sort_order: 3,
      subscribers_count: 12
    }
  ];

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (planId: string) => {
    // Implement delete logic
    toast({
      title: 'تم حذف الخطة',
      description: 'تم حذف خطة الاشتراك بنجاح',
    });
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">خطط الاشتراك</h2>
          <p className="text-muted-foreground">إدارة خطط الاشتراك المتاحة للعملاء</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
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
                  <span className="text-2xl font-bold">${plan.price_monthly}</span>
                  <span className="text-muted-foreground">/شهر</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg">${plan.price_yearly}</span>
                  <span className="text-muted-foreground">/سنة</span>
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 ml-2 text-muted-foreground" />
                    المستخدمين
                  </div>
                  <span>{plan.max_users_per_tenant === 999999 ? 'غير محدود' : plan.max_users_per_tenant}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 ml-2 text-muted-foreground" />
                    المركبات
                  </div>
                  <span>{plan.max_vehicles === 999999 ? 'غير محدود' : plan.max_vehicles}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <HardDrive className="h-4 w-4 ml-2 text-muted-foreground" />
                    التخزين
                  </div>
                  <span>{plan.storage_limit_gb}GB</span>
                </div>
              </div>

              {/* Features */}
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

              {/* Stats */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">عدد المشتركين</span>
                  <Badge variant="secondary">{plan.subscribers_count}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Form Dialog */}
      <PlanFormDialog 
        open={isCreateDialogOpen}
        onClose={closeDialog}
        plan={editingPlan}
      />
    </div>
  );
}